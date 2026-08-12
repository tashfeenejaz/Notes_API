import { useState } from "react";
import { api, ApiError } from "../api.js";

export default function AuthScreen({ onLogin, onLog }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await api.register(username, password);
      }
      const { token, logEntry } = await api.login(username, password);
      onLog(logEntry);
      onLogin(token, username);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
        if (err.logEntry) onLog(err.logEntry);
      } else {
        setError("Could not reach the API. Is the backend running?");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === "login" ? (
            <>
              Sign back <em>in</em>
            </>
          ) : (
            <>
              Start a <em>notebook</em>
            </>
          )}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Your notes, kept where you left them."
            : "Pick a username and password — this becomes your login."}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 8 : undefined}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have one?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }}>
                Sign in instead
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
