"""
models.py

Schema (designed on paper first, per the assignment's build sequence):

  User
    id (PK)
    username (unique)
    hashed_password
    role            -- "user" or "admin"; RBAC check reads this claim

  Category
    id (PK)
    name

  Note
    id (PK)
    title
    body
    owner_id    (FK -> users.id)      -- every note belongs to exactly one user
    category_id (FK -> categories.id, NULLABLE) -- a note has AT MOST one category
    created_at

FK direction decided on paper: the "many" side (Note) always holds the
foreign key pointing at the "one" side (User, Category) -- never the
other way around. One user has many notes; one category has many notes.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")  # "user" | "admin"

    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)

    notes = relationship("Note", back_populates="category")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False, default="")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)

    owner = relationship("User", back_populates="notes")
    category = relationship("Category", back_populates="notes")
