import styles from "./FormField.module.css";

/**
 * One label, one control, with at most one message underneath.
 *
 * This exists so "every input has a matching <label>" is a property of one component rather than a habit
 * repeated on every form, the app has three forms and one place to fix.
 *
 * `hint` shows only while there is no `error`: two messages under one field is
 * noise, and the error is the one being acted on. The error carries role="alert"
 * so it is announced when it appears, not only when a screen reader reaches it.
 */
export default function FormField({ label, htmlFor, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>{label}</label>
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}
