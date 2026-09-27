import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGame, updateGame, deleteGame } from "../api/index.js";
import BackLink from "../components/atoms/BackLink.jsx";
import Spinner from "../components/atoms/Spinner.jsx";
import ErrorMessage from "../components/molecules/ErrorMessage.jsx";
import ConfirmDialog from "../components/molecules/ConfirmDialog.jsx";
import GameDetails from "../components/organisms/GameDetails.jsx";
import GameForm from "../components/organisms/GameForm.jsx";

/**
 * One game, with edit and delete living here rather than on their own routes —
 * which is why `GameForm` is reused in place instead of a second form existing
 * for edits.
 *
 * A 404 gets its own wording: the game was deleted, or the id was never real,
 * and "Not found" alone would leave the user guessing. Every branch keeps a way
 * back, so a deep link into a dead id is not a dead end.
 */
export default function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      setGame(await getGame(id));
      setState("ready");
    } catch (err) {
      setError(err.status === 404 ? "That game does not exist. It may have been deleted." : err.message);
      setState("error");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleEdit(input) {
    setSubmitting(true);
    setFormErrors({});
    try {
      const updated = await updateGame(id, input);
      setGame(updated);
      setEditing(false);
    } catch (err) {
      setFormErrors(err.fields && Object.keys(err.fields).length ? err.fields : { body: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(status) {
    try {
      setGame(await updateGame(id, { status }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    try {
      await deleteGame(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setConfirmingDelete(false);
    }
  }

  // Stable identity on purpose: ConfirmDialog's focus effect depends on onCancel,
  // so an inline arrow would re-run it -- and yank focus back to the destructive
  // button -- on every render of this page while the dialog is open.
  const closeDialog = useCallback(() => setConfirmingDelete(false), []);

  if (state === "loading") return <Spinner label="Loading this game" />;
  if (state === "error") return (<><BackLink /><ErrorMessage message={error} onRetry={load} /></>);

  return (
    <div>
      <BackLink />
      {editing ? (
        <GameForm
          initialValues={game}
          onSubmit={handleEdit}
          onCancel={() => { setEditing(false); setFormErrors({}); }}
          submitting={submitting}
          errors={formErrors}
        />
      ) : (
        <GameDetails
          game={game}
          onEdit={() => setEditing(true)}
          onChangeStatus={handleStatusChange}
          onRequestDelete={() => setConfirmingDelete(true)}
        />
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete “${game.title}”?`}
        body="This removes the entry from your backlog. It cannot be undone."
        onConfirm={handleDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}
