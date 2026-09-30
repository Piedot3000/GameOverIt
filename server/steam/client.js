import { SteamError, unconfigured, privateProfile, notFound, upstream } from "./errors.js";

const BASE = "https://api.steampowered.com";
const TIMEOUT_MS = 10_000;                       // Steam being slow must not hang a request

export const isConfigured = () => Boolean(process.env.STEAM_API_KEY);

function key() {
  if (!isConfigured()) throw unconfigured();
  return process.env.STEAM_API_KEY;
}

/** One place that talks to Steam, so the key and the failure mapping are never duplicated. */
async function call(path, params) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("key", key());
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw upstream(err.name === "TimeoutError" ? "timed out" : "network error");
  }
  if (res.status === 429) throw upstream("rate limited");
  if (!res.ok) throw upstream(`HTTP ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw upstream("unreadable response");
  }
}

/** Vanity name -> 64-bit SteamID. Returns null when Steam does not know the name. */
export async function resolveVanity(vanity) {
  const data = await call("/ISteamUser/ResolveVanityURL/v0001/", { vanityurl: vanity });
  const r = data?.response;
  // success: 1 means resolved; success: 42 means "no match".
  if (!r || r.success !== 1 || !r.steamid) return null;
  return r.steamid;
}

/** Public profile fields only. A private profile still returns a summary, with fields missing. */
export async function getPlayerSummary(steamid64) {
  const data = await call("/ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamid64 });
  const player = data?.response?.players?.[0];
  if (!player) return null;
  return {
    personaName: player.personaname ?? null,
    avatarUrl: player.avatarfull ?? null,
    profileUrl: player.profileurl ?? null,
  };
}

/**
 * Owned games with playtime. An EMPTY ARRAY is not an error on Steam's side: it is what
 * a private ("game details" hidden) profile returns with HTTP 200. Callers must treat
 * empty as "cannot read" rather than "owns nothing".
 */
export async function getOwnedGames(steamid64) {
  const data = await call("/IPlayerService/GetOwnedGames/v0001/", {
    steamid: steamid64,
    include_appinfo: 1,
    include_played_free_games: 1,
  });

  const response = data?.response;
  // Steam omits `games` entirely when the library is not readable; that is the
  // private signal, and it is different from a profile that genuinely owns nothing.
  // `{ response: {} }` is the same signal — it has no `games` key either — which is
  // why this tests for `undefined` rather than for falsiness.
  if (!response || response.games === undefined) throw privateProfile();

  return response.games.map((g) => ({
    appid: g.appid,
    name: g.name ?? `App ${g.appid}`,
    playtimeForever: g.playtime_forever ?? 0,        // minutes
    playtime2Weeks: g.playtime_2weeks ?? 0,          // minutes, absent when not recent
    rtimeLastPlayed: g.rtime_last_played ?? null,
    // img_icon_url is a hash, not a URL — the full path is built from it.
    iconUrl: g.img_icon_url
      ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
      : null,
  }));
}
