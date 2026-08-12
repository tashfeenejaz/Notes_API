# notebook — frontend for the Notes API

A black-and-purple React + Vite frontend implementing the full CRUD loop
(list, create, edit, delete) against your Week 3 FastAPI backend.

## Setup

```bash
npm install
cp .env.example .env   # points at http://localhost:8000 by default
npm run dev
```

Runs at `http://localhost:5173`.

## Backend

Your FastAPI backend needs `CORSMiddleware` allowing `http://localhost:5173` —
this has already been added to your uploaded `app/main.py`, so use the
updated copy. Then run it as usual:

```bash
export JWT_SECRET_KEY="some-long-random-string"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_api"
uvicorn app.main:app --reload
```

## What's where

- `src/api.js` — the one place every fetch call goes through: attaches the
  bearer token, checks `response.ok` (fetch resolves on 404s too, it only
  rejects on real network failure), and reports each call's real status
  code.
- `src/App.jsx` — owns the notes list state; create appends, edit replaces
  one entry from the response, delete filters one entry out — no full
  re-fetch after the initial load.
- `src/components/Composer.jsx` vs `EditModal.jsx` — same form shape, but
  Composer always starts blank and EditModal starts pre-filled from the
  note being edited.
- `src/components/Ledger.jsx` — the bottom-right panel. Every request's
  real status code lands there as it happens (200 / 201 / 204 / 404), so
  you can see the assignment's status-code handling actually working
  instead of it being invisible.

## Trying the 404 case

Delete a note, then click Delete on it again before the list re-renders
(or open two tabs on the same note) — the second request gets a real 404
from the backend, which shows up in the ledger and as a message rather
than crashing.
