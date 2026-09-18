# Self-Review Checklist — feature/notes-api

Completed before requesting review, per the assignment's discipline.

- [x] Schema was designed on paper first (Note: id/title/body/owner_id/
      category_id/created_at; Category: id/name); FK direction confirmed
      as "many side holds the FK" before any code was written.
- [x] `Note`/`Category`/`User` are real SQLAlchemy models with a working
      relationship (`relationship()` + `back_populates` both directions).
- [x] Schema built and evolved entirely through Alembic — initial
      migration (`9213896b493a`) plus one incremental migration
      (`9a64e1e9ebd4`, adds `updated_at`). Both apply cleanly with
      `alembic upgrade head` on a fresh database.
- [x] All five `/notes` endpoints implemented and manually verified
      against the running server with correct status codes: 201 create,
      200 read/update, 204 delete, 404 missing-or-not-yours, 422 bad input.
- [x] Every `/notes/*` and `/admin/*` route requires a valid JWT.
      Verified all four standard cases by hand: missing token (401),
      malformed/garbage token (401), expired token (401), valid token
      (200/201/etc as appropriate).
- [x] Ownership filtering verified by logging in as two different users
      (alice, bob) and confirming: (a) each only sees their own notes in
      `GET /notes`; (b) requesting the other's note by id returns 404,
      not 403, on GET/PUT/DELETE alike; (c) the other user's note is
      provably unchanged afterward.
- [x] `GET /admin/notes` verified role-gated: non-admin token -> 403,
      admin token -> 200 with every user's notes included.
- [x] No secrets committed — `JWT_SECRET_KEY` and `DATABASE_URL` are
      both read from environment variables; `.env` is gitignored;
      `.env.example` documents the required variables without real values.
- [x] `.gitignore` excludes `__pycache__/`, `venv/`, `.env`, and `*.db`
      so no local database file or virtualenv artifacts are in the diff.

