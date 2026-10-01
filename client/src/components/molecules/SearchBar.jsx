import styles from "./SearchBar.module.css";

/*
 * The Backlog search box. The label is visually hidden rather than absent: a
 * placeholder is not a label (it disappears the moment you type), so the input
 * keeps a real one for screen readers.
 *
 * The id is fixed because Backlog is the only screen with a search box, and a
 * fixed id is what lets FormField-free markup still pair label and input.
 */
export default function SearchBar({ value, onChange, placeholder = "Search by title…" }) {
  return (
    <div className={styles.wrap}>
      <label htmlFor="backlog-search" className={styles.sr}>Search the backlog</label>
      <input
        id="backlog-search" type="search" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} className={styles.input}
      />
    </div>
  );
}
