import styles from "./Control.module.css";

/*
 * Like Input, but a textarea. the only difference is that Input is a self-closing tag, 
 * while Select and Textarea aren't.
 */
export default function Textarea({ id, value, onChange, invalid, rows = 4, ...rest }) {
  return (
    <textarea
      id={id} value={value ?? ""} onChange={onChange} rows={rows}
      className={`${styles.control} ${invalid ? styles.invalid : ""}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
