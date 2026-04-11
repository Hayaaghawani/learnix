from app.services.rag import RAGService
from app.services.rag import PedagogicalController
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.core.dependencies import get_rag_service, get_controller
from app.core.enums import HelpLevel

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
    exercise_id: str | None = None   # wired to DB next step


class ChatResponse(BaseModel):
    response: str
    concept: str | None      # which topic was detected, None if unknown
    help_level: HelpLevel                      # conceptual_hint | guided_hint | solution


# ── Chat endpoint ────────────────────────────────────────────
router = APIRouter(prefix="/chat", tags=["chat"])
@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    rag: RAGService = Depends(get_rag_service),
    controller: PedagogicalController = Depends(get_controller),
):
    concept = controller.detect_concept(request.message)

    if concept is None:
        reset_attempts(request.user_id)

    attempts = get_attempts(request.user_id)
    help_level = controller.determine_help_level(attempts)

    response_text = rag.get_response(
        question=request.message,
        help_level=help_level,
        concept=concept,
    )

    increment_attempts(request.user_id)

    return ChatResponse(
        response=response_text,
        concept=concept,
        help_level=help_level,
    )

