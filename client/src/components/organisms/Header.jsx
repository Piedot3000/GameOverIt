import { NavLink } from "react-router-dom";
import styles from "./Header.module.css";

// The three destinations are reached from every screen, so the
// app feels like a product rather than a set of disconnected pages.
// The brand links home as well.
export default function Header() {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>Game Over It</NavLink>
        <nav className={styles.nav} aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : styles.link)}>
            Backlog
          </NavLink>
          <NavLink to="/steam" className={({ isActive }) => (isActive ? styles.active : styles.link)}>
            Steam
          </NavLink>
          <NavLink to="/games/new" className={styles.cta}>+ Add game</NavLink>
        </nav>
      </div>
    </header>
  );
}