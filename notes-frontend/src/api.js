const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

if (!API_URL) {
  console.error(
    "VITE_API_URL is not set. Copy .env.example to .env and point it at your FastAPI server."
  );
}

class ApiError extends Error {
  constructor(status, detail) {
    super(
      typeof detail === "string" 
        ? detail 
        : Array.isArray(detail) 
        ? detail[0]?.msg || "Validation error" 
        : `Request failed: ${status}`
    );
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Universal request wrapper for authorization & error formatting
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

    return request("/api/v1/auth/login", {
      method: "POST",
      body: form,
      isForm: true,
    }).then(({ data, logEntry }) => ({ token: data.access_token, logEntry }));
  },

  // Fixed & Unified Signup method using internal request helper
  async signup(username, password) {
    const { data, logEntry } = await request("/api/v1/auth/register", {
      method: "POST",
      body: { username, password },
    });
    return { data, logEntry };
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

  listAdminNotes(token) {
    return request("/api/v1/admin/notes", { token });
  },
};

export { ApiError };