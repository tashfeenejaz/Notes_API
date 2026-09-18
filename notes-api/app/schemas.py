
""" Pydantic models -- these define the request/response shapes, separate
from the SQLAlchemy models which define the DB shape. Keeping them
separate means the API's public contract can stay stable even if the
DB schema changes internally """
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    body: str = Field(default="", max_length=5000)
    category_id: int | None = None


class NoteUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    body: str | None = Field(None, max_length=5000)
    category_id: int | None = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str
    owner_id: int
    category_id: int | None
    created_at: datetime
    updated_at: datetime


class NoteAdminOut(NoteOut):
    """Same shape as NoteOut -- admin listing doesn't need extra fields today,
    but kept as its own schema so the admin response can diverge later
    (e.g. adding owner username) without touching the regular user contract."""
    pass


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)