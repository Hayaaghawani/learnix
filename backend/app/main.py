from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth_router,
    admin_router,
    users_router,
    courses_router,
    exercises_router,
    notifications_router,
)

from app.services.rag.llm_service import RAGService
from app.services.rag.pedagogical_controller import PedagogicalController
from app.api import attempts

# ── App init ────────────────────────────────────────────────
app = FastAPI()

# ── CORS must be before all routers ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(courses_router)
app.include_router(exercises_router)
app.include_router(attempts.router)
app.include_router(admin_router)

# ── RAG startup ─────────────────────────────────────────────
rag_service = RAGService(knowledge_base_path="data/knowledge_base")
controller = PedagogicalController()

# ── In-memory attempts tracker ───────────────────────────────
_attempts: dict[str, int] = {}

def get_attempts(user_id: str) -> int:
    return _attempts.get(user_id, 0)

def increment_attempts(user_id: str) -> int:
    _attempts[user_id] = get_attempts(user_id) + 1
    return _attempts[user_id]

def reset_attempts(user_id: str):
    _attempts[user_id] = 0

# ── Schemas ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"

class ChatResponse(BaseModel):
    response: str
    concept: str | None
    help_level: str

# ── Chat endpoint ────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    concept = controller.detect_concept(request.message)
    if concept is None:
        reset_attempts(request.user_id)

    attempts = get_attempts(request.user_id)
    help_level = controller.determine_help_level(attempts)

    response_text = rag_service.get_response(
        question=request.message,
        help_level=help_level,
    )

    increment_attempts(request.user_id)

    return ChatResponse(
        response=response_text,
        concept=concept,
        help_level=help_level,
    )