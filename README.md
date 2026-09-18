# 📝 Notes API & Frontend (Full-Stack Application)

A full-stack, user-owned notes management system featuring a **FastAPI** backend, **PostgreSQL** database, **Alembic** migrations, and a modern **React (Vite)** dark-themed frontend.

---

## 🌟 Key Features

- **Authentication & Security**: Secure JWT token-based authentication (`OAuth2`) with password hashing (`bcrypt`).
- **Role-Based Access Control (RBAC)**:
  - **Standard User**: Full CRUD operations scoped strictly to their own notes.
  - **Admin User**: Access to system-wide notes across all users via dedicated admin endpoints.
- **Security-First API Design**: Returns `404 Not Found` instead of `403 Forbidden` when accessing another user's note ID to prevent resource enumeration.
- **Frontend Dashboard**:
  - Dark-mode responsive UI with custom CSS styling.
  - Dynamic login/signup flow with password visibility toggling.
  - Centered confirmation modals for deletion and inline note creation/editing.
  - Role-aware interface adjustments (Admin view vs User view).
- **AI Chat Integration**: FastAPI endpoints (`/chat/local`, `/chat/hosted`) that route messages to either a local Ollama model or a real hosted OpenAI model through a single shared `ask_model` function — the same API contract works for both.
---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Alembic, Pydantic, Passlib/Jose
- **Database**: PostgreSQL 16
- **Frontend**: React 18, Vite, Pure CSS3
- **DevOps**: Docker, Docker Compose, Uvicorn

---

## 🤖 AI Chat Endpoints

- `POST /chat/local` — sends a message to a locally running Ollama model.
- `POST /chat/hosted` — sends a message to a real, hosted OpenAI model (`gpt-4o-mini`).
- Both endpoints share one internal `ask_model(client, model, message)` function; the only thing that differs between a local and hosted call is which client and model name gets passed in.
- Covered by unit tests using a mocked client (happy path + error path) — no real network calls or API spend in the test suite.
- A short written explanation of LoRA/PEFT concepts (`r`, `target_modules`) is included in `explanation.md`.

## 📂 Repository Structure

```text
Notes_API/
├── notes-api/
│   ├── app/
│   │   ├── main.py            # FastAPI app, mounts all routers under /api/v1
│   │   ├── database.py        # SQLAlchemy engine/session/Base
│   │   ├── models.py          # User, Category, Note ORM models
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── auth.py            # JWT creation/verification, password hashing
│   │   └── routers/
│   │       ├── auth_router.py # POST /api/v1/auth/login, register
│   │       ├── notes.py       # /api/v1/notes CRUD (JWT + ownership scoped)
│   │       ├── admin.py       # GET /api/v1/admin/notes (admin-only)
│   │       └── chat.py        # /chat/local and /chat/hosted endpoints
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Seeding & utility scripts
│   ├── tests/                 # Unit tests (mocked client, happy/error path)
│   ├── explanation.md         # LoRA/PEFT written explanation (r, target_modules)
│   ├── Dockerfile
│   └── requirements.txt
│
├── notes-frontend/
│   ├── src/
│   │   ├── components/        # AuthScreen, NoteCard, EditModal, etc.
│   │   ├── api.js             # API wrapper & logging
│   │   ├── App.jsx            # Core layout & app logic
│   │   └── index.css          # Design system & dark theme
│   ├── index.html
│   └── package.json
│
├── docker-compose.yml
└── README.md

## 🚀 Quick Start & Setup

### First-Time Prerequisites Setup

**Backend Environment Setup:**

```bash
cd notes-api
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python3 scripts/create_test_users.py
cd ..
```

**Frontend & Root Dependencies:**

```bash
npm install                    # Install concurrently at root
cd notes-frontend && npm install && cd ..  # Install frontend deps
```

### Running the Project (One-Command)

Run this command from root directory

```bash
npm start
```

This command uses concurrently to start both the backend (http://localhost:8000) and frontend (http://localhost:5173) simultaneously in the same terminal window.

## 🔑 Test Credentials

| **Username** | **Password**     | **Role** | **Access Scope**                  |
| ------------ | ---------------- | -------- | --------------------------------- |
| `alice`      | `alice-pass-123` | User     | Personal notes only               |
| `bob`        | `bob-pass-123`   | User     | Personal notes only               |
| `admin`      | `admin-pass-123` | Admin    | Global view across all user notes |
