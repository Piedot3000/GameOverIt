import styles from "./Control.module.css";

/*
 * Input, Select and Textarea share Control.module.css because they share one
 * look and feel. The only difference is that Input is a self-closing tag, 
 * while Select and Textarea aren't.
 */
export default function Input({ id, value, onChange, invalid, ...rest }) {
  return (
    <input
      id={id} value={value ?? ""} onChange={onChange}
      className={`${styles.control} ${invalid ? styles.invalid : ""}`}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
