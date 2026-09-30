// The simulated backend.
//
// Same nine functions, same 13-key game shape, and the same shape of failure as
// httpApi.js, so components cannot tell the two apart. Data lives in the
// visitor's own browser and goes no further.
//
// This exists so the deployed demo works with no server at all. It is NOT a
// finished project: it is a faithful imitation of what the real API does, which
// is why the rules and messages below are copied from server/validators/game.js
// rather than invented here. Where the two disagree, the mock is wrong.

import { ApiError, normalizeInput } from './httpApi.js'

const GAMES_KEY = 'goi.games'
const PROFILE_KEY = 'goi.steamProfile'
const STATUSES = ['want_to_play', 'playing', 'completed', 'abandoned']
const SORTS = ['title', 'added', 'updated', 'rating']

// A real network is not instant. Keeping the delay is what forces a loading
// state to exist from the start instead of being discovered on switch-over.
const sleep = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms))

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    // Corrupted storage. Start again rather than crashing the app.
    localStorage.removeItem(key)
    return fallback
  }
}

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const fail = (errors) => {
  throw new ApiError('Invalid input', 400, errors)
}

const notFound = () => {
  throw new ApiError('Game not found', 404, {})
}

const badId = () => {
  throw new ApiError('Invalid input', 400, { id: 'Game id must be a positive whole number.' })
}

// startedAt / finishedAt are DATE columns -- date-only, no time, no zone.
// Build the string from LOCAL components. `toISOString().slice(0, 10)` is the
// defect the server had: at UTC+8 it returns YESTERDAY's date before 08:00, so a
// game finished in the morning would be stamped a day early -- and the mock
// would disagree with the server, which is the one thing it may not do.
const today = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/**
 * Mirrors server/validators/game.js: same rules, same messages, same
 * snake_case aliases the server accepts. Returns { values, errors } where
 * `values` holds only the fields that were supplied and are valid.
 */
function validate(body, { partial }) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { values: {}, errors: { body: 'Expected a JSON object.' } }
  }

  const errors = {}
  const values = {}
  const has = (k) => body[k] !== undefined
  const isBlank = (v) => typeof v !== 'string' || v.trim() === ''

  if (has('title') || !partial) {
    if (isBlank(body.title)) errors.title = 'Title is required.'
    else if (body.title.trim().length > 200) errors.title = 'Title must be 200 characters or fewer.'
    else values.title = body.title.trim()
  }

  if (has('platform') || !partial) {
    const p = body.platform === undefined ? 'PC' : body.platform
    if (isBlank(p)) errors.platform = 'Platform is required.'
    else if (p.trim().length > 60) errors.platform = 'Platform must be 60 characters or fewer.'
    else values.platform = p.trim()
  }

  if (has('status') || !partial) {
    const s = body.status === undefined ? 'want_to_play' : body.status
    if (!STATUSES.includes(s)) errors.status = `Status must be one of: ${STATUSES.join(', ')}.`
    else values.status = s
  }

  // rating: absent, null, or "" all mean "not rated"
  if (has('rating')) {
    if (body.rating === null || body.rating === '') values.rating = null
    else if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 10)
      errors.rating = 'Rating must be a whole number from 1 to 10.'
    else values.rating = body.rating
  }

  if (has('hoursPlayed') || has('hours_played')) {
    const raw = has('hoursPlayed') ? body.hoursPlayed : body.hours_played
    const n = raw === '' || raw === null ? 0 : Number(raw)
    if (!Number.isFinite(n)) errors.hoursPlayed = 'Hours played must be a number.'
    else if (n < 0) errors.hoursPlayed = 'Hours played cannot be negative.'
    else if (n > 99999) errors.hoursPlayed = 'Hours played is implausibly large.'
    else values.hoursPlayed = Math.round(n * 10) / 10
  }

  if (has('coverUrl') || has('cover_url')) {
    const raw = has('coverUrl') ? body.coverUrl : body.cover_url
    if (raw === null || raw === '') values.coverUrl = null
    else if (typeof raw !== 'string' || !/^https?:\/\/.+/i.test(raw.trim()))
      errors.coverUrl = 'Cover URL must start with http:// or https://'
    else if (raw.trim().length > 500) errors.coverUrl = 'Cover URL is too long.'
    // no scheme normalisation here on purpose. This is the CLIENT-SIDE
    // mock: it writes to localStorage, not Postgres, so there is no
    // case-sensitive `~ '^https?://'` CHECK to satisfy. The real validator
    // normalises the scheme on its way into the database.
    else values.coverUrl = raw.trim()
  }

  if (has('notes')) {
    if (body.notes === null || body.notes === '') values.notes = null
    else if (typeof body.notes !== 'string') errors.notes = 'Notes must be text.'
    else if (body.notes.length > 2000) errors.notes = 'Notes must be 2000 characters or fewer.'
    else values.notes = body.notes
  }

  return { values, errors }
}

/** Four rows, one per status, so a filter and every count can be exercised. */
function seedIfEmpty() {
  if (read(GAMES_KEY, null)) return
  write(GAMES_KEY, [
    { id: 1, title: 'Hollow Knight', platform: 'PC', status: 'completed', rating: 10, hoursPlayed: 62.5,
      coverUrl: null, notes: 'Demo data. The real list lives in Postgres.', steamAppid: null,
      startedAt: '2024-01-10', finishedAt: '2024-03-02', createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z' },
    { id: 2, title: 'Elden Ring', platform: 'PC', status: 'playing', rating: null, hoursPlayed: 116,
      coverUrl: null, notes: 'Stuck on Malenia.', steamAppid: null,
      startedAt: '2024-06-21', finishedAt: null, createdAt: '2024-06-21T00:00:00Z', updatedAt: '2024-06-21T00:00:00Z' },
    { id: 3, title: 'Ninja Gaiden Black', platform: 'Xbox', status: 'abandoned', rating: 7, hoursPlayed: 5,
      coverUrl: null, notes: null, steamAppid: null,
      startedAt: '2024-04-01', finishedAt: '2024-04-06', createdAt: '2024-04-01T00:00:00Z', updatedAt: '2024-04-06T00:00:00Z' },
    { id: 4, title: 'Nine Sols', platform: 'PC', status: 'want_to_play', rating: null, hoursPlayed: 0,
      coverUrl: null, notes: null, steamAppid: null, startedAt: null, finishedAt: null,
      createdAt: '2024-09-01T00:00:00Z', updatedAt: '2024-09-01T00:00:00Z' },
  ])
}

// every comparator needs a unique tie-break, because `added`
// is the default sort and two rows written in the same millisecond would
// otherwise come back in whatever order the array happens to hold.
const ORDER = {
  title: (a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()) || a.id - b.id,
  added: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id,
  updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) || b.id - a.id,
  rating: (a, b) =>
    (b.rating ?? -1) - (a.rating ?? -1) ||
    a.title.toLowerCase().localeCompare(b.title.toLowerCase()) ||
    a.id - b.id,
}

const nextId = (games) => games.reduce((max, g) => Math.max(max, g.id), 0) + 1

export async function listGames({ status = 'all', q = '', sort = 'added' } = {}) {
  await sleep()
  seedIfEmpty()

  // The same allow-lists as the server, refused the same way: an unknown value
  // must 400, never quietly fall back to "everything" (the UI would show a full
  // list for a typo and look correct while being wrong).
  if (status !== 'all' && !STATUSES.includes(status)) {
    fail({ status: `Unknown status filter. Allowed: all, ${STATUSES.join(', ')}.` })
  }
  if (!SORTS.includes(sort)) fail({ sort: `Unknown sort. Allowed: ${SORTS.join(', ')}.` })
  if (typeof q !== 'string') fail({ q: 'Search must be text.' })

  const all = read(GAMES_KEY, [])
  let games = status === 'all' ? all : all.filter((g) => g.status === status)
  const needle = q.trim().toLowerCase()
  if (needle) games = games.filter((g) => g.title.toLowerCase().includes(needle))
  games = [...games].sort(ORDER[sort])

  // Counts cover the WHOLE backlog, not the current filter, so the chips stay
  // meaningful while a filter is active -- and all four statuses are always
  // present, zeros included.
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]))
  for (const g of all) counts[g.status] = (counts[g.status] ?? 0) + 1

  return { games, counts }
}

export async function getGame(id) {
  await sleep(60)
  seedIfEmpty()
  // The id arrives from a URL segment, which react-router hands over as a STRING
  // (useParams), and server/handlers/games.js does `Number(req.params.id)`
  // before its own `Number.isInteger` guard. So coerce FIRST and guard the
  // coerced value: guarding the raw argument would 400 `getGame("2")` here while
  // the real API answers 200 -- the Task 10 detail route would work live and
  // fail in demo mode.
  const n = Number(id)
  if (!Number.isInteger(n) || n < 1) badId()
  const game = read(GAMES_KEY, []).find((g) => g.id === n)
  if (!game) notFound()
  return game
}

export async function createGame(input) {
  await sleep()
  seedIfEmpty()

  const { values, errors } = validate(normalizeInput(input), { partial: false })
  if (Object.keys(errors).length) fail(errors)

  const games = read(GAMES_KEY, [])
  const now = new Date().toISOString()
  const game = {
    id: nextId(games),
    ...values,
    rating: values.rating ?? null,
    hoursPlayed: values.hoursPlayed ?? 0,
    coverUrl: values.coverUrl ?? null,
    notes: values.notes ?? null,
    steamAppid: null,
    // The server stamps these from the status at insert time, the same way.
    startedAt: values.status === 'playing' ? today() : null,
    finishedAt: ['completed', 'abandoned'].includes(values.status) ? today() : null,
    createdAt: now,
    updatedAt: now,
  }
  write(GAMES_KEY, [game, ...games])
  return game
}

export async function updateGame(id, patch) {
  await sleep()
  seedIfEmpty()
  // Same coercion as getGame(), for the same reason.
  const n = Number(id)
  if (!Number.isInteger(n) || n < 1) badId()

  const games = read(GAMES_KEY, [])
  const i = games.findIndex((g) => g.id === n)
  if (i === -1) notFound()

  const { values, errors } = validate(normalizeInput(patch), { partial: true })
  if (Object.keys(errors).length) fail(errors)
  if (Object.keys(values).length === 0) fail({ body: 'No updatable fields were provided.' })

  // Only the fields actually supplied are written -- a PATCH must not blank the
  // others -- and the lifecycle dates follow the transition, without touching a
  // date that is already set.
  const current = games[i]
  const next = { ...current, ...values, updatedAt: new Date().toISOString() }
  if (values.status === 'playing') next.startedAt = current.startedAt ?? today()
  if (values.status === 'completed' || values.status === 'abandoned') next.finishedAt = current.finishedAt ?? today()
  if (values.status === 'want_to_play' || values.status === 'playing') next.finishedAt = null

  games[i] = next
  write(GAMES_KEY, games)
  return next
}

export async function deleteGame(id) {
  await sleep(60)
  seedIfEmpty()
  // Same coercion as getGame(), for the same reason.
  const n = Number(id)
  if (!Number.isInteger(n) || n < 1) badId()

  const games = read(GAMES_KEY, [])
  const next = games.filter((g) => g.id !== n)
  if (next.length === games.length) notFound()
  write(GAMES_KEY, next)
  return null
}

/* ---- Steam, mocked. Labelled as a stub wherever it surfaces in the UI. ---- */

export async function getSteamProfile() {
  await sleep(60)
  return read(PROFILE_KEY, null)
}

export async function connectSteam(profileInput) {
  await sleep()
  const raw = String(profileInput ?? '').trim()
  if (!raw) {
    fail({ profileInput: 'Enter a Steam profile URL, a vanity name, or a 17-digit SteamID64.' })
  }
  if (/private_tester/i.test(raw)) {
    // The failure that must never look like success: a private
    // profile connects, but is marked not public and syncs nothing.
    const profile = {
      steamid64: '76561190000000002', personaName: 'Private Tester', avatarUrl: null,
      profileUrl: 'https://steamcommunity.com/profiles/76561190000000002', isPublic: false, lastSyncedAt: null,
    }
    write(PROFILE_KEY, profile)
    return profile
  }
  const steamid64 = /^[0-9]{17}$/.test(raw) ? raw : '76561190000000001'
  const profile = {
    steamid64, personaName: raw.replace(/^.*\//, '') || 'demo_player', avatarUrl: null,
    profileUrl: `https://steamcommunity.com/profiles/${steamid64}`, isPublic: true, lastSyncedAt: null,
  }
  write(PROFILE_KEY, profile)
  return profile
}

export async function syncSteam() {
  await sleep(400)
  const profile = read(PROFILE_KEY, null)
  if (!profile) throw new ApiError('No Steam profile is connected.', 404, {})
  if (!profile.isPublic) {
    // The shape the server returns and the UI branches on: a private library is a
    // 200 WITH an explanation, never "0 imported".
    return {
      imported: 0, updated: 0, skipped: 0, private: true,
      message: "This profile's game details are private, so its library cannot be read. Set Game details to Public in Steam's privacy settings and sync again.",
    }
  }

  const games = read(GAMES_KEY, [])
  const demo = [
    { title: 'Signalis', appid: 1262350, hours: 0 },
    { title: 'Animal Well', appid: 813230, hours: 0 },
    { title: 'Hades II', appid: 1145350, hours: 12.4 },
  ]
  let imported = 0
  let updated = 0
  for (const d of demo) {
    const existing = games.find((g) => g.steamAppid === d.appid)
    if (existing) {
      // Hours only: a sync must never overwrite a status or rating the user set.
      existing.hoursPlayed = d.hours
      existing.updatedAt = new Date().toISOString()
      updated++
    } else {
      const now = new Date().toISOString()
      games.unshift({
        id: nextId(games), title: d.title, platform: 'Steam', status: 'want_to_play', rating: null,
        hoursPlayed: d.hours, coverUrl: null, notes: null, steamAppid: d.appid,
        startedAt: null, finishedAt: null, createdAt: now, updatedAt: now,
      })
      imported++
    }
  }
  write(GAMES_KEY, games)
  profile.lastSyncedAt = new Date().toISOString()
  write(PROFILE_KEY, profile)
  return { imported, updated, skipped: 0 }
}

export async function disconnectSteam() {
  await sleep(60)
  localStorage.removeItem(PROFILE_KEY)
  return null
}