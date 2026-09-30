// The real client. Every function here talks to YOUR Express API.
//
// mockApi.js implements the same nine functions against localStorage. The two
// must agree on the 13-key camelCase game shape, on which inputs are refused,
// and on the shape of a refusal, so a component written against one keeps
// working against the other.

const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * Everything the UI can catch. `status` is the HTTP status (0 = never reached
 * the server); `fields` is the server's per-field error map, so a form can put
 * a message under the input that caused it instead of branching on HTTP detail.
 */
export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields || {}
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // A network failure is not an HTTP error: say so plainly rather than
    // "undefined 0". Status 0 means the request never reached a server.
    throw new ApiError(`Cannot reach the API at ${BASE}. Is the server running?`, 0, {})
  }

  if (res.status === 204) return null

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    // The server's body is { error, fields }. 503 from /api/steam/* means
    // "not configured on this server" -- the Steam screen needs to tell that
    // apart from a 400, so the status is carried through untouched.
    throw new ApiError(payload.error || `Request failed (${res.status})`, res.status, payload.fields)
  }
  return payload
}

/**
 * an HTML number input's value is ALWAYS a string, and the server's
 * validator requires a real integer -- so handing "8" straight through is a 400
 * on an ordinary form submission. Coerce here, once, for both implementations:
 * "" and null mean "not rated"; a string that parses as a finite number becomes
 * that number.
 *
 * A string that does NOT parse is passed through untouched rather than coerced
 * to NaN: JSON.stringify renders NaN as null, so "abc" would arrive as "not
 * rated" and a mistyped rating would be silently saved as no rating at all. Left
 * alone, the server refuses it with the field-level message the form expects.
 *
 * The same hole exists one layer up for a rating that is ALREADY a non-finite
 * number -- an ordinary form doing `rating: Number(value)` on an empty or
 * non-numeric field hands us NaN, not a string. Passed through untouched,
 * JSON.stringify renders it as null and the server accepts it as "not rated"
 * with a 200, while the mock refuses it: the two implementations disagree AND an
 * invalid value is silently accepted. So a non-finite number is stringified,
 * which puts it on the exact same path as "abc" -- both are now refused with the
 * rating field message.
 */
export function normalizeInput(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return input
  if (!('rating' in input)) return input
  const { rating } = input
  if (rating === '' || rating === null) return { ...input, rating: null }
  if (typeof rating === 'number' && !Number.isFinite(rating)) return { ...input, rating: String(rating) }
  if (typeof rating !== 'string') return input
  const n = Number(rating)
  return { ...input, rating: rating.trim() !== '' && Number.isFinite(n) ? n : rating }
}

// "" and undefined mean "no filter", so they are not sent at all. "all" is the
// spelling of "no filter" for `status` ONLY (the server's status allow-list is
// `all` plus the four statuses); for every other parameter it is NOT in the
// allow-list, so it IS sent, deliberately: an unknown sort must come back as the
// server's 400, never be quietly dropped and answered with the default sort --
// the "silently defaulted" behaviour the requirement forbids.
const qs = (params) => {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    if (k === 'status' && v === 'all') continue
    sp.set(k, v)
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const listGames = (params = {}) => request(`/api/games${qs(params)}`)
export const getGame = (id) => request(`/api/games/${id}`)
export const createGame = (input) => request('/api/games', { method: 'POST', body: normalizeInput(input) })
export const updateGame = (id, patch) => request(`/api/games/${id}`, { method: 'PATCH', body: normalizeInput(patch) })
export const deleteGame = (id) => request(`/api/games/${id}`, { method: 'DELETE' })

export const getSteamProfile = () => request('/api/steam/profile')
export const connectSteam = (profileInput) => request('/api/steam/connect', { method: 'POST', body: { profileInput } })
export const syncSteam = () => request('/api/steam/sync', { method: 'POST' })
export const disconnectSteam = () => request('/api/steam/profile', { method: 'DELETE' })