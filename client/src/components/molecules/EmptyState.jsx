import styles from "./EmptyState.module.css";

/**
 * Two shapes, one component: "no games yet" (with the Add game button as
 * `action`) and "nothing matches these filters" (with a Clear filters button, or
 * no action at all). Both are the same, the difference is the words and whether an action is passed.
 *
 * `body` and `action` are optional because the second variant sometimes has
 * neither.
 */
export default function EmptyState({ title, body, action }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{title}</p>
      {body && <p className={styles.body}>{body}</p>}
      {action}
    </div>
  );
}
