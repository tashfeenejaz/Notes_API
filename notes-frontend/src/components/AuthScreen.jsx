import { useState } from "react";
import { api, ApiError } from "../api.js";

export default function AuthScreen({ onLogin, onLog }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (isSignUp) {
        // Step 1: Signup Call
        const signupRes = await api.signup(username, password);
        if (signupRes?.logEntry) onLog?.(signupRes.logEntry);

        // Step 2: Login Call after successful signup
        const loginRes = await api.login(username, password);
        if (loginRes?.logEntry) onLog?.(loginRes.logEntry);
        
        const token = loginRes?.access_token || loginRes?.token;
        onLogin(token, username);
      } else {
        // Pure Login Call
        const loginRes = await api.login(username, password);
        if (loginRes?.logEntry) onLog?.(loginRes.logEntry);

        const token = loginRes?.access_token || loginRes?.token;
        onLogin(token, username);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      
      if (err instanceof ApiError) {
        if (err.logEntry) onLog?.(err.logEntry);
        
        // Pydantic validation array parsing (e.g., username short)
        if (Array.isArray(err.detail)) {
          const firstErr = err.detail[0];
          const field = firstErr?.loc?.slice(-1)[0] || "field";
          setError(`${field}: ${firstErr?.msg || "Validation error"}`);
        } else if (typeof err.detail === "string") {
          setError(err.detail);
        } else {
          setError(err.message || "Authentication failed");
        }
      } else {
        setError(err.message || "Could not reach the server.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2 className="auth-title">
          {isSignUp ? "Create account" : "Sign back"} <em>{isSignUp ? "" : "in"}</em>
        </h2>
        <p className="auth-subtitle">
          {isSignUp ? "Start capturing your ideas today." : "Your notes, kept where you left them."}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alice"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={busy} style={{ marginTop: "16px" }}>
            {busy ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isSignUp ? "Already have an account?" : "New here?"}</span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}