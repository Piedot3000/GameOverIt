import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGame } from "../api/index.js";
import BackLink from "../components/atoms/BackLink.jsx";
import GameForm from "../components/organisms/GameForm.jsx";

/**
 * Adds a game, then goes straight to it, so the user sees the thing they just
 * saved rather than being returned to a list.
 *
 * The failure path reuses the API's own field map: `err.fields` is already keyed
 * by the same names the form labels, so the server's messages render under the
 * right inputs and there is no second set of rules to keep in step.
 */
export default function AddGamePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  async function handleSubmit(input) {
    setSubmitting(true);
    setErrors({});
    try {
      const game = await createGame(input);
      navigate(`/games/${game.id}`);
    } catch (err) {
      // A 400 carries per-field messages; anything else (a dead server, a 500)
      // has none, so it becomes one message for the form rather than being lost.
      setErrors(err.fields && Object.keys(err.fields).length ? err.fields : { body: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <BackLink />
      <h1>Add a game</h1>
      <GameForm onSubmit={handleSubmit} onCancel={() => navigate("/")} submitting={submitting} errors={errors} />
    </div>
  );
}
