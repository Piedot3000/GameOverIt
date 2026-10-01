import { Link } from "react-router-dom";
import styles from "./BackLink.module.css";

/**
 * A real router <Link>, not a history.back() button: the destination is a fixed
 * route, so it stays correct when the page is opened directly (deep link) where
 * there is no history to go back to. The default target is the backlog.
 */
export default function BackLink({ to = "/", children = "Back to Backlog" }) {
  return <Link to={to} className={styles.link}>← {children}</Link>;
}