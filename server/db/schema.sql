-- The complete shape of the database. Safe to run against an empty database,
-- and safe to run twice.
--
-- The schema is a fact about your application: not a runtime concern.
-- it should be readable by opening a file
-- rather than by connecting to a server. It is also what lets you move to a
-- hosted database in one command.
--
-- Every statement here is idempotent (IF NOT EXISTS) and there is deliberately
-- no DROP TABLE. A `db:reset` against a hosted database must never be able to
-- delete data that is not ours to delete; re-running this file has to be a
-- no-op, not a wipe.

CREATE TABLE IF NOT EXISTS games (
  id           SERIAL       PRIMARY KEY,
  title        TEXT         NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  platform     TEXT         NOT NULL DEFAULT 'PC' CHECK (length(btrim(platform)) BETWEEN 1 AND 60),
  status       TEXT         NOT NULL DEFAULT 'want_to_play'
                            CHECK (status IN ('want_to_play','playing','completed','abandoned')),
  rating       SMALLINT     CHECK (rating BETWEEN 1 AND 10),
  hours_played NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (hours_played >= 0),
  cover_url    TEXT         CHECK (cover_url IS NULL OR cover_url ~ '^https?://'),
  notes        TEXT         CHECK (notes IS NULL OR length(notes) <= 2000),
  steam_appid  INTEGER,
  started_at   DATE,
  finished_at  DATE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- A Steam app can occupy at most one backlog row. This single index is what
-- makes a re-sync an UPSERT instead of a duplicate-inserting loop. It is partial and NULL rows (every
-- hand-added game) stay out of the index altogether, so it is smaller and it
-- states the intent that only real app IDs are ever claimed. (A plain UNIQUE
-- would also permit unlimited NULLs — the partial form is not what protects
-- them.)
--
-- The partial form obliges every upsert to repeat the predicate:
--   INSERT ... ON CONFLICT (steam_appid) WHERE steam_appid IS NOT NULL DO UPDATE
-- A bare ON CONFLICT (steam_appid) fails with 42P10, because Postgres infers a
-- partial index as arbiter only when the conflict target implies its predicate.
CREATE UNIQUE INDEX IF NOT EXISTS games_steam_appid_key
  ON games (steam_appid) WHERE steam_appid IS NOT NULL;

-- The list page filters by status, so without this the database reads every row
-- and sorts it on each request.
CREATE INDEX IF NOT EXISTS games_status_idx
  ON games (status);

-- Searching by title is case-insensitive, which a plain btree on title cannot
-- serve. An index on lower(title) matches how the search term is folded.
CREATE INDEX IF NOT EXISTS games_title_lower_idx
  ON games (lower(title));

CREATE TABLE IF NOT EXISTS steam_profiles (
  id             SERIAL      PRIMARY KEY,
  steamid64      TEXT        NOT NULL UNIQUE CHECK (steamid64 ~ '^[0-9]{17}$'),
  persona_name   TEXT,
  avatar_url     TEXT,
  profile_url    TEXT,
  is_public      BOOLEAN     NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- games.steam_appid links a backlog row to Steam's catalogue, and there is
-- deliberately no foreign key to steam_profiles: disconnecting the profile
-- must delete the profile row without touching a single backlog entry.