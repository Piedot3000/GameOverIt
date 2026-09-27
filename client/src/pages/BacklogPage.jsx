import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listGames } from "../api/index.js";
import Spinner from "../components/atoms/Spinner.jsx";
import SearchBar from "../components/molecules/SearchBar.jsx";
import SortSelect from "../components/molecules/SortSelect.jsx";
import FilterChips from "../components/molecules/FilterChips.jsx";
import EmptyState from "../components/molecules/EmptyState.jsx";
import ErrorMessage from "../components/molecules/ErrorMessage.jsx";
import GameList from "../components/organisms/GameList.jsx";
import styles from "./BacklogPage.module.css";

const EMPTY_COUNTS = { want_to_play: 0, playing: 0, completed: 0, abandoned: 0 };

// The screen that owns the whole state the API is queried with: the status
// filter, the search text, the sort order and the rows themselves all live
// here and nowhere else, per the ownership table in docs/01-proposal.md. That
// is why the controls below take `value`/`onChange` -- a child that held its
// own copy would be a second source of truth for the same query.
export default function BacklogPage() {
  const [games, setGames] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  // Both of these start non-empty on purpose: the API rejects an empty
  // ?status= or ?sort= with a 400 (server/handlers/games.js:55,:58, against the
  // allow-lists), so a control that could begin blank would break the very
  // first load. "all" and "added" are the server's own spellings of "no filter"
  // and its default ORDER BY.
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("added");
  const [listState, setListState] = useState("loading");

  // Debounce the search so typing does not fire a request per keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = useCallback(async () => {
    setListState("loading");
    try {
      const data = await listGames({ status: activeStatusFilter, q: debouncedQuery, sort: sortBy });
      setGames(data.games);
      setCounts(data.counts ?? EMPTY_COUNTS);
      setListState("ready");
    } catch (err) {
      setListState("error");
      setGames([]);
      setLoadError(err.message);
    }
  }, [activeStatusFilter, debouncedQuery, sortBy]);

  const [loadError, setLoadError] = useState("");
  useEffect(() => { load(); }, [load]);

  // The chip counts are full-backlog totals from the API, not counts of what is
  // on screen, so they deliberately do not shrink when a filter is applied.
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtered = activeStatusFilter !== "all" || debouncedQuery.trim() !== "";

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Backlog</h1>

      <div className={styles.controls}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <SortSelect value={sortBy} onChange={setSortBy} />
        <Link to="/games/new" className={styles.add}>+ Add game</Link>
      </div>

      <FilterChips active={activeStatusFilter} onChange={setActiveStatusFilter} counts={counts} />

      {/* aria-live, so the count is announced when a filter changes it rather
          than silently rewriting itself under a screen reader. Hidden unless the
          list actually loaded: `games` is [] while loading and after a failure,
          so showing it then prints "0 games" underneath a spinner or beside an
          error — the same contradiction the states below exist to avoid. */}
      {listState === "ready" && (
        <p className={styles.count} aria-live="polite">
          {games.length} {games.length === 1 ? "game" : "games"}
          {counts.playing > 0 && ` · ${counts.playing} playing`}
          {filtered && total > 0 && ` · showing a filtered view of ${total}`}
        </p>
      )}

      {/* Loading, error and empty are three different screens, shown one at a
          time: a spinner over a stale list, or an error next to "no games
          match", is telling the user two contradictory things at once. */}
      {listState === "loading" && <Spinner label="Loading your backlog" />}

      {listState === "error" && <ErrorMessage message={loadError} onRetry={load} />}

      {listState === "ready" && games.length === 0 && (
        total === 0 ? (
          // Nothing in the backlog at all: the way out is to add one.
          <EmptyState
            title="Your backlog is empty"
            body="Add the first game you mean to play. Title and status are all you need."
            action={<Link to="/games/new" className={styles.add}>+ Add a game</Link>}
          />
        ) : (
          // There ARE games, just none matching: the way out is to widen the
          // filter, so the action resets both filter and search at once.
          <EmptyState
            title="No games match this filter"
            body="Try a different status, or clear the search."
            action={
              <button
                type="button" className={styles.clear}
                onClick={() => { setActiveStatusFilter("all"); setSearchQuery(""); }}
              >
                Clear filters
              </button>
            }
          />
        )
      )}

      {listState === "ready" && games.length > 0 && <GameList games={games} />}
    </div>
  );
}
