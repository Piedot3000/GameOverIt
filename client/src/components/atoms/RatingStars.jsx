import styles from "./RatingStars.module.css";

const MAX = 10;

/**
 * rating is 1-10 or null. Pass onChange to make it interactive;
 * omit it and the component renders as plain read-only text.
 */
export default function RatingStars({ rating, onChange }) {
  // Five stars for a 1-10 score: half a star per point, rounded so 9 shows as
  // ★★★★☆ (4.5 rounds up) rather than a half glyph the system font lacks.
  // Clamped: an out-of-range rating would make "☆".repeat(negative) throw a
  // RangeError, and an atom that throws blanks every screen -- there is no
  // error boundary. Better a wrong number of stars than a dead app.
  const filled = rating ? Math.round(Math.min(rating, 10) / 2) : 0;
  const readOnly = typeof onChange !== "function";

  if (readOnly) {
    return (
      // aria-label carries the whole reading; the glyphs themselves are
      // aria-hidden so a screen reader hears "Rated 8 out of 10", not "star
      // star star star star".
      <span className={styles.stars} aria-label={rating ? `Rated ${rating} out of 10` : "Not rated"}>
        <span aria-hidden="true">{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>
        <small className={styles.num}>{rating ? `${rating}/10` : "—"}</small>
      </span>
    );
  }

  return (
    // Ten real <button>s in a labelled group: Tab/Enter work for free, and the
    // focus ring is the one styles.css defines for :focus-visible.
    <span className={styles.group} role="group" aria-label="Rating out of 10">
      {Array.from({ length: MAX }, (_, i) => i + 1).map((n) => (
        <button
          key={n} type="button"
          className={n <= (rating ?? 0) ? styles.on : styles.off}
          aria-label={`Rate ${n} out of 10`}
          aria-pressed={rating === n}
          onClick={() => onChange(rating === n ? null : n)}
        >
          ★
        </button>
      ))}
      <button type="button" className={styles.clear} onClick={() => onChange(null)}>clear</button>
    </span>
  );
}