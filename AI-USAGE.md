# AI usage

Game Over It was built with AI help. This is the record of it.

Tool used throughout: **DeepSeek**.

## 1. How I used AI

### 2026-09-24 - Tidying the design documents and exporting the PDFs

- **Asked for:** clean up my design documents and turn the wireframes into the PDFs the assets folder needs.
- **Got back:** tidier versions of my documents and the exports - `wireframes.pdf`, `design-system.pdf`, `screen-map.svg`.
- **Kept and changed:** the writing and the drawings are mine. I kept my wording and took the tidying and the export step.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/58aa768

### 2026-09-27 - The client's shape: layout and the four screens

- **Asked for:** build the client from the wireframes - one layout shell and the four screens.
- **Got back:** `AppLayout` and the backlog, add, detail and Steam pages.
- **Kept and changed:** I kept the layout shell, but wrote `tokens.css` and `App.jsx` myself (section 3): the design values and the four routes each live in one file instead of being spread across the screens.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/c226c6c

### 2026-09-27 - My schema and seed, corrected

- **Asked for:** to have my `schema.sql` and `seed.sql` checked and fixed. I haven't written SQL like this before and did not understand parts of it.
- **Got back:** corrections to my statements and lines I could not have written myself - constraints I had left out, and the indexes.
- **Kept and changed:** both files are mine. I kept the shape I had planned, took the corrections, and replaced the placeholder game titles with games I actually know so the demo looks like a real backlog.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/c226c6c

### 2026-09-30 - My handlers, corrected

- **Asked for:** help with the request logic. I did not understand how the handlers, the routes and the validation were supposed to fit together.
- **Got back:** corrections and whole lines I could not have written, across `handlers/` and `validators/`.
- **Kept and changed:** I wrote both handler files and the two route files (section 3); the AI corrected them and filled the gaps where I did not understand. The split by resource stayed, because it put the later fixes in one place each. The wrapper those routes call came later - see case 2 below.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d

### 2026-09-30 - The Steam client and its named failures

- **Asked for:** make the Steam part fail in a way the UI can explain, so a rate limit, an outage and a bad response do not all look the same.
- **Got back:** one client file with a few named failures - `UNCONFIGURED` (503), `PRIVATE` (200, with an explanation), `NOT_FOUND` (400) and `UPSTREAM` (502).
- **Kept and changed:** I kept it as the only file that talks to Steam, so the key is read from the environment in exactly one place and never reaches the browser.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d

### 2026-10-01 - The main components

- **Asked for:** the screens' main parts - header, footer, the game list, the detail view, the add/edit form, and the Steam panel with its import summary.
- **Got back:** seven components and their CSS modules.
- **Kept and changed:** I kept them. The form had the bug in case 1 below, which was fixed before I moved on.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/4916710

### 2026-10-01 - The remaining small components, the demo backend and the route wrapper

- **Asked for:** the smaller pieces - dialogs, chips, cards, sort and form scaffolding - plus the browser-side demo backend, and a guard so one rejected request doesn't take the API down.
- **Got back:** the remaining molecule components, an updated `mockApi.js`, and `server/lib/wrap.js`.
- **Kept and changed:** I kept the demo backend's honesty about a private library (case 3), and every async handler now goes through `wrap()`.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/a25a5d7

## 2. Where the AI got it wrong

### Case 1 - Saving an edit threw an exception that nothing reported

- **What it gave me:** a form whose submit handler called `values.coverUrl.trim()` before sending.
- **What was wrong with it:** a game with no cover art comes back from the API with `coverUrl: null`, and `.trim()` on `null` throws. Every edit-save of a game without cover art failed because the error happened before the request and nothing showed it. Creating a game never hit it, because that field starts as an empty string.
- **What I did instead:** defaulted the field when the form loads an existing game, which fixes every caller of the form at once instead of guarding each one.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/4916710

### Case 2 - An async handler that could take the whole API down

- **What it gave me:** corrected handler code that `await`s and can throw, with no `try/catch` and no wrapper anywhere in the project.
- **What was wrong with it:** Express 4 does not catch a rejected promise from an async handler, so the process exits. One Steam failure - a rate limit, an outage - would have killed the API for every request, not just that one. It was not theoretical: the route files called a `wrap()` that did not exist yet, so the server did not run as committed.
- **What I did instead:** every async handler now goes through `wrap()`, which forwards a rejection to the error middleware, and the file it needs is in the repository.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/a25a5d7

### Case 3 - Demo mode reported a failure as a success

- **What it gave me:** a simulated backend whose Steam sync returned `{ imported: 0, updated: 0, skipped: 0 }` for a private profile.
- **What was wrong with it:** a private library cannot be read, so "0 imported" is a failure that presents as a success. On the screen the project is demonstrated with, the app would have looked like it worked while doing nothing.
- **What I did instead:** the simulated backend now returns what the real server returns - an explanation naming the reason, with a `private` flag.
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d

## 3. Who wrote what

### Written by me

- **File:** `client/src/App.jsx`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/c226c6c
- **What it does and why it is built this way:** the four routes and the shared layout. The paths are fixed in this one file, so the header links, the browser URL and any later `navigate()` call don't disagree. An unknown path goes back to the backlog instead of a blank screen.

- **File:** `client/src/styles/tokens.css`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/c226c6c
- **What it does and why it is built this way:** every colour, size and space the app uses, defined once as a custom property. A component writes `var(--color-primary)` so re-skinning the app is one file.

- **Files:** `server/db/schema.sql`, `server/db/seed.sql`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/c226c6c
- **What they do and why they are built this way:** the two tables the app runs on, and the 17 sample rows. The rules live in the database rather than only in the API - title length, a rating between 1 and 10, hours that cannot go negative, a cover URL that has to start with `http(s)`, and a status limited to the four the filters know. Every statement is idempotent and there is no `DROP TABLE`, so `db:reset` can never delete data that is not ours. **Written by me; AI corrected statements and wrote the lines I did not understand.**

- **Files:** `server/handlers/games.js`, `server/handlers/steam.js`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d
- **What they do and why they are built this way:** all of the request logic - the list with its status filter, search and sort, create, read, update and delete, and the Steam connect, sync and disconnect. The list builds its `WHERE` from parameters and takes its `ORDER BY` from a fixed map, so nothing a user types ever reaches the SQL text. Disconnecting keeps every imported game, which is why the profile delete does not cascade. **Written by me; AI corrected and wrote the lines I lacked the understanding to write.**

- **Files:** the simple components in `client/src/components/atoms/` - `Button`, `Input`, `Label`, `Select`, `Textarea`, `StatusBadge`, `RatingStars`, `Spinner`, `BackLink`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/7452c39
- **What they do and why they are built this way:** they are small on purpose so the pages above them stay readable. `Label` is a real `<label>` bound with `htmlFor`, which is what makes a field announce its name to a screen reader and the label text clickable. `StatusBadge` always prints the status word, so the colour is decoration rather than the only signal.

- **Files:** five more components in `client/src/components/molecules/` - `EmptyState`, `ErrorMessage`, `SteamProfileCard`, `SearchBar`, `FormField`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/a25a5d7
- **What they do and why they are built this way:** the same idea one size up. `FormField`: it renders the label, the control and the error together, which is what stopped the detail screen's status select from being an unlabelled control. `ErrorMessage` is a sentence rather than a red border, so a failure isn't communicated just by colour.

- **Files:** `server/routes/games.js`, `server/routes/steam.js`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d
- **What they do and why they are built this way:** each URL is wired to its handler, and every handler goes through `wrap()` - deliberately unconditional, so there is no "should this one be wrapped?" decision to get wrong later. Keeping the routes separate from the handlers means the URL list can be read in one file without opening any request logic.

- **Files:** `docs/assets/wireframes.pdf`, `docs/assets/design-system.pdf`, `docs/assets/screen-map.svg`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/58aa768
- **What they are and why they are built this way:** the screens and the design system, drawn and written by me before the app existed. The wireframes are how I caught early that the detail screen had too many actions for a phone. AI tidied the files and did the PDF export; the content is mine.

### The AI-written part I understand best

- **File:** `server/steam/client.js`
- **Commit:** https://github.com/Piedot3000/GameOverIt/commit/af3b17d
- **What it does and why we kept it:** it talks to Steam. Every call goes through a single function that attaches the key, sets a timeout, and maps whatever comes back onto a few named failures, so a rate limit, an outage and a broken response all reach the handler as the same kind of thing instead of three different messes. We kept it because the alternative put the key and the error handling in three handlers, and whichever one drifted first would be the one nobody read. It is also why the key never reaches the browser: it is read from the environment in exactly one file.
