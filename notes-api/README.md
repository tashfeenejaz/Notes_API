# Notes API 

A small CRUD API for user-owned notes, with JWT auth and role-based
admin access. Built on the same techniques as the Task API (Mon–Wed),
applied to a new domain mostly independently.

## Domain
- A **Note** belongs to exactly one **User** (`owner_id`) and optionally
  one **Category** (`category_id`, nullable).
- A **Category** can have many notes — classic one-to-many, same shape
  as the Task/Category relationship from Wednesday.

## Folder layout
```
notes-api/
├── app/
│   ├── main.py            # FastAPI app, mounts all routers under /api/v1
│   ├── database.py        # SQLAlchemy engine/session/Base
│   ├── models.py          # User, Category, Note ORM models
│   ├── schemas.py         # Pydantic request/response models
│   ├── auth.py            # JWT creation/verification, password hashing
│   └── routers/
│       ├── auth_router.py # POST /api/v1/auth/login
│       ├── notes.py       # /api/v1/notes CRUD (JWT + ownership scoped)
│       └── admin.py       # GET /api/v1/admin/notes (admin-only)
├── alembic/
│   └── versions/          # migration history — see below
├── scripts/
│   └── create_test_users.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── app/
├── .env.example
└── README.md
```

## Setup
```bash
cd notes-api
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # then edit with real values
export JWT_SECRET_KEY="some-long-random-string"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notes_api"
```

### Getting PostgreSQL running locally
Easiest option — Docker, no local install needed:
```bash
docker run --name notes-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=notes_api \
  -p 5432:5432 \
  -d postgres:16
```
Prefer a native install instead? `sudo apt install postgresql`, then:
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb notes_api
```
Either way, `DATABASE_URL` above should now be reachable — sanity check with:
```bash
psql "$DATABASE_URL" -c "SELECT 1;"
```

## Database — run the migrations
Schema is built entirely through Alembic, not by hand:
```bash
alembic upgrade head 
```
This applies, in order:
1. `create users, categories, notes tables` — the initial schema.
2. `add updated_at column to notes` — the incremental migration, added
   after the fact once it became clear PUT updates needed a timestamp.
   Uses a `server_default` during the add so it's safe to run even
   against a table that already has rows (PostgreSQL rejects a bare
   `NOT NULL` add-column on non-empty tables without one).

Check history any time with `alembic history` or `alembic current`.

## Running with Docker (recommended)

The whole stack — API + PostgreSQL — runs via Docker Compose, no local
Python or Postgres install needed.

```bash
docker-compose up --build
```

This builds the API image and starts two services:
- `api` — the FastAPI app, exposed on `http://localhost:8000`
- `db` — PostgreSQL 16, exposed on host port `5433` (mapped to `5432`
  inside the container — `5433` avoids clashing with a local Postgres
  install; the API itself talks to `db:5432` internally, unaffected by
  this mapping)

Docs at `http://localhost:8000/docs`.

### Run migrations against the containerized database
With the stack up, in a separate terminal:
```bash
docker-compose exec api alembic upgrade head
```

### Stopping the stack
```bash
docker-compose down       # stops containers, keeps data (named volume persists)
docker-compose down -v    # stops containers AND wipes the database volume
```

### Build cache note
`requirements.txt` is copied and installed before the rest of the app
code in the Dockerfile — so routine code changes reuse the cached
`pip install` layer instead of reinstalling dependencies on every
build.

## Seed test users
Ownership filtering and the admin route both need more than one account
to test meaningfully:
```bash
python3 scripts/create_test_users.py
```
Creates `alice` / `bob` (role=`user`) and `admin` (role=`admin`), all
with password `<name>-pass-123`.

## Run the API
```bash
uvicorn app.main:app --reload
```
Docs at `http://127.0.0.1:8000/docs`.

### Manual test flow
```bash
# 1. Register a new user
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"john-pass-123"}'

# 2. Log in as alice, bob, and admin — each returns a JWT
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -d "username=alice&password=alice-pass-123"

# 3. No token at all -> 401
curl -i http://127.0.0.1:8000/api/v1/notes

# 4. Garbage token -> 401
curl -i http://127.0.0.1:8000/api/v1/notes -H "Authorization: Bearer garbage"

# 5. Alice creates a note -> 201
curl -X POST http://127.0.0.1:8000/api/v1/notes \
  -H "Authorization: Bearer <ALICE_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title": "My note", "body": "..."}'

# 6. Bob tries to GET alice's note by id -> 404 (not 403 — see below)
curl -i http://127.0.0.1:8000/api/v1/notes/1 \
  -H "Authorization: Bearer <BOB_TOKEN>"

# 7. Bob (non-admin) hits the admin route -> 403
curl -i http://127.0.0.1:8000/api/v1/admin/notes \
  -H "Authorization: Bearer <BOB_TOKEN>"

# 8. Admin hits the admin route -> 200, sees every user's notes
curl http://127.0.0.1:8000/api/v1/admin/notes \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Why 404, not 403, for another user's note
Two different failures look identical to the caller on purpose:
- note `id` doesn't exist at all
- note `id` exists but belongs to someone else

Both return `404 Not Found`. Confirming "this id belongs to someone
else" is itself information a non-owner shouldn't get — it would let
someone probe which ids are real. Contrast this with `GET /admin/notes`:
there, the route's existence isn't a secret, so a non-admin correctly
gets `403 Forbidden` — they're identified, just not permitted.

## Status codes implemented
| Endpoint                    | Success | Failure cases                            |
|---------------------------- |---------|----------------------------------------- |
| `POST /notes`               | 201     | 401 (no/bad token), 422 (bad input)      |
| `GET /notes`                | 200     | 401                                      |
| `GET /notes/{id}`           | 200     | 401, 404 (missing or not yours)          |
| `PUT /notes/{id}`           | 200     | 401, 404, 422                            |
| `DELETE /notes/{id}`        | 204     | 401, 404                                 |
| `GET /admin/notes`          | 200     | 401 (no token), 403 (non-admin)          |

## Git workflow
Developed on `feature/notes-api`, off `main`, with incremental commits
following the assignment's own build sequence (models → migration →
unauthenticated CRUD → JWT → ownership → admin route → polish). See
`SELF_REVIEW.md` for the pre-PR checklist and `PR_DESCRIPTION.md` for
the pull request write-up.
