function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="note-card">
      <h3 className="note-title">{note.title}</h3>
      {note.body && <p className="note-body">{note.body}</p>}
      <div className="note-meta">
        <span>#{note.id}</span>
        <span> edited {formatTime(note.updated_at)}</span>
      </div>
      <div className="note-actions">
        <button type="button" onClick={() => onEdit(note)}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(note)}>
          Delete
        </button>
      </div>
    </div>
  );
}
