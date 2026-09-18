"""
main.py
Notes API -- Week 3 Day 4 integration assignment.

Run:
    export JWT_SECRET_KEY="some-long-random-string"
    uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, auth_router, notes, chat

app = FastAPI(title="--Notes API -- ")

# The React dev server (Vite, default port 5173) and this API run on
# different ports, which the browser treats as different origins.
# Without this, every request from the frontend fails before it
# reaches any route code.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(chat.router)
