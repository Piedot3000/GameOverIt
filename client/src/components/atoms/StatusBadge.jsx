import styles from "./StatusBadge.module.css";

/*
 * The status word is the label; the colour is decoration on top of it. An
 * unknown status still renders its raw value rather than nothing..
 *
 * Exported so the form's status dropdown and the backlog filters read the same
 * four labels instead of keeping copies that could change.
 */
export const STATUS_LABELS = {
  want_to_play: "Want to play",
  playing: "Playing",
  completed: "Completed",
  abandoned: "Abandoned",
};

export default function StatusBadge({ status }) {
  // The word is always rendered: colour is a second signal.
  return <span className={`${styles.badge} ${styles[status] ?? ""}`}>{STATUS_LABELS[status] ?? status}</span>;
}
