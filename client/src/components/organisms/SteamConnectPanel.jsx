import { useState } from "react";
import { connectSteam } from "../../api/index.js";
import Input from "../atoms/Input.jsx";
import Button from "../atoms/Button.jsx";
import FormField from "../molecules/FormField.jsx";
import SteamProfileCard from "../molecules/SteamProfileCard.jsx";
import styles from "./SteamConnectPanel.module.css";

/**
 * The connect form, and once connected the card that replaces it.
 *
 * `variant="cta"` is deliberate: design system reserves `--color-accent`
 * for the one call to action on a screen, and on /steam that is this button.
 *
 * The field takes a URL, a vanity name or an id because the server accepts all
 * three — the validator decides which the input was, so the client does not
 * try to guess and reject a valid one.
 *
 * Errors that belong to the FIELD (a 400 with `fields`) render under the input.
 * Anything else — 503 no key, 502 Steam down — is not the input's fault, so it is
 * handed to `onError` for the page to explain at page level. Without that the page
 * could never reach its `unconfigured` state: the panel would swallow the 503 as a
 * field error and the notice would never appear.
 */
export default function SteamConnectPanel({ connected, onConnected, onError }) {
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState({});
  const [connecting, setConnecting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setConnecting(true);
    setErrors({});
    try {
      onConnected(await connectSteam(value));
    } catch (err) {
      const fieldErrors = err.fields && Object.keys(err.fields).length ? err.fields : null;
      if (fieldErrors) setErrors(fieldErrors);
      else onError?.(err);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section className={styles.panel}>
      {connected ? (
        // Card below the form it came from — the wireframe's phone order, so the
        // result of the action appears where the action was.
        <SteamProfileCard profile={connected} />
      ) : (
        <form onSubmit={submit} noValidate className={styles.form}>
          <FormField
            label="Steam profile"
            htmlFor="steam-profile-url"
            error={errors.profileInput || errors.body}
            hint="A profile URL, a vanity name, or a 17-digit SteamID64."
          >
            <Input
              id="steam-profile-url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              invalid={!!(errors.profileInput || errors.body)}
              placeholder="https://steamcommunity.com/id/yourname"
              autoFocus
            />
          </FormField>
          <Button type="submit" variant="cta" disabled={connecting}>
            {connecting ? "Connecting…" : "Connect"}
          </Button>
        </form>
      )}
    </section>
  );
}
