import { pool } from "../db/pool.js";
import { validateGameInput, validateGamePatch, SORTS, STATUSES } from "../validators/game.js";

/**
 * A DATE column has no time and no zone, but the driver hands back a JS Date at
 * local midnight, which JSON.stringify renders in UTC -- so a stored 2024-06-21
 * would leave as "2024-06-20T16:00:00.000Z" and a consumer that reads it in UTC
 * would show the previous day. Build the string from LOCAL components:
 * locale-independent.
 */
const dateOnly = (d) =>
  d === null || d === undefined
    ? null
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** db row (snake_case) -> api object (camelCase). One place, so the shape never drifts. */
function toGame(row) {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status,
    rating: row.rating,
    hoursPlayed: Number(row.hours_played),
    coverUrl: row.cover_url,
    notes: row.notes,
    steamAppid: row.steam_appid,
    startedAt: dateOnly(row.started_at),
    finishedAt: dateOnly(row.finished_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const badRequest = (errors) => Object.assign(new Error("Invalid input"), { status: 400, fields: errors });
const notFound = () => Object.assign(new Error("Game not found"), { status: 404 });

/**
 * ORDER BY cannot be parameterised, so it is resolved through an allow-list.
 * The client sends a name; only a name from this map ever reaches the SQL string.
 */
// every sort needs a UNIQUE tie-break. All 17 seeded rows share one
// created_at and one updated_at, so ordering by either alone is whichever order
// the heap returns -- and a PATCH rewrites tuples, which visibly reshuffles the list.
const ORDER_BY = {
  title: "lower(title) ASC, id ASC",
  added: "created_at DESC, id DESC",
  updated: "updated_at DESC, id DESC",
  rating: "rating DESC NULLS LAST, lower(title) ASC, id ASC",
};

export async function listGames(req, res) {
  const { status, q, sort } = req.query;

  if (status !== undefined && status !== "all" && !STATUSES.includes(status)) {
    throw badRequest({ status: `Unknown status filter. Allowed: all, ${STATUSES.join(", ")}.` });
  }
  if (sort !== undefined && !SORTS.includes(sort)) {
    throw badRequest({ sort: `Unknown sort. Allowed: ${SORTS.join(", ")}.` });
  }
  if (q !== undefined && typeof q !== "string") {
    throw badRequest({ q: "Search must be text." });
  }

  const where = [];
  const params = [];

  if (status && status !== "all") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (q && q.trim() !== "") {
    params.push(`%${q.trim()}%`);
    where.push(`title ILIKE $${params.length}`);
  }

  const sql = `
    SELECT * FROM games
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY ${ORDER_BY[sort] ?? ORDER_BY.added}
  `;
  const { rows } = await pool.query(sql, params);

  // Counts are the totals across the WHOLE backlog, not the current filter, so the
  // chips stay meaningful while a filter is active.
  const { rows: countRows } = await pool.query(
    `SELECT status, count(*)::int AS n FROM games GROUP BY status`
  );
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of countRows) counts[r.status] = r.n;

  res.json({ games: rows.map(toGame), counts });
}

export async function createGame(req, res) {
  const { values, errors } = validateGameInput(req.body);
  if (Object.keys(errors).length) throw badRequest(errors);

  const { rows } = await pool.query(
    `INSERT INTO games (title, platform, status, rating, hours_played, cover_url, notes, started_at, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7,
             CASE WHEN $3 = 'playing' THEN CURRENT_DATE ELSE NULL END,
             CASE WHEN $3 IN ('completed','abandoned') THEN CURRENT_DATE ELSE NULL END)
     RETURNING *`,
    [
      values.title,
      values.platform,
      values.status,
      values.rating ?? null,
      values.hoursPlayed ?? 0,
      values.coverUrl ?? null,
      values.notes ?? null,
    ]
  );
  res.status(201).json(toGame(rows[0]));
}

export async function getGame(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw badRequest({ id: "Game id must be a positive whole number." });

  const { rows } = await pool.query(`SELECT * FROM games WHERE id = $1`, [id]);
  if (rows.length === 0) throw notFound();
  res.json(toGame(rows[0]));
}

export async function updateGame(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw badRequest({ id: "Game id must be a positive whole number." });

  const { values, errors } = validateGamePatch(req.body);
  if (Object.keys(errors).length) throw badRequest(errors);

  // Only the fields actually supplied are written — a PATCH must not blank the others.
  const columns = {
    title: "title", platform: "platform", status: "status", rating: "rating",
    hoursPlayed: "hours_played", coverUrl: "cover_url", notes: "notes",
  };
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(columns)) {
    if (values[key] !== undefined) {
      params.push(values[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }

  // Stamp the lifecycle dates from the transition, without touching a date already set.
  if (values.status === "playing") sets.push(`started_at = COALESCE(started_at, CURRENT_DATE)`);
  if (values.status === "completed" || values.status === "abandoned")
    sets.push(`finished_at = COALESCE(finished_at, CURRENT_DATE)`);
  if (values.status === "want_to_play" || values.status === "playing")
    sets.push(`finished_at = NULL`);

  sets.push(`updated_at = now()`);
  params.push(id);

  const { rows } = await pool.query(
    `UPDATE games SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (rows.length === 0) throw notFound();
  res.json(toGame(rows[0]));
}

export async function deleteGame(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw badRequest({ id: "Game id must be a positive whole number." });

  const { rowCount } = await pool.query(`DELETE FROM games WHERE id = $1`, [id]);
  if (rowCount === 0) throw notFound();
  res.status(204).end();
}