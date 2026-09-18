from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

def get_local_client() -> OpenAI:
    return OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

def get_hosted_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_model(client: OpenAI, model: str, message: str) -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": message}],
    )
    return response.choices[0].message.content

@router.post("/chat/local", response_model=ChatResponse)
def chat_local(payload: ChatRequest) -> ChatResponse:
    reply = ask_model(get_local_client(), model="llama3.2:3b", message=payload.message)
    return ChatResponse(reply=reply)

@router.post("/chat/hosted", response_model=ChatResponse)
def chat_hosted(payload: ChatRequest) -> ChatResponse:
    reply = ask_model(get_hosted_client(), model="gpt-4o-mini", message=payload.message)
    return ChatResponse(reply=reply)