from datetime import datetime, timezone

from app.services.rag import RAGService
from app.services.rag import PedagogicalController
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from app.core.dependencies import get_rag_service, get_controller
from app.core.enums import HelpLevel
from app.core.database import engine
from app.api.v1.router_auth import get_current_user
from app.database.ai_schema import ensure_ai_configuration_schema

# ── In-memory attempts tracker (legacy help-level progression) ────────────
_attempts: dict[str, int] = {}


def get_attempts(user_id: str) -> int:
    return _attempts.get(user_id, 0)


def increment_attempts(user_id: str) -> int:
    _attempts[user_id] = get_attempts(user_id) + 1
    return _attempts[user_id]


def reset_attempts(user_id: str):
    _attempts[user_id] = 0


def seconds_until_cooldown(last_at, cooldown_seconds: int | None) -> int:
    if not cooldown_seconds or cooldown_seconds <= 0 or last_at is None:
        return 0
    if getattr(last_at, "tzinfo", None) is None:
        last_at = last_at.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - last_at).total_seconds()
    return max(0, int(cooldown_seconds - elapsed))


# ── Schemas ──────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    exercise_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    concept: str | None
    help_level: HelpLevel


# ── Chat endpoint ────────────────────────────────────────────
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    rag: RAGService = Depends(get_rag_service),
    controller: PedagogicalController = Depends(get_controller),
):
    user_id = str(current_user["userid"])

    if request.exercise_id:
        with engine.connect() as conn:
            ensure_ai_configuration_schema(conn)
            conn.commit()

        lock_key = f"{user_id}:{request.exercise_id}"
        with engine.connect() as conn:
            # conn.begin() commits on normal exit and rolls back on exception (incl. HTTPException).
            with conn.begin():
                conn.execute(
                    text("SELECT pg_advisory_xact_lock(hashtext(CAST(:lk AS text)), 0)"),
                    {"lk": lock_key},
                )

                row = conn.execute(
                    text("""
                        SELECT e.courseid, t.cooldown_seconds
                        FROM exercise e
                        JOIN exercisestype t ON e.typeid = t.typeid
                        WHERE e.exerciseid = :eid
                    """),
                    {"eid": request.exercise_id},
                ).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Exercise not found")

                course_id = str(row[0])
                cooldown_sec = int(row[1] or 0)

                enr = conn.execute(
                    text("""
                        SELECT 1 FROM enrollments
                        WHERE student_id = :uid AND course_id = :cid
                    """),
                    {"uid": user_id, "cid": course_id},
                ).fetchone()
                if not enr:
                    raise HTTPException(status_code=403, detail="Not enrolled in this course")

                st = conn.execute(
                    text("""
                        SELECT last_ai_response_at
                        FROM student_exercise_ai_state
                        WHERE userid = :uid AND exerciseid = :eid
                    """),
                    {"uid": user_id, "eid": request.exercise_id},
                ).fetchone()
                last_at = st[0] if st else None

                wait = seconds_until_cooldown(last_at, cooldown_sec)
                if wait > 0:
                    raise HTTPException(
                        status_code=429,
                        detail=f"Please wait {wait} seconds before the next AI response.",
                    )

                # hints_used counts only "Get Hint" taps (see /exercises/.../hint). Chat is cooldown-limited
                # but must not consume hint quota, so we never bump hints_used here. ON CONFLICT leaves
                # hints_used unchanged so prior hint usage stays correct.
                conn.execute(
                    text("""
                        INSERT INTO student_exercise_ai_state (userid, exerciseid, hints_used, last_ai_response_at)
                        VALUES (:uid, :eid, 0, NOW())
                        ON CONFLICT (userid, exerciseid) DO UPDATE SET
                            last_ai_response_at = NOW()
                    """),
                    {"uid": user_id, "eid": request.exercise_id},
                )

    concept = controller.detect_concept(request.message)

    if concept is None:
        reset_attempts(user_id)

    attempts = get_attempts(user_id)
    help_level = controller.determine_help_level(attempts)

    response_text = rag.get_response(
        question=request.message,
        help_level=help_level,
        concept=concept,
    )

    increment_attempts(user_id)

    return ChatResponse(
        response=response_text,
        concept=concept,
        help_level=help_level,
    )
