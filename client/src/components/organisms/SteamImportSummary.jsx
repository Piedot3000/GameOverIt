import styles from "./SteamImportSummary.module.css";

/*
  This file covers the summary of a Steam import operation, explaining what
  a sync did, or why it could not. The private case is a real state rather
  than "0 imported": the request succeeded and the profile's own privacy setting
  is what blocked it, so it gets an explanation and the way to change it.
 */
export default function SteamImportSummary({ imported, updated, skipped, private: isPrivate, message }) {
  if (isPrivate) {
    return (
      <div className={styles.private} role="status">
        <p className={styles.privateTitle}>This profile's game details are private</p>
        <p className={styles.privateBody}>{message}</p>
        <p className={styles.privateBody}>
          In Steam: Profile → Edit Profile → Privacy Settings → set <strong>Game details</strong> to Public,
          then sync again.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.row} role="status">
      <span><strong>{imported}</strong> imported</span>
      <span><strong>{updated}</strong> updated</span>
      <span><strong>{skipped}</strong> skipped</span>
    </div>
  );
}
