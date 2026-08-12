const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  // Fails loudly on purpose -- same discipline as the backend's
  // DATABASE_URL check. A silently-missing base URL just produces
  // confusing "Failed to fetch" errors later.
  console.error(
    "VITE_API_URL is not set. Copy .env.example to .env and point it at your FastAPI server."
  );
}

class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed: ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Every call funnels through here so the two rules that matter today
 * apply everywhere, once: (1) attach the bearer token if we have one,
 * (2) check response.ok before trusting anything -- fetch only rejects
 * on a genuine network failure, so a 404 or 401 still resolves as a
 * "successful" fetch and has to be checked explicitly.
 */
async function request(path, { method = "GET", token, body, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  const entry = {
    method,
    path,
    status: response.status,
    ok: response.ok,
    at: Date.now(),
  };

  if (!response.ok) {
    const detail =
      (payload && typeof payload === "object" && payload.detail) || `Request failed: ${response.status}`;
    const err = new ApiError(response.status, detail);
    err.logEntry = entry;
    throw err;
  }

  return { data: payload, logEntry: entry };
}

export const api = {
  login(username, password) {
    const form = new URLSearchParams();
    form.set("username", username);
    form.set("password", password);
    // OAuth2PasswordRequestForm on the backend expects
    // application/x-www-form-urlencoded, not JSON.
    return request("/api/v1/auth/login", {
      method: "POST",
      body: form,
      isForm: true,
    }).then(({ data, logEntry }) => ({ token: data.access_token, logEntry }));
  },

  register(username, password) {
    return request("/api/v1/auth/register", {
      method: "POST",
      body: { username, password },
    });
  },

  listNotes(token) {
    return request("/api/v1/notes", { token });
  },

  createNote(token, { title, body, category_id }) {
    return request("/api/v1/notes", {
      method: "POST",
      token,
      body: { title, body, category_id },
    });
  },

  updateNote(token, id, { title, body, category_id }) {
    return request(`/api/v1/notes/${id}`, {
      method: "PUT",
      token,
      body: { title, body, category_id },
    });
  },

  deleteNote(token, id) {
    return request(`/api/v1/notes/${id}`, { method: "DELETE", token });
  },
};

export { ApiError };
