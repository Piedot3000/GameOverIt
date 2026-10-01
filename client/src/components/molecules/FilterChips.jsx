import styles from "./FilterChips.module.css";

const CHIPS = [
  { value: "all", label: "All" },
  { value: "want_to_play", label: "Want to play" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "abandoned", label: "Abandoned" },
];

/*
 * Status filter for the backlog, with a count on every chip so a filter that
 * would come back empty can be seen before it is clicked.
 *
 * `active` defaults to "all": an empty ?status= is a 400 from GET /games,
 * so the control must never begin in a state that emits nothing — "all" is the
 * server's own "no filter" value, and it is also the chip that must be active if
 * the caller passes nothing.
 *
 * The active chip is marked with aria-pressed as well as colour: the accessible
 * checklist forbids state carried by colour alone.
 */
export default function FilterChips({ active = "all", onChange, counts = {} }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.row} role="group" aria-label="Filter by status">
      {CHIPS.map((c) => {
        const n = c.value === "all" ? total : counts[c.value] ?? 0;
        const isActive = active === c.value;
        return (
          <button
            key={c.value} type="button"
            className={isActive ? styles.chipActive : styles.chip}
            aria-pressed={isActive}
            onClick={() => onChange(c.value)}
          >
            {c.label} <span className={styles.count}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}
