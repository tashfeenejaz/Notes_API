"""
Two separate concerns living together on purpose:

  1. Password hashing (bcrypt via passlib) -- for the login endpoint that
     ISSUES tokens.
  2. JWT creation/verification -- for every /notes/* and /admin/* route
     that REQUIRES a token.

SECRET_KEY is read from an environment variable, never hardcoded.
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl just tells the /docs UI where to get a token from; it doesn't
# perform any redirect or validation itself.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(plaintext: str) -> str:
    return pwd_context.hash(plaintext)


def verify_password(plaintext: str, hashed: str) -> bool:
    return pwd_context.verify(plaintext, hashed)


def create_access_token(user_id: int, role: str, expires_delta: timedelta | None = None) -> str:
    """
    'sub' (subject) carries the user id -- this is what every protected
    route uses to figure out WHO is calling, without touching the DB
    just to authenticate. 'role' rides along as its own claim so RBAC
    checks (admin-only routes) don't need an extra DB lookup either.
    """
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")

    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    401 on: missing token (OAuth2PasswordBearer itself raises 401 if the
    Authorization header is absent), garbage/unparseable token, expired
    token, or a token whose 'sub' no longer matches a real user.
    Every failure path collapses to the SAME 401 -- we never hint at
    which part was wrong, that's an authentication detail an attacker
    shouldn't get for free.
    """
    if not SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise _credentials_exception()
    except PyJWTError:
        # Covers garbage tokens, bad signature, AND expired tokens --
        # PyJWT raises ExpiredSignatureError, a PyJWTError subclass.
        raise _credentials_exception()

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise _credentials_exception()
    return user


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    403, not 401: by this point the caller HAS proven who they are
    (valid token). What's missing is permission, not identity -- and
    unlike the note-ownership case, the admin route's existence isn't
    a secret, so it's fine to say 'you're not allowed' outright.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )
    return current_user
