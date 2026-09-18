"""
routers/notes.py
The five /notes endpoints. Every route requires a valid JWT
(via Depends(get_current_user)) and every query is scoped to
current_user.id -- there is no code path here that can return or
touch another user's note.

The 404-not-403 rule: when a note doesn't exist AT ALL, or exists but
belongs to someone else, both cases return 404. We deliberately don't
distinguish them in the response -- confirming "this id belongs to
someone else" is itself information a non-owner shouldn't get.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Note, User
from app.schemas import NoteCreate, NoteOut, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


def _get_owned_note_or_404(db: Session, note_id: int, user_id: int) -> Note:
    """
    Single shared lookup so the 404-not-403 rule can't accidentally be
    implemented differently (and inconsistently) across GET/PUT/DELETE.
    The WHERE clause filters by owner_id in the SAME query as the id
    lookup -- a note owned by someone else simply doesn't match, and
    looks identical to a note that doesn't exist.
    """
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.owner_id == user_id)
        .first()
    )
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(
        title=payload.title,
        body=payload.body,
        category_id=payload.category_id,
        owner_id=current_user.id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("", response_model=list[NoteOut])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Only the current user's own notes -- never anyone else's."""
    return db.query(Note).filter(Note.owner_id == current_user.id).order_by(Note.id).all()


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_note_or_404(db, note_id, current_user.id)


@router.put("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    note = _get_owned_note_or_404(db, note_id, current_user.id)

    if payload.title is not None:
        note.title = payload.title
    if payload.body is not None:
        note.body = payload.body
    if payload.category_id is not None:
        note.category_id = payload.category_id

    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_owned_note_or_404(db, note_id, current_user.id)
    db.delete(note)
    db.commit()
    return None
