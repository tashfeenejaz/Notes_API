import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Composer from "./components/Composer.jsx";
import NoteCard from "./components/NoteCard.jsx";
import EditModal from "./components/EditModal.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";

const TOKEN_KEY = "notes_token";
const USER_KEY = "notes_username";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState(() => localStorage.getItem(USER_KEY) || "");

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [isAdminView, setIsAdminView] = useState(false);

  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [composerBusy, setComposerBusy] = useState(false);

  const [log, setLog] = useState([]);

  const pushLog = useCallback((entry) => {
    if (!entry) return;
    setLog((prev) => [entry, ...prev].slice(0, 8));
  }, []);

  // Fetch standard user notes
  const loadNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError("");
    try {
      const { data, logEntry } = await api.listNotes(token);
      pushLog(logEntry);
      setNotes(data);
      setIsAdminView(false);
    } catch (err) {
      if (err instanceof ApiError) {
        pushLog(err.logEntry);
        if (err.status === 401) {
          handleLogout();
        } else {
          setListError(err.detail);
        }
      } else {
        setListError("Could not reach the API. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }, [token, pushLog]);

  // Fetch all user notes (Admin only)
  const loadAdminNotes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setListError("");
    try {
      const { data, logEntry } = await api.listAdminNotes(token);
      pushLog(logEntry);
      setNotes(data);
      setIsAdminView(true);
    } catch (err) {
      if (err instanceof ApiError) {
        pushLog(err.logEntry);
        if (err.status === 403 || err.status === 401) {
          setListError("Access denied: Only admin users can view all notes.");
        } else {
          setListError(err.detail || "Failed to load admin notes.");
        }
      } else {
        setListError("Could not reach the API.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, pushLog]);

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleLogin(newToken, name) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, name);
    setUsername(name);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setNotes([]);
    setLog([]);
    setIsAdminView(false);
  }

  async function handleCreate({ title, body }) {
    setComposerBusy(true);
    try {
      const { data, logEntry } = await api.createNote(token, { title, body, category_id: null });
      pushLog(logEntry);
      setNotes((prev) => [...prev, data]);
    } catch (err) {
      if (err instanceof ApiError) {
        pushLog(err.logEntry);
        setListError(err.detail);
      }
    } finally {
      setComposerBusy(false);
    }
  }

  async function handleSaveEdit(id, { title, body }) {
    setModalBusy(true);
    setModalError("");
    try {
      const { data, logEntry } = await api.updateNote(token, id, { title, body, category_id: null });
      pushLog(logEntry);
      setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
      setEditingNote(null);
    } catch (err) {
      if (err instanceof ApiError) {
        pushLog(err.logEntry);
        if (err.status === 404) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          setEditingNote(null);
          setListError("That note isn't there anymore — it's been removed from your list.");
        } else {
          setModalError(err.detail);
        }
      } else {
        setModalError("Could not reach the API.");
      }
    } finally {
      setModalBusy(false);
    }
  }

  async function handleConfirmDelete(id) {
    setModalBusy(true);
    setModalError("");
    try {
      const { logEntry } = await api.deleteNote(token, id);
      pushLog(logEntry);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeletingNote(null);
    } catch (err) {
      if (err instanceof ApiError) {
        pushLog(err.logEntry);
        if (err.status === 404) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          setDeletingNote(null);
          setListError("Already deleted — that note was gone before this request landed.");
        } else {
          setModalError(err.detail);
        }
      } else {
        setModalError("Could not reach the API.");
      }
    } finally {
      setModalBusy(false);
    }
  }

  if (!token) {
    return <AuthScreen onLogin={handleLogin} onLog={pushLog} />;
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            note<em>book</em>
          </span>
        </div>
        <div className="who">
          <span className="who-name">
            Signed in as <strong>{username}</strong>
          </span>

          {/* Sirf tabhi button show hoga jab user 'admin' hoga */}
          {username === "admin" && (
            !isAdminView ? (
              <button 
                className="btn-ghost" 
                onClick={loadAdminNotes} 
                style={{ color: "#c3a4ff", fontWeight: "bold" }}
              >
                All Notes (Admin)
              </button>
            ) : (
              <button 
                className="btn-ghost" 
                onClick={loadNotes}
              >
                My Notes
              </button>
            )
          )}

          <button className="btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="main">
        {/* Only allow creating notes when in user mode */}
        {!isAdminView && <Composer onCreate={handleCreate} busy={composerBusy} />}

        <div className="section-head">
          <h2 className="section-title">
            {isAdminView ? "All Users Notes (Admin View)" : "Your notes"}
          </h2>
          <span className="section-count">
            {loading ? "loading…" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {listError && <div className="auth-error" style={{ marginBottom: 18 }}>{listError}</div>}

        {!loading && notes.length === 0 ? (
          <div className="empty-state">
            <p>Nothing here yet.</p>
            <span>{isAdminView ? "No notes found across system." : "Add your first note above."}</span>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onEdit={setEditingNote} onDelete={setDeletingNote} />
            ))}
          </div>
        )}
      </main>

      {editingNote && (
        <EditModal
          note={editingNote}
          onSave={handleSaveEdit}
          onCancel={() => {
            setEditingNote(null);
            setModalError("");
          }}
          busy={modalBusy}
          error={modalError}
        />
      )}

      {deletingNote && (
        <ConfirmDialog
          note={deletingNote}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeletingNote(null);
            setModalError("");
          }}
          busy={modalBusy}
          error={modalError}
        />
      )}
    </div>
  );
}