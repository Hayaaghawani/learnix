from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.login_auth import get_current_user, require_role
import uuid
from datetime import date

router = APIRouter(prefix="/attempts", tags=["Attempts"])


# request model for creating a new attempt
class AttemptCreate(BaseModel):
    exerciseId: str
    submittedCode: str | None = None


# request model for adding execution summary
class ExecutionSummaryCreate(BaseModel):
    runtimeMs: int
    memoryKb: int
    stdout: str | None = None
    stderr: str | None = None
    passedCount: int
    failedCount: int


# get all attempts for the logged-in student
@router.get("/my")
def get_my_attempts(current_user: dict = Depends(require_role(["student"]))):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT attemptid, userid, exerciseid, reportid, attemptnumber,
                       status, score, hintcount, submittedcode, passedtestcases
                FROM exerciseattempt
                WHERE userid = :userid
                ORDER BY attemptnumber DESC
            """),
            {"userid": current_user["userid"]}
        ).fetchall()

    attempts = []
    for row in result:
        attempts.append({
            "attemptId": str(row[0]),
            "userId": str(row[1]),
            "exerciseId": str(row[2]),
            "reportId": str(row[3]),
            "attemptNumber": row[4],
            "status": row[5],
            "score": row[6],
            "hintCount": row[7],
            "submittedCode": row[8],
            "passedTestCases": row[9],
        })

    return {
        "count": len(attempts),
        "attempts": attempts
    }


# get one attempt
@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        attempt = conn.execute(
            text("""
                SELECT attemptid, userid, exerciseid, reportid, attemptnumber,
                       status, score, hintcount, submittedcode, passedtestcases
                FROM exerciseattempt
                WHERE attemptid = :attempt_id
            """),
            {"attempt_id": attempt_id}
        ).fetchone()

        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        # student can only access own attempt
        if current_user["role"] == "student":
            if str(attempt[1]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        # instructor can only access attempts for their course
        elif current_user["role"] == "instructor":
            exercise = conn.execute(
                text("""
                    SELECT e.courseid, c.instructorid
                    FROM exercise e
                    JOIN courses c ON e.courseid = c.courseid
                    WHERE e.exerciseid = :exercise_id
                """),
                {"exercise_id": str(attempt[2])}
            ).fetchone()

            if not exercise or str(exercise[1]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

    return {
        "attemptId": str(attempt[0]),
        "userId": str(attempt[1]),
        "exerciseId": str(attempt[2]),
        "reportId": str(attempt[3]),
        "attemptNumber": attempt[4],
        "status": attempt[5],
        "score": attempt[6],
        "hintCount": attempt[7],
        "submittedCode": attempt[8],
        "passedTestCases": attempt[9],
    }


# create a new attempt
@router.post("/")
def create_attempt(
    request: AttemptCreate,
    current_user: dict = Depends(require_role(["student"]))
):
    with engine.connect() as conn:
        # check exercise exists
        exercise = conn.execute(
            text("""
                SELECT exerciseid, courseid
                FROM exercise
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": request.exerciseId}
        ).fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        course_id = str(exercise[1])

        # check student is enrolled in the course
        enrollment = conn.execute(
            text("""
                SELECT 1
                FROM enrollments
                WHERE student_id = :student_id
                  AND course_id = :course_id
            """),
            {
                "student_id": current_user["userid"],
                "course_id": course_id
            }
        ).fetchone()

        if not enrollment:
            raise HTTPException(status_code=403, detail="You are not enrolled in this course")

        # find report for this student and this course
        report = conn.execute(
            text("""
                SELECT reportid
                FROM studentreport
                WHERE userid = :userid
                  AND courseid = :course_id
            """),
            {
                "userid": current_user["userid"],
                "course_id": course_id
            }
        ).fetchone()

        # if no report exists, create one
        if not report:
            today = date.today()

            report = conn.execute(
                text("""
                    INSERT INTO studentreport (
                        reportid, courseid, userid, completionrate,
                        weaknesssummary, performancesummary, recommendations,
                        createdat, lastupdated
                    )
                    VALUES (
                        :reportid, :courseid, :userid, :completionrate,
                        :weaknesssummary, :performancesummary, :recommendations,
                        :createdat, :lastupdated
                    )
                    RETURNING reportid
                """),
                {
                    "reportid": str(uuid.uuid4()),
                    "courseid": course_id,
                    "userid": current_user["userid"],
                    "completionrate": 0,
                    "weaknesssummary": None,
                    "performancesummary": "No attempts yet",
                    "recommendations": "Start solving exercises to build your report",
                    "createdat": today,
                    "lastupdated": today
                }
            ).fetchone()

        # get last attempt number for this student on this exercise
        last_attempt = conn.execute(
            text("""
                SELECT COALESCE(MAX(attemptnumber), 0)
                FROM exerciseattempt
                WHERE userid = :userid
                  AND exerciseid = :exercise_id
            """),
            {
                "userid": current_user["userid"],
                "exercise_id": request.exerciseId
            }
        ).fetchone()

        next_attempt_number = int(last_attempt[0]) + 1

        # create new attempt
        new_attempt = conn.execute(
            text("""
                INSERT INTO exerciseattempt (
                    attemptid, userid, exerciseid, reportid,
                    attemptnumber, status, score, hintcount,
                    submittedcode, passedtestcases
                )
                VALUES (
                    :attemptid, :userid, :exerciseid, :reportid,
                    :attemptnumber, :status, :score, :hintcount,
                    :submittedcode, :passedtestcases
                )
                RETURNING attemptid
            """),
            {
                "attemptid": str(uuid.uuid4()),
                "userid": current_user["userid"],
                "exerciseid": request.exerciseId,
                "reportid": str(report[0]),
                "attemptnumber": next_attempt_number,
                "status": "InProgress",
                "score": 0,
                "hintcount": 0,
                "submittedcode": request.submittedCode,
                "passedtestcases": 0
            }
        ).fetchone()

        conn.commit()

    return {
        "message": "Attempt created successfully",
        "attemptId": str(new_attempt[0]),
        "attemptNumber": next_attempt_number,
        "reportId": str(report[0])
    }


# add execution summary, student +inst
@router.post("/{attempt_id}/execution-summary")
def add_execution_summary(
    attempt_id: str,
    request: ExecutionSummaryCreate,
    current_user: dict = Depends(require_role(["student", "instructor", "admin"]))
):
    with engine.connect() as conn:
        attempt = conn.execute(
            text("""
                SELECT attemptid, userid, exerciseid
                FROM exerciseattempt
                WHERE attemptid = :attempt_id
            """),
            {"attempt_id": attempt_id}
        ).fetchone()

        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        if current_user["role"] == "student":
            if str(attempt[1]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        elif current_user["role"] == "instructor":
            exercise = conn.execute(
                text("""
                    SELECT c.instructorid
                    FROM exercise e
                    JOIN courses c ON e.courseid = c.courseid
                    WHERE e.exerciseid = :exercise_id
                """),
                {"exercise_id": str(attempt[2])}
            ).fetchone()

            if not exercise or str(exercise[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        existing = conn.execute(
            text("""
                SELECT summaryid
                FROM executionsummary
                WHERE attemptid = :attempt_id
            """),
            {"attempt_id": attempt_id}
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Execution summary already exists for this attempt")

        new_summary = conn.execute(
            text("""
                INSERT INTO executionsummary (
                    summaryid, attemptid, runtimems, memorykb,
                    stdout, stderr, passedcount, failedcount
                )
                VALUES (
                    :summaryid, :attemptid, :runtimems, :memorykb,
                    :stdout, :stderr, :passedcount, :failedcount
                )
                RETURNING summaryid
            """),
            {
                "summaryid": str(uuid.uuid4()),
                "attemptid": attempt_id,
                "runtimems": request.runtimeMs,
                "memorykb": request.memoryKb,
                "stdout": request.stdout,
                "stderr": request.stderr,
                "passedcount": request.passedCount,
                "failedcount": request.failedCount
            }
        ).fetchone()

        conn.commit()

    return {
        "message": "Execution summary added successfully",
        "summaryId": str(new_summary[0])
    }