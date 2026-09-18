# PR: Notes API — CRUD + JWT auth + ownership + admin RBAC

**Branch:** `feature/notes-api` → `main`

## Summary
Notes API built mostly independently, combining REST CRUD, JWT authentication,
a small Notes API built mostly independently, combining REST CRUD, JWT authentication,
ownership-based authorization, and role-based admin access into one
running app — plus the schema managed through Alembic from scratch.

## What's included
- `User`, `Category`, `Note` SQLAlchemy models with a real one-to-many
  relationship (`Note.owner` / `Note.category`).
- Two Alembic migrations (see `alembic/versions/`):
  1. `9213896b493a_create_users_categories_notes_tables.py` — initial schema.
  2. `9a64e1e9ebd4_add_updated_at_column_to_notes.py` — incremental,
     adds `notes.updated_at`.
- `POST /api/v1/auth/login` — issues a JWT given valid credentials.
- `POST/GET/GET/PUT/DELETE /api/v1/notes[/​{id}]` — full CRUD, JWT-gated,
  every query scoped to the caller's own notes.
- `GET /api/v1/admin/notes` — admin-only, lists every user's notes.
- `scripts/create_test_users.py` — seeds two regular users + one admin
  so ownership/RBAC can be exercised by hand.

## Design decisions worth flagging for review
- **404, not 403, for another user's note.** Deliberate: confirming a
  note id belongs to someone else is itself a leak. Contrast with the
  admin route, where 403 is correct because the route's existence
  isn't secret. See README's "Why 404, not 403" section.
- **Ownership check happens inside the query itself** (`WHERE id = ?
  AND owner_id = ?`), not as a separate "fetch then compare owner_id"
  step — there's no code path that can accidentally leak another
  user's row, because the row simply never matches the query.
- **Same 401 for every JWT failure mode** (missing / malformed /
  expired / user-no-longer-exists) — no differentiation in the error
  response, so a caller can't use error messages to probe token validity.

## How to test
See `README.md` → "Manual test flow" for exact curl commands. Short
version: seed test users, log in as `alice` and `bob` separately, try
to read each other's notes (expect 404), then log in as `admin` and
hit `/admin/notes` (expect 200 with everyone's notes); confirm `bob`
gets 403 on the same route.

## Self-review
Completed — see `SELF_REVIEW.md`.

## Migration files included
Yes — both `alembic/versions/*.py` files are part of this diff, so the
schema's history is visible, not just its final state.
