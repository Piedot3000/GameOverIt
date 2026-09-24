# 2. Wireframes & Component Breakdown

Built from the section list in the proposal. Four routes, one shared layout.

---

## Step A: Screen map

```
                    ┌──────────────────┐
   ┌────────┐       │     BACKLOG      │    click + Add game   ┌─────────────────────┐
   │ Entry  │──────▶│      route: /    │──────────────────────▶│  ADD GAME           │
   │ point  │       │  all games       │                       │  /games/new         │
   │app open│       │  filter · search │    click a game card  │  title + status     │
   │  at /  │       │                  │──────────────────────▶└─────────────────────┘
   └────────┘       │                  │                       ┌─────────────────────┐
                    │                  │──────────────────────▶│  GAME DETAIL        │
                    │                  │                       │  /games/:id         │
                    │                  │    click Steam in nav │  one game · edit    │
                    │                  │──────────────────────▶└─────────────────────┘
                    └────────▲─────────┘                       ┌─────────────────────┐
                             │                                 │  STEAM              │
                             │                                 │  /steam             │
                             └─────────────────────────────────│  connect · sync     │
                every screen returns to Backlog                └─────────────────────┘
                (header nav · back link · after a delete)
```

**Questions this should answer:**

- **What is the first screen the user lands on?** Backlog at `/`. The list *is* the app.
- **Is there a home base most others return to?** Yes - Backlog. That is the nav, and it is the first item in it.
- **Any screen with no way back?** **No.** Add game returns via Save or Cancel; Game detail returns via its back
  link, the header nav, or a confirmed delete; Steam returns via the header nav.
- **Navigation edges, all checked for:**

| From | To | What the user clicks |
| --- | --- | --- |
| Backlog | Add game | `+ Add game` button |
| Backlog | Game detail | a `GameCard` |
| Backlog | Steam | `Steam` in the header nav |
| Add game | Backlog | Save (on success) or Cancel |
| Game detail | Backlog | back link, header nav, or Delete after confirming |
| Steam | Backlog | `Backlog` in the header nav - **connect and sync stay on the Steam screen**, so the result appears where the action happened |

> **Design decision:** **Steam sits off the critical path.** Delete the Steam route and the app is
> still a complete backlog tracker built on manual entry.

## Step B: One box-sketch per screen

Sketched in the PDF. Every screen has the same thing - `Header` / main / `Footer` - and the table below is
the **"what changes on a phone"** note that becomes the media queries.

| Screen | Desktop layout | Phone layout (what stacks) | Navigates to |
| --- | --- | --- | --- |
| **Backlog** `/` | Search + sort + `Add game` in one control row; filter chips in a single row; games in a 3-column grid | Grid -> 1 stack; `Add game` becomes a floating button so the list stays visible; filter chips scroll horizontally rather than stacking | Add game, Game detail, Steam |
| **Add game** `/games/new` | Form in two columns (title/status/platform \| rating/hours/cover/notes), actions below | One column, same field order; optional fields collapse behind an "Add details" toggle so the two required fields need no scrolling; actions become full-width stacked buttons | Backlog (Save / Cancel) |
| **Game detail** `/games/:id` | Cover beside the title; notes and status control side by side; actions at the bottom | Cover stacks above the title; the two-up row stacks to one column; back link stays at the top | Backlog (back, or after delete) |
| **Steam** `/steam` | Connect panel and sync panel side by side | Panels stack - connect first, then sync; the profile card sits below the form it came from; the import summary becomes a stacked list of counts | Backlog (nav) |

## Step C: Break it into a component tree

Every box on the sketches, sorted into atomic levels. Sorted by level, and each component is built once and
rendered wherever it appears.

| Level | What it is | Components |
| --- | --- | --- |
| **Atoms** | smallest pieces | `Button` · `Input` · `Select` · `Textarea` · `Label` · `StatusBadge` · `RatingStars` · `Spinner` · `BackLink` |
| **Molecules** | small groups of atoms | `FormField` · `SearchBar` · `FilterChips` · `SortSelect` · `GameCard` · `EmptyState` · `ErrorMessage` · `ConfirmDialog` · `SteamProfileCard` |
| **Organisms** | whole sections | `Header` · `Footer` · `GameList` · `GameForm` · `GameDetails` · `SteamConnectPanel` · `SteamImportSummary` |
| **Page / layout** | the screen that arranges organisms | `BacklogPage` · `AddGamePage` · `GameDetailPage` · `SteamPage`, wrapped in one shared layout route |

**The sanity-checks:**

- **A component that repeats is a real thing.** `GameCard` appears once per game, several times per screen,
  across two screens - so it is built once and rendered in a list with keys. `StatusBadge` and `RatingStars`
  repeat inside every `GameCard`, so they are their own atoms. `FormField` appears seven times in one form.
- **A level uses the levels below it.** `GameCard` (molecule) imports `StatusBadge` (atom). It never
  imports `GameList` (organism). `GameForm` is an organism that composes `FormField` molecules; it never reaches
  into a page.

**Two components stay because of how they repeat:**

- `GameForm` is used **twice** - Add game and Edit on the detail screen. That is exactly why editing needs no
  separate route: the detail screen swaps `GameDetails` for `GameForm` in place.
- `Header` and `Footer` are built once and live in the shared layout, which makes "no dead ends" true **by
  construction** rather than by remembering to add a back link on every new screen.

**Folders this becomes**:

```
client/src/
  components/
    atoms/        Button, Input, Select, Textarea, Label, StatusBadge, RatingStars, Spinner, BackLink
    molecules/    FormField, SearchBar, FilterChips, SortSelect, GameCard, EmptyState,
                  ErrorMessage, ConfirmDialog, SteamProfileCard
    organisms/    Header, Footer, GameList, GameForm, GameDetails,
                  SteamConnectPanel, SteamImportSummary
  pages/          BacklogPage, AddGamePage, GameDetailPage, SteamPage
  layouts/        the Header + Footer shell that wraps all four routes
  api/            ONE interface, TWO implementations (mock / http)
```

## Step D: Sanity check

Checked the **one most important user task** - *add a game, then mark it playing* - screen by screen: **Backlog -> Add game -> (save) -> Backlog -> Game detail -> (status: playing) -> Backlog.**

| Check | Result |
| --- | --- |
| Did I hit a screen I forgot to sketch? | **Nope.** The check touches Backlog, Add game, and Game detail - all sketched. Steam is the fourth route, off this path. |
| Did any navigation have nowhere to go? | **Nope.** Add game and Game detail both carry an explicit return, and the header nav returns from all four. |
| Does every piece of state from the proposal have a component that owns it? | **Yes.** `games` / `statusCounts` / `activeStatusFilter` / `searchQuery` / `sortBy` / `listState` -> `BacklogPage`; `formValues` / `formErrors` -> `GameForm`; `selectedGame` -> `GameDetailPage`; `steamProfile` / `syncResult` / `steamState` -> `SteamPage`. Nothing is homeless. |
| If I removed a screen, could the user still do the main thing? | **Steam passes**. **Backlog and Add game fail**, confirming they are important. **Game detail is the weakest**: its blocks could live on the list, so it is the first screen to cut if time forces it. |

## What to keep

- **The screen map** -> becomes the routes (`<Route>` per screen) and the nav config. Four routes, one layout route.
- **Each box** -> becomes a component in `src/components/`, sorted into the atomic folders above.
- **The "what stacks on a phone" column** -> becomes the media queries. The one that matters most is the game
  grid: **3 columns -> 1 stack**.
- **The sketches themselves** (`wireframes.pdf`) -> the reference to check a built screen against before
  calling it done.
