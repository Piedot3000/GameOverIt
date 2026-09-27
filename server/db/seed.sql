-- Sample data for dev.
--
-- This starts with TRUNCATE. which is correct on a laptop and horrible on a live demo. 
-- It will delete all the data in the table and reset the primary key sequence. 
-- If you run this on a live demo, it will destroy all the users' data.
-- Never run this seed file against the database your live demo depends on. 
-- Check which DATABASE_URL is loaded before you run it.
--
-- Note that steam_appid is absent. Real app IDs come from GetOwnedGames during a sync. 
-- Hand-typing them from memory would make the import match the wrong games. 
-- so every seeded row leaves it NULL and the Steam tag appears only after a real sync.

TRUNCATE TABLE games RESTART IDENTITY CASCADE;

INSERT INTO games (title, platform, status, rating, hours_played, cover_url, notes, started_at, finished_at) VALUES
  ('Hollow Knight',            'PC',      'completed',   10,  62.5, NULL, 'Full completion. Best map in any metroidvania.',        '2024-01-10', '2024-03-02'),
  ('Hades',                    'PC',      'completed',    9,  54.0, NULL, 'Beat it with every weapon before moving on.',           '2024-03-05', '2024-05-20'),
  ('Celeste',                  'PC',      'completed',    9,  31.0, NULL, 'B-sides only. C-sides are a separate life.',            '2023-11-01', '2023-12-14'),
  ('Chrono Trigger',           'Emulator','completed',   10,  28.0, NULL, 'DS version. Held up perfectly.',                        '2023-06-01', '2023-07-04'),
  ('Silent Hill 2',            'PS2',     'completed',    9,  14.0, NULL, 'Original, not the remake.',                             '2023-08-11', '2023-08-30'),
  ('Super Mario Odyssey',      'Switch',  'completed',    9,  45.0, NULL, 'Cappy is the whole personality of the game.',           '2024-02-01', '2024-04-10'),
  ('Elden Ring',               'PC',      'playing',   NULL, 116.0, NULL, 'Stuck on Malenia. Not abandoned. Just resting.',        '2024-06-21', NULL),
  ('Baldur''s Gate 3',         'PC',      'playing',   NULL,  88.0, NULL, 'Act 3. Take notes or lose the plot.',                   '2024-08-02', NULL),
  ('Outer Wilds',              'PC',      'playing',   NULL,  22.5, NULL, 'Do not look anything up. That is the game.',            '2024-09-01', NULL),
  ('Mother 3',                 'Emulator','playing',   NULL,  18.0, NULL, 'Fan translation. Chapter 4.',                           '2024-09-20', NULL),
  ('The Legend of Zelda: Tears of the Kingdom', 'Switch', 'playing', NULL, 70.0, NULL, 'Depths are enormous.',                    '2024-05-12', NULL),
  ('Signalis',                 'PC',      'want_to_play', NULL, 0.0, NULL, 'Recommended three times. No excuse left.',          NULL, NULL),
  ('Nine Sols',                'PC',      'want_to_play', NULL, 0.0, NULL, 'Parry-focused, apparently.',                           NULL, NULL),
  ('Animal Well',              'PC',      'want_to_play', NULL, 0.0, NULL, NULL,                                                    NULL, NULL),
  ('Persona 3 Reload',         'PS5',     'want_to_play', NULL, 0.0, NULL, 'Only if there is time for a 90-hour game.',            NULL, NULL),
  ('Metroid Dread',            'Switch',  'abandoned',     6,  6.5, NULL, 'The EMMI sections are not fun at that difficulty.',     '2023-10-05', '2023-10-19'),
  ('Shadow of the Colossus',   'PS2',     'abandoned',     7,  4.0, NULL, 'Bounced off the controls. Will retry eventually.',      '2023-05-02', '2023-05-11');