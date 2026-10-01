import GameCard from "../molecules/GameCard.jsx";
import styles from "./GameList.module.css";

/**
 * The backlog itself: one GameCard per game.
 *
 * Takes `games`. Changing a game's status from the list
 * Status changes happen on the detail
 * screen.
 *
 * A <ul>/<li> instead of divs: a screen reader announces "list, 17 items" 
 * and can jump item by item, which is the why the grid is a
 * list of articles instead of boxes.
 */
export default function GameList({ games }) {
  return (
    <ul className={styles.grid}>
      {games.map((game) => (
        <li key={game.id} className={styles.item}>
          <GameCard game={game} />
        </li>
      ))}
    </ul>
  );
}
