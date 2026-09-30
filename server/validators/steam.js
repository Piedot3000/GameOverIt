const STEAMID64 = /^[0-9]{17}$/;
const PROFILE_URL = /steamcommunity\.com\/(id|profiles)\/([^/?#]+)/i;

/**
 * Accepts a 17-digit SteamID64, a full profile URL, or a bare vanity name.
 * Returns { value: { steamid64 } | { vanity } , errors }.
 */
export function validateProfileInput(body) {
  const errors = {};
  const raw = typeof body?.profileInput === "string" ? body.profileInput.trim() : "";

  if (!raw) {
    errors.profileInput = "Enter a Steam profile URL, a vanity name, or a 17-digit SteamID64.";
    return { value: null, errors };
  }
  if (raw.length > 200) {
    errors.profileInput = "That input is too long to be a profile URL or name.";
    return { value: null, errors };
  }
  if (STEAMID64.test(raw)) return { value: { steamid64: raw }, errors };

  const fromUrl = raw.match(PROFILE_URL);
  if (fromUrl) {
    const [, kind, id] = fromUrl;
    return kind.toLowerCase() === "profiles" && STEAMID64.test(id)
      ? { value: { steamid64: id }, errors }
      : { value: { vanity: id }, errors };
  }
  if (/^https?:\/\//i.test(raw)) {
    errors.profileInput = "That is a URL, but not a Steam Community profile URL.";
    return { value: null, errors };
  }
  return { value: { vanity: raw }, errors };
}
