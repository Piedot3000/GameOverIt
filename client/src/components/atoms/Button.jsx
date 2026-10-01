import { forwardRef } from "react";
import styles from "./Button.module.css";

/**
 * One button, four variants. The variant is a class name
 * so buttons are never two variants at once. 
 * The default is primary, which is the most common.
 */
const Button = forwardRef(function Button(
  { variant = "primary", type = "button", disabled, onClick, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`${styles.btn} ${styles[variant]}`} disabled={disabled} onClick={onClick} {...rest}>
      {children}
    </button>
  );
});

export default Button;