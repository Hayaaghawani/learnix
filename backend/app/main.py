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

# Haya's RAG stack - updated imports
from app.services.rag.llm_service import RAGService
from app.services.rag.pedagogical_controller import PedagogicalController
#tala's endpoints for attempts 
from app.api import attempts

# ── App init ────────────────────────────────────────────────
app = FastAPI()


# include Tala's router
app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(courses_router)
app.include_router(exercises_router)
app.include_router(attempts.router)
#app.include_router(users_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── RAG startup ─────────────────────────────────────────────
# Runs once when the server starts.
# Loads all knowledge base files, chunks, embeds, and indexes them.
# This takes ~5 seconds on first run (model download already done).
rag_service = RAGService(knowledge_base_path="data/knowledge_base")
controller = PedagogicalController()

# ── In-memory attempts tracker ───────────────────────────────
# Key: user_id (str), Value: attempt count (int)
# TODO: replace with DB call when PostgreSQL is connected (Step DB)
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
    user_id: str = "anonymous"  # default until auth is wired


class ChatResponse(BaseModel):
    response: str
    concept: str | None      # which topic was detected, None if unknown
    help_level: str          # conceptual_hint | guided_hint | solution


# ── Chat endpoint ────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    # 1. Detect concept — if new topic, reset attempt counter
    concept = controller.detect_concept(request.message)
    if concept is None:
        # Unknown concept: still answer via RAG, treat as first attempt
        reset_attempts(request.user_id)

    # 2. Get current attempts and determine help level
    attempts = get_attempts(request.user_id)
    help_level = controller.determine_help_level(attempts)

    # 3. Run full RAG pipeline
    response_text = rag_service.get_response(
        question=request.message,
        help_level=help_level,
    )

    # 4. Increment attempts AFTER responding
    increment_attempts(request.user_id)

    return ChatResponse(
        response=response_text,
        concept=concept,
        help_level=help_level,
    )



