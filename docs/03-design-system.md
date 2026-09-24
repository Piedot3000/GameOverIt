# 3. Design System

> The visual version is **`docs/assets/design-system.pdf`**

A short, fixed set of decisions - **tokens** (colour, type, spacing) and the reusable **components** that use
them - made **once** so all four screens look like one product. Token values are taken from the components the
wireframes actually need.

---

## Step A: Styling approach

**Approach: plain CSS with `:root` custom properties, plus CSS Modules per component.**

| | |
| --- | --- |
| **Tokens live in** | one `:root` block - `client/src/styles/tokens.css` |
| **Component styles live in** | a `*.module.css` file beside each component |
| **Why this one** | Simple and it's CSS the course already covers, and it keeps the token block as one readable source. A component refers to `var(--color-primary)`, not to `#8B7BFF`. |
| **What that buys** | the whole app can be re-themed from one file. |

## Step B: Colour tokens

**Five interface colours.**

| Token | Role | Colour (hex) | Contrast verified |
| --- | --- | --- | --- |
| `--color-bg` | page background | `#12101A` | text on it: **15.84 : 1** |
| `--color-surface` | cards, panels, inputs | `#1E1B2E` | text on it: **14.11 : 1** |
| `--color-text` | body text | `#ECEAF5` | on bg: **15.84 : 1** |
| `--color-primary` | buttons, links, active states | `#8B7BFF` | on bg: **5.72 : 1** · on surface: **5.09 : 1** |
| `--color-accent` | the one call to action | `#FFB020` | on bg: **10.30 : 1** |

**Every text-on-background pair was checked.** All 16 pairs the app  renders clear
the 4.5 : 1 requirement. The lowest is `--color-primary` on `--color-surface` at **5.09 : 1**. The focus ring (`--color-primary` on `--color-bg`) is
**5.72 : 1**, above the 3 : 1 that UI components need. The ratios printed on the PDF are those computed values,
so re-running the check gives the same digits.

### Status colours

`StatusBadge` needs four readable states, and colour is how a list of 200 rows stays scannable at a glance.
Rather than inventing four new hues, **one reuses a core token** - `--color-playing` is `--color-primary`:

| Token | Used for | Colour | Contrast on surface |
| --- | --- | --- | --- |
| `--color-muted` | **want to play** | `#A9A5C0` | 7.06 : 1 |
| `--color-playing` | **playing** - same value as `--color-primary` | `#8B7BFF` | 5.09 : 1 |
| `--color-success` | **completed** | `#4ADE80` | 9.63 : 1 |
| `--color-danger` | **abandoned** - also the destructive Button | `#FF6B6B` | 6.05 : 1 |

So the app's palette is **nine colour tokens, eight values** - five for the interface and four for the
statuses, one of which (`--color-playing`) reuses `--color-primary`. The four statuses are one layer, and
**colour is not the only signal** - `StatusBadge` always prints the status word, so all four
states stay readable without seeing colour at all.

### Why the palette is dark

The subject is games and a backlog is a long list of cover art. A dark surface keeps cover images from fighting
a white page and matches where the user already is. This was decided **once, in the token block** - not per
screen. Also, I prefer dark aesthetics.

## Step C: Type scale

**Three sizes.** That is all this project needs.

| Style | Size | Weight | Token | Used for |
| --- | --- | --- | --- | --- |
| **Heading** | 26 px | 700 bold | `--font-heading` | screen and section titles ("Backlog", "Add a game") |
| **Body** | 15 px | 400 regular | `--font-body` | paragraphs, list text, form text |
| **Small** | 12.5 px | 400 regular | `--font-small` | captions, field labels, counts, the footer |

Font: the system stack (`"Segoe UI", Arial, sans-serif`) - no webfont to download, nothing to go wrong offline.

## Step D: Spacing rule

**One base unit: 8 px. Every padding, gap and margin in the app is a multiple of it.**

- Tight spacing (between related items - a label and its input, a badge and its title): **8 px** (`--space-1`)
- Standard spacing (inside a card, field to field): **16 px** (`--space-2`)
- Between sections on a screen: **24 px** (`--space-3`)
- Between major screen regions: **32 px** (`--space-4`)
- **Screen edge padding:** **16 px on phone** (`--edge-phone`), **24 px on desktop** (`--edge-desk`)

This single rule is what makes the UI feel designed rather than ad hoc - it is worth more than picking exact
pixel values, and it is the reason `GameCard` looks identical on every screen.

### The token block, as it will actually appear

```css
:root {
  /* colour - 5 interface tokens */
  --color-bg:      #12101A;
  --color-surface: #1E1B2E;
  --color-text:    #ECEAF5;
  --color-primary: #8B7BFF;
  --color-accent:  #FFB020;
  /* colour - 4 status tokens, used only by StatusBadge (+ the destructive Button) */
  --color-muted:   #A9A5C0;   /* want to play */
  --color-playing: #8B7BFF;   /* playing (= primary) */
  --color-success: #4ADE80;   /* completed */
  --color-danger:  #FF6B6B;   /* abandoned */

  /* type - 3 sizes */
  --font-heading: 700 26px/1.2 "Segoe UI", Arial, sans-serif;
  --font-body:    400 15px/1.55 "Segoe UI", Arial, sans-serif;
  --font-small:   400 12.5px/1.45 "Segoe UI", Arial, sans-serif;

  /* spacing - one 8px base unit */
  --space-1: 8px;  --space-2: 16px;  --space-3: 24px;  --space-4: 32px;
  --edge-phone: 16px;  --edge-desk: 24px;

  --radius: 8px;
  --border: 1px solid #3a3550;
}
```

## Step E: Reusable components

From the component tree in [`02-mockup.md`](02-mockup.md) Step C. Each one is built once and
rendered wherever it appears, which is why it is a design-system component rather than a one-off.

| Component | Level | Appears on | Props it takes |
| --- | --- | --- | --- |
| `Button` | atom | everywhere | `variant` (`primary` · `secondary` · `cta` · `danger`), `onClick`, `disabled`, `children` |
| `StatusBadge` | atom | Backlog, Game detail, Steam import summary | `status` (`want_to_play` · `playing` · `completed` · `abandoned`) |
| `RatingStars` | atom | Backlog, Game detail | `rating` (1–10 or `null`), `onChange` (`null` = read-only) |
| `Label` | atom | Add game, Game detail, Steam connect | `htmlFor`, `children` |
| `Spinner` | atom | every screen that fetches | `label` (optional) |
| `BackLink` | atom | Add game, Game detail | `to`, `children` |
| `Input` / `Select` / `Textarea` | atom | Add game, Game detail, Steam connect | `value`, `onChange`, `id`, `invalid`, `placeholder` |
| `FormField` | molecule | Add game, Game detail, Steam connect | `label`, `htmlFor`, `error`, `children` (one control) |
| `SearchBar` | molecule | Backlog | `value`, `onChange`, `placeholder` |
| `FilterChips` | molecule | Backlog | `active`, `onChange`, `counts` |
| `SortSelect` | molecule | Backlog | `value`, `onChange` |
| `GameCard` | molecule | Backlog (in the grid) | `game` (the whole row; the card renders its own `<Link>`) |
| `EmptyState` | molecule | Backlog (two variants), Steam | `title`, `body`, `action` (optional) |
| `ErrorMessage` | molecule | every screen that fetches | `message`, `onRetry` (optional) |
| `ConfirmDialog` | molecule | Game detail (delete) | `open`, `title`, `body`, `onConfirm`, `onCancel` |
| `SteamProfileCard` | molecule | Steam | `profile` (steamid64, personaName, avatarUrl, profileUrl, lastSyncedAt) |
| `Header` / `Footer` | organism | all four routes (shared layout) | - |
| `GameForm` | organism | **Add game and Game detail (edit)** | `initialValues`, `onSubmit`, `onCancel`, `submitting`, `errors` |
| `GameList` | organism | Backlog | `games` |
| `GameDetails` | organism | Game detail (the read view; `GameForm` replaces it in place for edit) | `game`, `onEdit`, `onChangeStatus`, `onRequestDelete` |
| `SteamConnectPanel` | organism | Steam | `onConnected`, `connected` |
| `SteamImportSummary` | organism | Steam | `imported`, `updated`, `skipped`, `lastSyncedAt` |

**Sanity Check:**

- **`Button`** - built once, four variants. `primary` (Save game), `cta` (Connect Steam - the one accent in the
  app), `secondary` (Cancel), `danger` (Delete). Dark text on the bright fills gives 5.72 : 1 and 10.30 : 1.
- **`Card`** - here it is `GameCard`, the repeated list item. It is the single most-reused component in the app.
- **`Header` / nav** - one instance, read by all four routes through the shared layout.
- **`Footer`** - one instance, same layout.
- **No UI library was adopted**, so there is nothing "free": all of these are built, which is exactly why they
  are listed here with their props before any of them is written.

## Step F: Responsive plan

- **Below 640 px (phone):** the game grid collapses **3 columns -> 1 stack**; filter chips **scroll horizontally**
  in one row rather than stacking; on Add game the optional fields **collapse behind a toggle** so title and
  status need no scrolling; on Game detail the cover **stacks above** the title and the two-up rows stack to one
  column; on Steam the connect and sync panels stack in the order the user performs them.
- **640 px to 1024 px (tablet):** grid stays at 2 columns; forms stay single column.
- **1024 px and up (desktop):** the grid becomes **2–3 columns** using Grid; the Add form splits into two
  columns; Game detail splits cover beside title; screen edge padding goes 16 px -> 24 px.

These become `min-width` media queries in the module CSS. **Hard requirement: no horizontal scrolling at 375 px
wide.**

## Accessibility check (before building)

- [x] **Every text-on-background pair passes 4.5 : 1** - all 16 pairs the app renders were computed; the lowest
      is 5.09 : 1 (`--color-primary` on `--color-surface`).
- [x] **Real semantic elements** - `<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<form>`, `<label>`,
      not a `<div>` with an `onClick`. `GameCard` is a real link, so it is reachable and openable like one.
- [x] **Every meaningful image has `alt` text** - cover art gets the game title as its `alt`; purely decorative
      art uses `alt=""`.
- [x] **Every form input has a matching `<label>`** (`htmlFor` + `id`) - this is the job `FormField` exists to
      guarantee in one place rather than seven times.
- [x] **Every link and button is reachable with Tab, with a visible focus ring** - `--color-primary` on the page
      background is 5.72 : 1, above the 3 : 1 needed for UI components.
- [x] **Failure is never colour-only** - `StatusBadge` always carries the status word; `ErrorMessage` is text,
      not a red border.
- [x] **`ConfirmDialog` traps focus and returns it to the Delete button on close**, so a destructive action is
      never triggered by muscle memory.
