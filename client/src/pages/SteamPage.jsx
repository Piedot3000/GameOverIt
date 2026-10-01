import { useCallback, useEffect, useState } from "react";
import { getSteamProfile, syncSteam, disconnectSteam } from "../api/index.js";
import Spinner from "../components/atoms/Spinner.jsx";
import ErrorMessage from "../components/molecules/ErrorMessage.jsx";
import SteamConnectPanel from "../components/organisms/SteamConnectPanel.jsx";
import SteamImportSummary from "../components/organisms/SteamImportSummary.jsx";
import styles from "./SteamPage.module.css";

/**
 * Steam, off the critical path by design: the app is fully usable with this screen
 * never visited, so every failure here is explained rather than fatal.
 *
 * `unconfigured` is a state of its own (a 503 from the API), not an error: the
 * feature is switched off, and saying so plainly is the whole point. It is
 * only discoverable by attempting something -- `GET /steam/profile` answers 404
 * whether or not a key exists -- so it surfaces on the first connect or sync rather
 * than on load. The notice is worded for that.
 */
export default function SteamPage() {
  const [steamProfile, setSteamProfile] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [steamState, setSteamState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setSteamState("loading");
    try {
      setSteamProfile(await getSteamProfile());
      setSteamState("idle");
    } catch (err) {
      // 404 means "nothing connected" — a normal first visit, not an error.
      if (err.status === 404) { setSteamProfile(null); setSteamState("idle"); }
      else { setError(err.message); setSteamState(err.status === 503 ? "unconfigured" : "error"); }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSteamState("loading");
    setSyncResult(null);
    try {
      const result = await syncSteam();
      setSyncResult(result);
      if (result.private) setSteamState("private");
      else setSteamState("idle");
      setSteamProfile(await getSteamProfile());
    } catch (err) {
      setError(err.message);
      setSteamState(err.status === 503 ? "unconfigured" : "error");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectSteam();
      setSteamProfile(null);
      setSyncResult(null);
      setSteamState("idle");
    } catch (err) { setError(err.message); setSteamState("error"); }
  }

  return (
    <div className={styles.page}>
      <h1>Steam</h1>
      <p className={styles.intro}>
        Connect a public Steam profile to import the games you own. Steam playtime fills in hours played.
        Your statuses, ratings and notes are never overwritten by a sync.
      </p>

      {steamState === "loading" && !steamProfile && <Spinner label="Checking Steam" />}

      {steamState === "unconfigured" && (
        <ErrorMessage
          message="Steam is not configured on this server, so importing is unavailable. You can still add games by hand."
        />
      )}

      {steamState === "error" && <ErrorMessage message={error} onRetry={load} />}

      {(steamState === "idle" || steamState === "private") && (
        <>
          <SteamConnectPanel
            connected={steamProfile}
            onConnected={(p) => { setSteamProfile(p); setSteamState("idle"); }}
            onError={(err) => {
              setError(err.message);
              setSteamState(err.status === 503 ? "unconfigured" : "error");
            }}
          />

          {steamProfile && (
            <>
              <div className={styles.syncRow}>
                <button type="button" className={styles.sync} onClick={handleSync}>
                  Sync library
                </button>
                <button type="button" className={styles.disconnect} onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>
              <p className={styles.hint}>
                Syncing updates playtime. It never changes a status, rating or note you set yourself.
              </p>
            </>
          )}

          {syncResult && <SteamImportSummary {...syncResult} />}
        </>
      )}
    </div>
  );
}