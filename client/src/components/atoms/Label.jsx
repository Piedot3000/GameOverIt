import styles from "./Label.module.css";

/**
 * A real <label> bound with htmlFor, not a styled <span> next to the field:
 * the association makes the field announce its name to a screen reader
 * and what makes the label's text clickable.
 */
export default function Label({ htmlFor, children }) {
  return <label htmlFor={htmlFor} className={styles.label}>{children}</label>;
}
