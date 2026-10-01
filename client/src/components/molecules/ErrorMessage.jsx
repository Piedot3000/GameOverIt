import Button from "../atoms/Button.jsx";
import styles from "./ErrorMessage.module.css";

/*
 * A failed fetch. The text is the signal and the border is
 * decoration. role="alert" announces it when it appears rather than only when a
 * screen reader walks past it.
 *
 * Retry is optional because not every failure is retryable (a 404 isn't), and
 * it is the real secondary Button atom rather than a styled <span>, so it is
 * reachable and looks like the button it should be.
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className={styles.wrap} role="alert">
      <p className={styles.text}>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
