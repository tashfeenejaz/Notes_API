"""
scripts/create_test_users.py
Seeds two regular users and one admin, so ownership filtering and the
admin route can actually be tested by hand (login as each, compare).

Run:  python3 scripts/create_test_users.py

Idempotent: safe to run more than once, skips users that already exist.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.auth import hash_password
from app.database import SessionLocal
from app.models import User

TEST_USERS = [
    {"username": "alice", "password": "alice-pass-123", "role": "user"},
    {"username": "bob", "password": "bob-pass-123", "role": "user"},
    {"username": "admin", "password": "admin-pass-123", "role": "admin"},
]


def main() -> None:
    db = SessionLocal()
    try:
        for u in TEST_USERS:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                print(f"  {u['username']} already exists, skipping.")
                continue
            user = User(
                username=u["username"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
            )
            db.add(user)
            db.commit()
            print(f"  created {u['username']} (role={u['role']})")
        print("\nDone. Test credentials:")
        for u in TEST_USERS:
            print(f"  username={u['username']:<6} password={u['password']:<16} role={u['role']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
