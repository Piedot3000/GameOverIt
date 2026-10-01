import styles from "./SortSelect.module.css";

const OPTIONS = [
  { value: "added", label: "Recently added" },
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title (A–Z)" },
  { value: "rating", label: "Rating" },
];

/**
 * Sort order for the backlog list.
 *
 * `value` defaults to "added" for the same reason the API does: an empty or
 * missing ?sort= is rejected by GET /games with a 400, so a control that
 * could start out blank would break the list on first load. "added" is also the
 * server's own default ORDER BY, so the first paint and the fallback agree.
 *
 * The <select> is styled by `.select` below.
 */
export default function SortSelect({ value = "added", onChange }) {
  return (
    <div className={styles.wrap}>
      <label htmlFor="backlog-sort" className={styles.sr}>Sort by</label>
      <select id="backlog-sort" value={value} onChange={(e) => onChange(e.target.value)} className={styles.select}>
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
