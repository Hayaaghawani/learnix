from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role
import uuid
from datetime import datetime
from typing import Optional

# ── Student-facing router ─────────────────────────────────────────────────────
router = APIRouter(prefix="/exercises", tags=["Help Requests"])

# ── Instructor-facing router ──────────────────────────────────────────────────
instructor_router = APIRouter(prefix="/help-requests", tags=["Help Requests"])


class HelpRequestBody(BaseModel):
    message: str
    code_snapshot: Optional[str] = None
    language: Optional[str] = "python"


class ReplyBody(BaseModel):
    reply: str


# ── POST /exercises/{exercise_id}/help-request  (student) ────────────────────
@router.post("/{exercise_id}/help-request")
def create_help_request(
    exercise_id: str,
    body: HelpRequestBody,
    current_user: dict = Depends(require_role(["student"]))
):
    with engine.connect() as conn:
        exercise = conn.execute(
            text("""
                SELECT e.exerciseid, c.instructorid, e.title
                FROM exercise e
                JOIN courses c ON e.courseid = c.courseid
                WHERE e.exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id}
        ).fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        request_id = str(uuid.uuid4())
        now = datetime.utcnow()

        conn.execute(
            text("""
                INSERT INTO helprequest (
                    requestid, exerciseid, studentid, instructorid,
                    message, codesnapshot, language, status, createdat
                )
                VALUES (
                    :requestid, :exerciseid, :studentid, :instructorid,
                    :message, :codesnapshot, :language, :status, :createdat
                )
            """),
            {
                "requestid": request_id,
                "exerciseid": exercise_id,
                "studentid": current_user["userid"],
                "instructorid": str(exercise[1]),
                "message": body.message,
                "codesnapshot": body.code_snapshot,
                "language": body.language,
                "status": "pending",
                "createdat": now,
            }
        )
        conn.commit()

    return {"id": request_id, "status": "pending"}


# ── GET /exercises/{exercise_id}/my-help-request  (student) ──────────────────
@router.get("/{exercise_id}/my-help-request")
def get_my_help_request(
    exercise_id: str,
    current_user: dict = Depends(require_role(["student"]))
):
    with engine.connect() as conn:
        req = conn.execute(
            text("""
                SELECT requestid, message, status, createdat, reply, repliedat
                FROM helprequest
                WHERE exerciseid = :exerciseid AND studentid = :studentid
                ORDER BY createdat DESC
                LIMIT 1
            """),
            {
                "exerciseid": exercise_id,
                "studentid": current_user["userid"]
            }
        ).fetchone()

    if not req:
        return {"request": None}

    return {
        "request": {
            "id": str(req[0]),
            "message": req[1],
            "status": req[2],
            "createdAt": req[3].isoformat() if req[3] else None,
            "reply": req[4],
            "repliedAt": req[5].isoformat() if req[5] else None,
        }
    }


# ── GET /help-requests  (instructor) ─────────────────────────────────────────
@instructor_router.get("")
def list_help_requests(
    status: str = "pending",
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        if status == "all":
            rows = conn.execute(
                text("""
                    SELECT hr.requestid, hr.message, hr.status, hr.createdat,
                           hr.exerciseid, e.title AS exercisetitle,
                           hr.studentid,
                           u.firstname || ' ' || u.lastname AS studentname,
                           hr.reply, hr.repliedat
                    FROM helprequest hr
                    JOIN exercise e ON hr.exerciseid = e.exerciseid
                    JOIN users u ON hr.studentid = u.userid
                    WHERE hr.instructorid = :instructorid
                    ORDER BY hr.createdat DESC
                """),
                {"instructorid": current_user["userid"]}
            ).fetchall()
        else:
            rows = conn.execute(
                text("""
                    SELECT hr.requestid, hr.message, hr.status, hr.createdat,
                           hr.exerciseid, e.title AS exercisetitle,
                           hr.studentid,
                           u.firstname || ' ' || u.lastname AS studentname,
                           hr.reply, hr.repliedat
                    FROM helprequest hr
                    JOIN exercise e ON hr.exerciseid = e.exerciseid
                    JOIN users u ON hr.studentid = u.userid
                    WHERE hr.instructorid = :instructorid AND hr.status = :status
                    ORDER BY hr.createdat DESC
                """),
                {"instructorid": current_user["userid"], "status": status}
            ).fetchall()

    requests = [
        {
            "id": str(row[0]),
            "message": row[1],
            "status": row[2],
            "createdAt": row[3].isoformat() if row[3] else None,
            "exerciseId": str(row[4]),
            "exerciseTitle": row[5],
            "studentId": str(row[6]),
            "studentName": row[7],
            "reply": row[8],
            "repliedAt": row[9].isoformat() if row[9] else None,
        }
        for row in rows
    ]

    return {"requests": requests}


# ── GET /help-requests/{request_id}  (instructor - full detail) ──────────────
@instructor_router.get("/{request_id}")
def get_help_request_detail(
    request_id: str,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        req = conn.execute(
            text("""
                SELECT hr.requestid, hr.exerciseid, hr.studentid,
                       hr.codesnapshot, hr.language, hr.instructorid,
                       hr.reply, hr.repliedat
                FROM helprequest hr
                WHERE hr.requestid = :request_id
            """),
            {"request_id": request_id}
        ).fetchone()

        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        if str(req[5]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed")

        attempts = conn.execute(
            text("""
                SELECT attemptnumber, status, score, passedtestcases
                FROM exerciseattempt
                WHERE userid = :studentid AND exerciseid = :exerciseid
                ORDER BY attemptnumber DESC
            """),
            {
                "studentid": str(req[2]),
                "exerciseid": str(req[1])
            }
        ).fetchall()

    submissions = [
        {
            "attemptNumber": row[0],
            "status": row[1],
            "score": row[2],
            "passedTestCases": row[3],
        }
        for row in attempts
    ]

    return {
        "codeSnapshot": req[3],
        "language": req[4],
        "submissions": submissions,
        "reply": req[6],
        "repliedAt": req[7].isoformat() if req[7] else None,
    }


# ── POST /help-requests/{request_id}/reply  (instructor) ─────────────────────
@instructor_router.post("/{request_id}/reply")
def reply_to_help_request(
    request_id: str,
    body: ReplyBody,
    current_user: dict = Depends(require_role(["instructor"]))
):
    if not body.reply.strip():
        raise HTTPException(status_code=400, detail="Reply cannot be empty.")

    with engine.connect() as conn:
        req = conn.execute(
            text("SELECT instructorid FROM helprequest WHERE requestid = :request_id"),
            {"request_id": request_id}
        ).fetchone()

        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        if str(req[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed")

        conn.execute(
            text("""
                UPDATE helprequest
                SET reply = :reply, repliedat = :repliedat, status = 'resolved'
                WHERE requestid = :request_id
            """),
            {
                "reply": body.reply.strip(),
                "repliedat": datetime.utcnow(),
                "request_id": request_id,
            }
        )
        conn.commit()

    return {"message": "Reply sent successfully."}


# ── PATCH /help-requests/{request_id}/resolve  (instructor) ──────────────────
@instructor_router.patch("/{request_id}/resolve")
def resolve_help_request(
    request_id: str,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        req = conn.execute(
            text("SELECT instructorid FROM helprequest WHERE requestid = :request_id"),
            {"request_id": request_id}
        ).fetchone()

        if not req:
            raise HTTPException(status_code=404, detail="Request not found")

        if str(req[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed")

        conn.execute(
            text("UPDATE helprequest SET status = 'resolved' WHERE requestid = :request_id"),
            {"request_id": request_id}
        )
        conn.commit()

    return {"status": "resolved"}