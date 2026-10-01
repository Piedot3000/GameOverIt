import { Link } from "react-router-dom";
import StatusBadge from "../atoms/StatusBadge.jsx";
import RatingStars from "../atoms/RatingStars.jsx";
import styles from "./GameCard.module.css";

/**
 * The repeated list item — the single most-reused component in the app.
 *
 * It takes the whole row and nothing else: the card renders its own <Link> to
 * /games/:id, so no parent has to know the route or hand down a click handler.
 * A <div onClick> is explicitly out. a real link is keyboard-reachable
 * and openable in a new tab like a link should be.
 */
export default function GameCard({ game }) {
  return (
    <article className={styles.card}>
      {/* A real link, so it is keyboard-reachable and openable like one. */}
      <Link to={`/games/${game.id}`} className={styles.artLink} aria-label={`Open ${game.title}`}>
        {game.coverUrl
          ? <img src={game.coverUrl} alt={`Cover art for ${game.title}`} className={styles.art} loading="lazy" />
          : <span className={styles.artEmpty} aria-hidden="true">{game.title.slice(0, 2).toUpperCase()}</span>}
      </Link>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/games/${game.id}`} className={styles.titleLink}>{game.title}</Link>
        </h3>
        <p className={styles.meta}>
          {game.platform}
          {game.steamAppid != null && <span className={styles.steam} title="Imported from Steam"> · Steam</span>}
          {game.hoursPlayed > 0 && ` · ${game.hoursPlayed}h`}
        </p>
        <div className={styles.foot}>
          <StatusBadge status={game.status} />
          <RatingStars rating={game.rating} />
        </div>
      </div>
    </article>
  );
}
