"""
database.py
SQLAlchemy engine + session setup, shared by the app and by Alembic.
<<<<<<< HEAD

Now backed by PostgreSQL (previously SQLite during initial development).
DATABASE_URL must be set via environment variable -- there is no
silent local-file fallback anymore, since a missing/wrong URL should
fail loudly rather than quietly writing to a SQLite file no one is
looking at.
=======
>>>>>>> 6fd6bc59e22a9ed6942a655a33e2c7b6708e17a3
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Example: postgresql://postgres:postgres@localhost:5432/notes_api"
    )

# check_same_thread only applies to SQLite; kept here (conditionally) so
# this module still works if someone points DATABASE_URL at a sqlite://
# URL for a quick local test -- but PostgreSQL is now the default target.
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, always closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
