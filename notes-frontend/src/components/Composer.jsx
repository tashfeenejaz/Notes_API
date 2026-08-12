import { useState } from "react";

/**
 * Create starts blank every time -- the opposite shape from the edit
 * form, which initializes from an existing note's values.
 */
export default function Composer({ onCreate, busy }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title: title.trim(), body });
    setTitle("");
    setBody("");
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-head">New note</div>
      <div className="field">
        <label htmlFor="new-title">Title</label>
        <input
          id="new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's this about?"
          maxLength={200}
          required
        />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="new-body">Body</label>
        <textarea
          id="new-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write it down…"
          maxLength={5000}
        />
      </div>
      <div className="composer-row">
        <button className="btn-primary" type="submit" disabled={busy || !title.trim()}>
          {busy ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
