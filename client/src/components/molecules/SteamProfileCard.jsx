import styles from "./SteamProfileCard.module.css";

export default function SteamProfileCard({ profile }) {
  return (
    <div className={styles.card}>
      {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className={styles.avatar} />}
      <div className={styles.body}>
        <p className={styles.name}>{profile.personaName ?? "Steam profile"}</p>
        <a href={profile.profileUrl} target="_blank" rel="noreferrer" className={styles.link}>
          {profile.profileUrl}
        </a>
        <p className={styles.meta}>
          {profile.isPublic ? "Library readable" : "Library is private"}
          {profile.lastSyncedAt && ` · last synced ${new Date(profile.lastSyncedAt).toLocaleString()}`}
        </p>
      </div>
    </div>
  );
}
