import styles from "./Control.module.css";

/**
 * Same contract as Input, with one difference: the children are the <option>s —
 * the caller supplies them so this atom never carries a list of statuses of its
 * own (that list is the app's, not the widget's).
 */
export default function Select({ id, value, onChange, invalid, children, ...rest }) {
  return (
    <select
      id={id} value={value} onChange={onChange}
      className={`${styles.control} ${invalid ? styles.invalid : ""}`}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
