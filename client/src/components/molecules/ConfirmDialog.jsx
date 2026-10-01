import { useEffect, useRef } from "react";
import Button from "../atoms/Button.jsx";
import styles from "./ConfirmDialog.module.css";

/**
 * The one destructive confirmation in the app.
 *
 * Focus handling is the point of this component: on open the destructive button
 * takes focus, Tab cycles between the two buttons rather than escaping to the
 * page behind, Escape closes, and on close focus returns to whatever opened the
 * dialog. Without the last part a keyboard user is dropped at the top of the
 * document every time they change their mind.
 */
export default function ConfirmDialog({ open, title, body, confirmLabel = "Delete", onConfirm, onCancel }) {
  const cardRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    confirmRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key !== "Tab") return;
      // Keep focus inside the dialog while it is open.
      const focusables = cardRef.current.querySelectorAll("button, [href], input, select, textarea");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Return focus where the user was, so the destructive action is never a surprise.
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        className={styles.card} role="dialog" aria-modal="true" aria-labelledby="confirm-title"
        ref={cardRef} onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className={styles.title}>{title}</h2>
        {body && <p className={styles.body}>{body}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} ref={confirmRef}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
