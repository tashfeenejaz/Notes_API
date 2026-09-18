"""
routers/admin.py
GET /api/v1/admin/notes -- admin-only, returns every note from every
user. Gated by get_current_admin_user, which itself depends on
get_current_user, so an admin route STILL requires a valid JWT first
(401) before the role check (403) even runs.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_admin_user
from app.database import get_db
from app.models import Note, User
from app.schemas import NoteAdminOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/notes", response_model=list[NoteAdminOut])
def list_all_notes(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
):
    return db.query(Note).order_by(Note.id).all()
