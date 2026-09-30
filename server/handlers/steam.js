import { pool } from "../db/pool.js";
import { validateProfileInput } from "../validators/steam.js";
import { SteamError } from "../steam/errors.js";
import { isConfigured, resolveVanity, getPlayerSummary, getOwnedGames } from "../steam/client.js";

const toProfile = (row) => ({
  steamid64: row.steamid64,
  personaName: row.persona_name,
  avatarUrl: row.avatar_url,
  profileUrl: row.profile_url,
  isPublic: row.is_public,
  lastSyncedAt: row.last_synced_at,
});

/*
 * These handlers throw rather than catching: `SteamError` carries its own status
 * (503/502/400/200), and `server/lib/wrap.js` forwards anything thrown to the
 * error middleware, which already reads `err.status`. Catching here would be a
 * second copy of that mapping, and an unwrapped handler would not merely return a
 * bad response — Express 4 lets the rejection escape and the whole API process
 * exits.
 */

export async function getSteamProfile(req, res) {
  const { rows } = await pool.query(
    `SELECT * FROM steam_profiles ORDER BY created_at DESC LIMIT 1`
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: "No Steam profile is connected." });
  }
  res.json(toProfile(rows[0]));
}

export async function connectSteam(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Steam is not configured on this server.", code: "UNCONFIGURED" });
  }

  const { value, errors } = validateProfileInput(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: "Invalid input", fields: errors });
  }

  // Resolve to a 64-bit id. A 17-digit input is already one; a vanity name is looked up.
  let steamid64 = value.steamid64 ?? null;
  if (!steamid64) {
    steamid64 = await resolveVanity(value.vanity);
    if (!steamid64) return res.status(400).json({ error: `Steam could not find a profile for “${value.vanity}”.` });
  }

  const summary = await getPlayerSummary(steamid64);
  if (!summary) return res.status(400).json({ error: "Steam could not find that profile." });

  // One profile per deployment, but INSERT FIRST and delete the
  // others second: the other order drops the existing connection before the new
  // row exists, so any failure in between leaves the user connected to nothing.
  // steamid64 is UNIQUE, so reconnecting the same profile must update in place.
  const { rows } = await pool.query(
    `INSERT INTO steam_profiles (steamid64, persona_name, avatar_url, profile_url, is_public)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (steamid64) DO UPDATE
       SET persona_name = EXCLUDED.persona_name,
           avatar_url   = EXCLUDED.avatar_url,
           profile_url  = EXCLUDED.profile_url,
           is_public    = true
     RETURNING *`,
    [steamid64, summary.personaName, summary.avatarUrl, summary.profileUrl]
  );
  await pool.query(`DELETE FROM steam_profiles WHERE steamid64 <> $1`, [steamid64]);
  res.json(toProfile(rows[0]));
}

export async function disconnectSteam(req, res) {
  const { rowCount } = await pool.query(`DELETE FROM steam_profiles`);
  if (rowCount === 0) return res.status(404).json({ error: "No Steam profile is connected." });
  // Deliberately does NOT touch `games`: disconnecting must not delete backlog entries.
  res.status(204).end();
}

/*
 * The sync. Two things it must never do, both named as this project's top risk:
 * duplicate a row (it matches on steam_appid, never on title — titles collide and
 * get renamed), and destroy the user's own data on a re-sync (it refreshes only the
 * fields Steam owns: hours and, when empty, the cover). status, rating and notes are
 * the user's and are never written here.
 */
export async function syncSteam(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Steam is not configured on this server.", code: "UNCONFIGURED" });
  }

  const { rows } = await pool.query(`SELECT * FROM steam_profiles ORDER BY created_at DESC LIMIT 1`);
  if (rows.length === 0) return res.status(404).json({ error: "No Steam profile is connected." });
  const profile = rows[0];

  let owned;
  try {
    owned = await getOwnedGames(profile.steamid64);
  } catch (err) {
    if (err instanceof SteamError && err.code === "PRIVATE") {
      // Record the truth on the profile so the UI can explain it, then answer 200:
      // the request was understood, it is the profile's privacy that blocks it.
      await pool.query(`UPDATE steam_profiles SET is_public = false WHERE id = $1`, [profile.id]);
      return res.status(200).json({
        imported: 0, updated: 0, skipped: 0, private: true,
        message: err.message,
      });
    }
    // Anything else (UPSTREAM, or a bug) goes to wrap()'s error middleware, which
    // reads err.status — 502 for a Steam outage. Catching it here would be a second
    // copy of that mapping.
    throw err;
  }

  await pool.query(`UPDATE steam_profiles SET is_public = true WHERE id = $1`, [profile.id]);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const g of owned) {
    // Match on appid, never on title: titles collide and get renamed.
    const existing = await pool.query(`SELECT id FROM games WHERE steam_appid = $1`, [g.appid]);
    const hours = Math.round((g.playtimeForever / 60) * 10) / 10;

    if (existing.rows.length > 0) {
      // Refresh ONLY the Steam-owned fields. Never touch status, rating or notes —
      // those are the user's, and overwriting them is the data loss the risk section warns about.
      await pool.query(
        `UPDATE games
            SET hours_played = $1, cover_url = COALESCE(cover_url, $2), updated_at = now()
          WHERE steam_appid = $3`,
        [hours, g.iconUrl, g.appid]
      );
      updated++;
    } else {
      // RETURNING id so a row that appeared between the SELECT and here (DO NOTHING
      // wrote nothing) is counted as skipped rather than as an import that never
      // happened — which is the only sense "skipped" can have in this design.
      const inserted = await pool.query(
        `INSERT INTO games (title, platform, status, hours_played, cover_url, steam_appid)
         VALUES ($1, 'Steam', 'want_to_play', $2, $3, $4)
         ON CONFLICT (steam_appid) WHERE steam_appid IS NOT NULL DO NOTHING
         RETURNING id`,
        [g.name, hours, g.iconUrl, g.appid]
      );
      if (inserted.rows.length > 0) imported++;
      else skipped++;
    }
  }

  const { rows: after } = await pool.query(
    `UPDATE steam_profiles SET last_synced_at = now() WHERE id = $1 RETURNING *`,
    [profile.id]
  );
  res.json({ imported, updated, skipped, profile: toProfile(after[0]) });
}
