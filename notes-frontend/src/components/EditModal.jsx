import { useState } from "react";

/**
 * Editing is a different shape from creating: state starts as a COPY
 * of the note being edited, not empty. That's the whole point of this
 * component existing separately from Composer.
 */
export default function EditModal({ note, onSave, onCancel, busy, error }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(note.id, { title: title.trim(), body });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit note</h2>
        <p className="modal-sub">#{note.id} — changes save straight to the list, no reload needed.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="edit-body">Body</label>
            <textarea id="edit-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || !title.trim()}>
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
