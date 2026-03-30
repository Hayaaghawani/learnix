# backend/app/main.py

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Tala's routers — untouched
from app.api import login_auth, users, admin
from app.api.login_auth import router as auth_router

# Haya's RAG stack
from app.services.llm_service import RAGService
from app.services.pedagogical_controller import PedagogicalController


# ── App init ────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tala's routers
app.include_router(login_auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(auth_router)


# ── RAG startup ─────────────────────────────────────────────
# Runs once when the server starts.
# Loads all knowledge base files, chunks, embeds, and indexes them.
# This takes ~5 seconds on first run (model download already done).
rag_service = RAGService(knowledge_base_path="knowledge_base")
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