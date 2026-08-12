export default function ConfirmDialog({ note, onConfirm, onCancel, busy, error }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Delete “{note.title}”?</h2>
        <p className="modal-sub">
          #{note.id} — this can't be undone. It'll disappear from your list immediately, no page reload.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Keep it
          </button>
          <button type="button" className="btn-danger" onClick={() => onConfirm(note.id)} disabled={busy}>
            {busy ? "Deleting…" : "Delete note"}
          </button>
        </div>
      </div>
    </div>
  );
}
