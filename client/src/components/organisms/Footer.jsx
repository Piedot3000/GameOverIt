import styles from "./Footer.module.css";

// The footer states what the app is and what it runs on. it's where a
// visitor learns "Express and PostgreSQL" without reading the source, and it
// gives the layout a bottom edge so a short page doesn't end halfway.
export default function Footer() {
  return (
    <footer className={styles.bar}>
      <p className={styles.text}>Game Over It — a personal backlog tracker. Built with React, Express and PostgreSQL.</p>
    </footer>
  );
}