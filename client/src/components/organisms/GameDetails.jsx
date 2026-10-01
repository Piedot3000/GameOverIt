import { useState } from "react";
import Button from "../atoms/Button.jsx";
import Select from "../atoms/Select.jsx";
import StatusBadge, { STATUS_LABELS } from "../atoms/StatusBadge.jsx";
import FormField from "../molecules/FormField.jsx";
import RatingStars from "../atoms/RatingStars.jsx";
import styles from "./GameDetails.module.css";

const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

/* Added/started/finished are DATE columns and arrive as plain YYYY-MM-DD,
   printed as they come. createdAt is a TIMESTAMPTZ, so only its DATE part is
   wanted and that has to be the local date, because toISOString() would name
   yesterday for anything saved in the evening here. */
function localDay(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function initials(title) {
  return title.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * The read view of one game — the only screen where edit and delete live, so it
 * owns both actions rather than giving each its own route.
 *
 * Status changes happen here without leaving the screen: the select stages a
 * choice and Save applies it, so a mis-click cannot silently rewrite a saved row.
 */
export default function GameDetails({ game, onEdit, onChangeStatus, onRequestDelete }) {
  const [pendingStatus, setPendingStatus] = useState(game.status);

  return (
    <article className={styles.details}>
      <div className={styles.top}>
        {game.coverUrl ? (
          <img className={styles.cover} src={game.coverUrl} alt={`Cover art for ${game.title}`} />
        ) : (
          // Same fallback treatment as the cards: the title's initials, so a game
          // without cover art still looks like itself rather than a broken image.
          <div className={styles.coverEmpty} aria-hidden="true">{initials(game.title)}</div>
        )}

        <div className={styles.head}>
          <h1 className={styles.title}>{game.title}</h1>
          <p className={styles.meta}>
            {game.platform}
            {game.steamAppid != null && <span className={styles.steam}> · Imported from Steam</span>}
          </p>

          <div className={styles.statusRow}>
            <StatusBadge status={game.status} />
            <RatingStars rating={game.rating} />
            <span className={styles.hours}>{game.hoursPlayed} hours played</span>
          </div>

          <dl className={styles.dates}>
            <div><dt>Added</dt><dd>{localDay(game.createdAt)}</dd></div>
            <div><dt>Started</dt><dd>{game.startedAt ?? "—"}</dd></div>
            <div><dt>Finished</dt><dd>{game.finishedAt ?? "—"}</dd></div>
          </dl>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onEdit}>Edit</Button>
            <Button variant="danger" onClick={onRequestDelete}>Delete</Button>
          </div>
        </div>
      </div>

      <div className={styles.lower}>
        <section className={styles.panel}>
          <h2 className={styles.panelLabel}>Notes</h2>
          <p className={styles.notes}>{game.notes || "No notes yet."}</p>
        </section>

        <section className={styles.panel}>
          {/* FormField, not a heading plus a bare select: its label renders a real
              <label for>, which is what gives this control an accessible name. */}
          <FormField
            label="Change status"
            htmlFor="detail-status"
            hint="Pick a status and save. A Steam sync never overwrites it."
          >
            <Select id="detail-status" value={pendingStatus} onChange={(e) => setPendingStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </FormField>
          <Button
            variant="secondary"
            onClick={() => onChangeStatus(pendingStatus)}
            disabled={pendingStatus === game.status}
          >
            Save status
          </Button>
        </section>
      </div>
    </article>
  );
}
