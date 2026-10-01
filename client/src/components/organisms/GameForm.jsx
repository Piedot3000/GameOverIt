import { useState } from "react";
import Button from "../atoms/Button.jsx";
import Input from "../atoms/Input.jsx";
import Select from "../atoms/Select.jsx";
import Textarea from "../atoms/Textarea.jsx";
import StatusBadge, { STATUS_LABELS } from "../atoms/StatusBadge.jsx";
import RatingStars from "../atoms/RatingStars.jsx";
import FormField from "../molecules/FormField.jsx";
import styles from "./GameForm.module.css";

/* The four statuses come from StatusBadge's own label map rather than a second
   copy here: the badge is what renders them everywhere else, so a rename must
   not be able to leave the dropdown and the badge disagreeing. */
const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

const BLANK = {
  title: "", platform: "PC", status: "want_to_play",
  rating: null, hoursPlayed: "", coverUrl: "", notes: "",
};

/**
 * One form for create and for edit
 *
 * `errors` is the API's own 400 body, keyed by field name, passed straight
 * through: the server's message text is what appears under the field, so there
 * is no client-side copy of the rules to fall out of step with the server.
 *
 * noValidate, because the browser's own bubble would preempt those messages and
 * say something vaguer.
 */
export default function GameForm({ initialValues, onSubmit, onCancel, submitting, errors = {} }) {
  // The API sends null for "empty" on coverUrl/notes, but the form works in ""
  // so a cleared field is an empty string. Normalising here, once, keeps the
  // two worlds apart from each other: without it, editing any game that has no
  // cover URL throws on `.trim()` at submit, and `value={null}` would render the
  // input uncontrolled.
  const [values, setValues] = useState(() => ({
    ...BLANK,
    ...initialValues,
    coverUrl: initialValues?.coverUrl ?? "",
    notes: initialValues?.notes ?? "",
  }));

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e?.target ? e.target.value : e }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      title: values.title,
      platform: values.platform,
      status: values.status,
      rating: values.rating,
      // "" becomes 0 so an untouched field is "no hours logged" rather than an
      // invalid number; the API's own coercion handles the rating.
      hoursPlayed: values.hoursPlayed === "" ? 0 : Number(values.hoursPlayed),
      coverUrl: values.coverUrl.trim() === "" ? null : values.coverUrl.trim(),
      notes: values.notes.trim() === "" ? null : values.notes,
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.columns}>
        <div className={styles.col}>
          <FormField label="Title" htmlFor="title" error={errors.title} hint="Required. The name you would search for.">
            <Input id="title" value={values.title} onChange={set("title")} invalid={!!errors.title}
                   placeholder="Hollow Knight" autoFocus={!initialValues} />
          </FormField>

          <FormField label="Status" htmlFor="status" error={errors.status}>
            <Select id="status" value={values.status} onChange={set("status")} invalid={!!errors.status}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </FormField>

          <FormField label="Platform" htmlFor="platform" error={errors.platform}>
            <Input id="platform" value={values.platform} onChange={set("platform")} invalid={!!errors.platform}
                   placeholder="PC, Switch, PS5, Emulator…" />
          </FormField>
        </div>

        <div className={styles.col}>
          <FormField label="Rating" htmlFor="rating">
            <RatingStars
              rating={values.rating}
              onChange={(n) => setValues((v) => ({ ...v, rating: n }))}
            />
          </FormField>

          <FormField label="Hours played" htmlFor="hoursPlayed" error={errors.hoursPlayed}>
            <Input id="hoursPlayed" type="number" min="0" step="0.1"
                   value={values.hoursPlayed} onChange={set("hoursPlayed")} invalid={!!errors.hoursPlayed} />
          </FormField>

          <FormField label="Cover image URL" htmlFor="coverUrl" error={errors.coverUrl}
                     hint="Optional. Must start with http:// or https://">
            <Input id="coverUrl" value={values.coverUrl} onChange={set("coverUrl")} invalid={!!errors.coverUrl} />
          </FormField>
        </div>
      </div>

      <FormField label="Notes" htmlFor="notes" error={errors.notes} hint="Where you write why you stopped.">
        <Textarea id="notes" value={values.notes} onChange={set("notes")} invalid={!!errors.notes} />
      </FormField>

      {errors.body && <p className={styles.formError} role="alert">{errors.body}</p>}

      <div className={styles.preview}>
        <span className={styles.previewLabel}>Preview</span>
        <StatusBadge status={values.status} />
      </div>

      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save game"}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={submitting}>Cancel</Button>}
      </div>
    </form>
  );
}
