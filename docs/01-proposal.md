# 1. Final Project - Proposal

## App name

**Game Over It** - a personal video game backlog tracker.

## What the app is for, in one sentence

Game Over It lets a person keep **one backlog of every game they mean to play, are playing, or have given up
on - across all platforms, not just Steam** - and move each game through a four-state status so they can
actually see what they finished, what they dropped, and what to play next.

## Who is it for

**A person who plays games across more than one platform and has a backlog they have stopped tracking.** Someone with Steam games, a console, and maybe some emulated games, who currently
keeps that list in their head or in a notes app.

**What they are trying to get done in the moment they open it:**

1. **Add the game they just started** - in under 15 seconds, ideally without typing a title Steam already knows.
2. **Decide what to play next** - see what is in *want to play* and *playing* without scrolling past everything finished.
3. **Record that they finished it, or gave up on it** - change the status and add a rating, so the list stays honest.

The reason a user needs an app at all: Steam tracks what you own *on Steam*. It has playtime and achievements,
but it has no concept of *"I bounced off this at hour six and I am not going back"*, and it cannot hold the
Switch game, the PS2 game, or the emulated game. So the person ends up with two or three partial lists and no
combined answer to "what should I play next?"

## Sections or routes this app needs

**Four routes plus one shared layout.**

| # | Section / route | What it is for |
| - | --- | --- |
| 1 | **Backlog** - `/` | Every game in one list, filterable by status, searchable by title, sortable. The first screen the user lands on. |
| 2 | **Add game** - `/games/new` | The form for a new entry: title and status required, everything else optional. |
| 3 | **Game detail** - `/games/:id` | One game in full status, rating, hours, platform, notes, dates, and whether it came from Steam. **Edit and delete live here**, which is why there is no separate edit route. |
| 4 | **Steam** - `/steam` | Connect a public Steam profile, see its summary, sync its library into the backlog, and understand any failure (private profile, no API key, Steam down). |

**Shared layout:** a `Header` (app name + nav to Backlog and Steam) and a `Footer`, on all four routes.

## State: what data does the app hold?

Named for the **most important screen, the Backlog**, plus the other three.

| Data | Shape (rough) | Who owns it (which component) | Changes when… |
| --- | --- | --- | --- |
| `games` | `[{ id, title, platform, status, rating, hoursPlayed, coverUrl, notes, steamAppid, createdAt, startedAt, finishedAt }]` | `BacklogPage` (fetched, passed down as props) | the user adds, edits, deletes, or changes a status |
| `statusCounts` | `{ want_to_play: 12, playing: 3, completed: 28, abandoned: 5 }` | `BacklogPage` | any game's status changes - refetched with the list |
| `activeStatusFilter` | `'all' \| 'want_to_play' \| 'playing' \| 'completed' \| 'abandoned'` (string) | `BacklogPage` | the user clicks a filter chip |
| `searchQuery` | `string` | `BacklogPage` | the user types in the search bar |
| `sortBy` | `'title' \| 'added' \| 'updated' \| 'rating'` (string) | `BacklogPage` | the user changes the sort select |
| `listState` | `'loading' \| 'ready' \| 'error'` (string) | `BacklogPage` | every fetch |
| `formValues` | `{ title, platform, status, rating, hoursPlayed, coverUrl, notes }` | `GameForm` (owns its own; the page only receives the result) | the user types |
| `formErrors` | `{ title?: string, hoursPlayed?: string, … }` | `GameForm` | validation fails - client-side first, then from the API's `400` body |
| `selectedGame` | one game object, or `null` | `GameDetailPage` (fetched by `:id`) | the route changes; after a successful edit |
| `steamProfile` | `{ steamid64, personaName, avatarUrl, profileUrl, isPublic, lastSyncedAt }` or `null` | `SteamPage` | connect / disconnect / sync |
| `syncResult` | `{ imported, updated, skipped }` or `null` | `SteamPage` | a sync completes |
| `steamState` | `'idle' \| 'loading' \| 'private' \| 'unconfigured' \| 'error'` (string) | `SteamPage` | a connect or sync fails, in the specific way it failed |

**Where the data lives.** The list, filters, and search belong to `BacklogPage`; the form owns its own
input state and hands back one object on submit; `StatusBadge` and `RatingStars` own nothing. The rule being
followed: **state lives in the lowest component that needs it, and is passed down as props.** A status filter
does not belong in `GameCard`, and the Steam profile does not belong in the app root.

**Where it is stored.** The twelve pieces above are client state. The durable copies live in PostgreSQL as two
tables - `games` and `steam_profiles` - reached only through our own REST API. No API key or credential ever
reaches the browser.

## What each screen contains

**Screen: Backlog (`/`)** - the most important screen. Blocks, in order:

- Block 1: `Header` - app name, nav (Backlog · Steam)
- Block 2: `SearchBar` - one input, filters by title
- Block 3: `SortSelect` - title / date added / last updated / rating
- Block 4: `FilterChips` - All · Want to play · Playing · Completed · Abandoned, each with its count
- Block 5: result count - "12 games · 3 playing"
- Block 6: `GameList` - a grid of `GameCard`s, each showing cover, title, platform, `StatusBadge`, `RatingStars`
- Block 7: `EmptyState` - two variants: "no games yet" vs "no games match this filter"
- Block 8: `ErrorMessage` + `Spinner` - the fetch's failure and loading states
- Block 9: `Footer`

These nine blocks are the component breakdown: Block 6 becomes `GameCard` (built once, rendered with keys),
Block 4 becomes `FilterChips`, Block 2 becomes `SearchBar`, and the rest are the shared shell and the state
components. `02-mockup.md` sorts all of them into atomic levels.

## Content I need to gather

- **[Important]** A **Steam Web API key**, free and instant from `steamcommunity.com/dev/apikey`.
  Nothing Steam-related can be built or tested without it.
- A **public test Steam profile** whose library I can actually read, and a **private one** to test the failure state.
  Both are needed before the import can be trusted; the private case is the one that fails silently.
- **Sample game data for `seed.sql`** - about 15 real games across several platforms. Each with the fields the app stores. Real titles, not "Game 1".
- **Cover image URLs** for those games. A hosted URL or Steam's own icon URL; no file uploads.
- **PostgreSQL** - Required.

## One risk

**The Steam integration. Specifically that I probably won't be able to tell "this profile has no games" apart from
"this profile is private", and that a re-sync will quietly create duplicates.**

The Steam Web API does not return an error for a profile whose game details are hidden. `GetOwnedGames` returns
a **valid, successful, empty list** - so the obvious code path shows the user "0 games imported" and looks like
it worked. Nothing tells you that you got privacy-blocked. On top of that, importing a library twice has to update
the existing rows rather than insert a second copy of all 60 games, which means the import depends on matching
Steam's `appid` reliably and on a uniqueness rule in the database - my first idea (delete everything and
re-insert) would wipe any status or note the user had set by hand.

Why this is risky: it is the one place where the app depends on a third party's undocumented
behaviour, and where getting it wrong destroys the user's own data rather than failing to add something. Everything else is something I have already done in this course.

**How I can mitigate it:** build the Steam screen first (so the UI and the states exist), then
wire the real call in and test it against **both** the public and the private test profile before writing the
import. The empty-list case gets its own explicit state (`steamState: 'private'`) rather than being treated as
success. If the integration has to be cut, the app still works.