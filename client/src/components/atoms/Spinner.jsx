import styles from "./Spinner.module.css";

/*
 * role="status" makes this a live region: a screen reader announces "Loading…"
 * when it appears. The dot is decorative and hidden from the reading.
 */
export default function Spinner({ label = "Loading" }) {
  return (
    <p className={styles.wrap} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {label}…
    </p>
  );
}