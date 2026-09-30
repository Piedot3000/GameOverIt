/**
 * Every way the Steam integration can fail, named once.
 *
 * UNCONFIGURED -> 503  no STEAM_API_KEY. The feature is off, not broken.
 * PRIVATE      -> 200  the API succeeded and returned nothing, because the profile's
 *                      game details are hidden. This must NOT be reported as
 *                      "0 games imported" with no explanation — it is its own state.
 * NOT_FOUND    -> 400  the vanity name or id does not resolve to a profile.
 * UPSTREAM     -> 502  Steam returned a non-200, a timeout, or a 429.
 */
export class SteamError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "SteamError";
    this.code = code;
    this.status = status;
  }
}

export const unconfigured = () =>
  new SteamError("UNCONFIGURED", "Steam is not configured on this server.", 503);

export const privateProfile = () =>
  new SteamError(
    "PRIVATE",
    "This profile's game details are private, so its library cannot be read. Set Game details to Public in Steam's privacy settings and sync again.",
    200
  );

export const notFound = (what) =>
  new SteamError("NOT_FOUND", `Steam could not find a profile for “${what}”.`, 400);

export const upstream = (detail) =>
  new SteamError("UPSTREAM", `Steam is unavailable right now (${detail}). Try again shortly.`, 502);
