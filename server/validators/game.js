export const STATUSES = ["want_to_play", "playing", "completed", "abandoned"];
export const SORTS = ["title", "added", "updated", "rating"];

const isBlank = (v) => typeof v !== "string" || v.trim() === "";

function checkFields(input, { partial }) {
  const errors = {};
  const values = {};
  const has = (k) => input[k] !== undefined;

  if (has("title") || !partial) {
    if (isBlank(input.title)) errors.title = "Title is required.";
    else if (input.title.trim().length > 200) errors.title = "Title must be 200 characters or fewer.";
    else values.title = input.title.trim();
  }

  if (has("platform") || !partial) {
    const p = input.platform === undefined ? "PC" : input.platform;
    if (isBlank(p)) errors.platform = "Platform is required.";
    else if (p.trim().length > 60) errors.platform = "Platform must be 60 characters or fewer.";
    else values.platform = p.trim();
  }

  if (has("status") || !partial) {
    const s = input.status === undefined ? "want_to_play" : input.status;
    if (!STATUSES.includes(s)) errors.status = `Status must be one of: ${STATUSES.join(", ")}.`;
    else values.status = s;
  }

  // rating: absent, null, or "" all mean "not rated"
  if (has("rating")) {
    if (input.rating === null || input.rating === "") values.rating = null;
    else if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10)
      errors.rating = "Rating must be a whole number from 1 to 10.";
    else values.rating = input.rating;
  }

  if (has("hoursPlayed") || has("hours_played")) {
    const raw = has("hoursPlayed") ? input.hoursPlayed : input.hours_played;
    const n = raw === "" || raw === null ? 0 : Number(raw);
    if (!Number.isFinite(n)) errors.hoursPlayed = "Hours played must be a number.";
    else if (n < 0) errors.hoursPlayed = "Hours played cannot be negative.";
    else if (n > 99999) errors.hoursPlayed = "Hours played is implausibly large.";
    else values.hoursPlayed = Math.round(n * 10) / 10;
  }

  if (has("coverUrl") || has("cover_url")) {
    const raw = has("coverUrl") ? input.coverUrl : input.cover_url;
    if (raw === null || raw === "") values.coverUrl = null;
    else if (typeof raw !== "string" || !/^https?:\/\/.+/i.test(raw.trim()))
      errors.coverUrl = "Cover URL must start with http:// or https://";
    else if (raw.trim().length > 500) errors.coverUrl = "Cover URL is too long.";
    else values.coverUrl = raw.trim().replace(/^https?:\/\//i, (m) => m.toLowerCase());
  }

  if (has("notes")) {
    if (input.notes === null || input.notes === "") values.notes = null;
    else if (typeof input.notes !== "string") errors.notes = "Notes must be text.";
    else if (input.notes.length > 2000) errors.notes = "Notes must be 2000 characters or fewer.";
    else values.notes = input.notes;
  }

  return { values, errors };
}

export function validateGameInput(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { values: {}, errors: { body: "Expected a JSON object." } };
  }
  return checkFields(body, { partial: false });
}

export function validateGamePatch(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { values: {}, errors: { body: "Expected a JSON object." } };
  }
  const { values, errors } = checkFields(body, { partial: true });
  if (Object.keys(values).length === 0 && Object.keys(errors).length === 0) {
    errors.body = "No updatable fields were provided.";
  }
  return { values, errors };
}
