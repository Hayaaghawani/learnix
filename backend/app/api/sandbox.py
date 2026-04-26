from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
import httpx
import os
import uuid
import subprocess
import tempfile

from app.core.database import engine
from app.api.v1.router_auth import get_current_user

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

# ─── JUDGE0 CONFIG ────────────────────────────────────────
JUDGE0_API_KEY = "18eb058b89msh29ef7b110c6e24cp1b037djsn9b32bb3b77ed"
JUDGE0_URL = "https://judge0-ce.p.rapidapi.com"
JUDGE0_HEADERS = {
    "x-rapidapi-key": JUDGE0_API_KEY,
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    "Content-Type": "application/json",
}
LANGUAGE_IDS = {
    "python": 71,
    "cpp": 54,
}

# ─── SCHEMAS ──────────────────────────────────────────────
class RunRequest(BaseModel):
    code: str
    language: str
    stdin: Optional[str] = ""

class SubmitRequest(BaseModel):
    code: str
    language: str
    exercise_id: str

class LintRequest(BaseModel):
    code: str
    language: str

# ─── JUDGE0 HELPER ────────────────────────────────────────
async def submit_to_judge0(code: str, language: str, stdin: str = "") -> dict:
    lang_id = LANGUAGE_IDS.get(language)
    if not lang_id:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    payload = {"source_code": code, "language_id": lang_id, "stdin": stdin}

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{JUDGE0_URL}/submissions?base64_encoded=false&wait=true",
                headers=JUDGE0_HEADERS,
                json=payload,
                timeout=30,
            )
            res.raise_for_status()
            return res.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Judge0 error: {e.response.status_code}")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Judge0 timed out")


# ─── RUN (no DB save) ─────────────────────────────────────
@router.post("/run")
async def run_code(req: RunRequest):
    result = await submit_to_judge0(req.code, req.language, req.stdin)
    return {
        "stdout":         result.get("stdout") or "",
        "stderr":         result.get("stderr") or "",
        "compile_output": result.get("compile_output") or "",
        "status":         result.get("status", {}).get("description", "Unknown"),
        "status_id":      result.get("status", {}).get("id"),
        "runtime_ms":     int(float(result.get("time") or 0) * 1000),
        "memory_kb":      result.get("memory") or 0,
    }


# ─── SUBMIT ───────────────────────────────────────────────
@router.post("/submit")
async def submit_code(
    req: SubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userid"]

    # 1. Fetch test cases
    with engine.connect() as conn:
        test_cases = conn.execute(
            text("""
                SELECT testcaseid, input, expectedoutput
                FROM testcases
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": req.exercise_id}
        ).fetchall()

    print(f"DEBUG: exercise_id={req.exercise_id}, test_cases count={len(test_cases)}")

    if not test_cases:
        raise HTTPException(status_code=404, detail="No test cases found for this exercise")

    # 2. Get next attempt number
    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT COALESCE(MAX(attemptnumber), 0) + 1
                FROM exerciseattempt
                WHERE userid = :user_id AND exerciseid = :exercise_id
            """),
            {"user_id": user_id, "exercise_id": req.exercise_id}
        ).fetchone()
    attempt_number = row[0]

    # 3. Run against each test case
    passed = 0
    failed = 0
    results = []
    last_result = None

    for tc in test_cases:
        result = await submit_to_judge0(req.code, req.language, tc[1] or "")
        last_result = result

        stdout = (result.get("stdout") or "").strip()
        expected = (tc[2] or "").strip()
        tc_passed = stdout == expected

        if tc_passed:
            passed += 1
        else:
            failed += 1

        results.append({
            "testcase_id":    str(tc[0]),
            "passed":         tc_passed,
            "stdout":         stdout,
            "stderr":         result.get("stderr") or "",
            "compile_output": result.get("compile_output") or "",
            "expected":       expected,
            "status":         result.get("status", {}).get("description", "Unknown"),
            "runtime_ms":     int(float(result.get("time") or 0) * 1000),
            "memory_kb":      result.get("memory") or 0,
        })

        # Stop early on compile error
        if (result.get("compile_output") or "").strip():
            failed += len(test_cases) - (passed + failed)
            break

    # 4. Calculate score
    total  = len(test_cases)
    score  = round((passed / total) * 100)
    status = "Passed" if passed == total else "Failed"
    attempt_id = str(uuid.uuid4())

    # 5. Get or create studentreport
    with engine.connect() as conn:
        course_row = conn.execute(
            text("SELECT courseid FROM exercise WHERE exerciseid = :eid"),
            {"eid": req.exercise_id}
        ).fetchone()
        course_id = str(course_row[0])

        report_row = conn.execute(
            text("""
                SELECT reportid FROM studentreport
                WHERE userid = :uid AND courseid = :cid
            """),
            {"uid": user_id, "cid": course_id}
        ).fetchone()

        if report_row:
            report_id = str(report_row[0])
        else:
            report_id = str(uuid.uuid4())
            conn.execute(
                text("""
                    INSERT INTO studentreport
                        (reportid, courseid, userid, completionrate,
                         weaknesssummary, performancesummary, recommendations,
                         createdat, lastupdated)
                    VALUES
                        (:reportid, :courseid, :userid, 0,
                         '', '', '',
                         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """),
                {"reportid": report_id, "courseid": course_id, "userid": user_id}
            )

        # 6. Save attempt
        conn.execute(
            text("""
                INSERT INTO exerciseattempt
                    (attemptid, userid, exerciseid, reportid, attemptnumber,
                     status, score, hintcount, submittedcode, passedtestcases)
                VALUES
                    (:attemptid, :userid, :exerciseid, :reportid, :attemptnumber,
                     :status, :score, 0, :submittedcode, :passedtestcases)
            """),
            {
                "attemptid":       attempt_id,
                "userid":          user_id,
                "exerciseid":      req.exercise_id,
                "reportid":        report_id,
                "attemptnumber":   attempt_number,
                "status":          status,
                "score":           score,
                "submittedcode":   req.code,
                "passedtestcases": passed,
            }
        )

        # 7. Save execution summary
        lr = last_result or {}
        conn.execute(
            text("""
                INSERT INTO executionsummary
                    (summaryid, attemptid, runtimems, memorykb,
                     stdout, stderr, passedcount, failedcount)
                VALUES
                    (:summaryid, :attemptid, :runtimems, :memorykb,
                     :stdout, :stderr, :passedcount, :failedcount)
            """),
            {
                "summaryid":   str(uuid.uuid4()),
                "attemptid":   attempt_id,
                "runtimems":   int(float(lr.get("time") or 0) * 1000),
                "memorykb":    lr.get("memory") or 0,
                "stdout":      lr.get("stdout") or "",
                "stderr":      lr.get("stderr") or "",
                "passedcount": passed,
                "failedcount": failed,
            }
        )
        conn.commit()

    return {
        "attempt_id": attempt_id,
        "score":      score,
        "passed":     passed,
        "failed":     failed,
        "total":      total,
        "status":     status,
        "results":    results,
    }


# ─── GET PAST ATTEMPTS ────────────────────────────────────
@router.get("/attempts/{exercise_id}")
def get_attempts(
    exercise_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["userid"]
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT attemptid, attemptnumber, status, score, passedtestcases
                FROM exerciseattempt
                WHERE userid = :user_id AND exerciseid = :exercise_id
                ORDER BY attemptnumber DESC
                LIMIT 10
            """),
            {"user_id": user_id, "exercise_id": exercise_id}
        ).fetchall()

    return {
        "attempts": [
            {
                "attemptId":       str(r[0]),
                "attemptNumber":   r[1],
                "status":          r[2],
                "score":           r[3],
                "passedTestCases": r[4],
            }
            for r in rows
        ]
    }


# ─── LINT (syntax check only, no execution) ───────────────
@router.post("/lint")
def lint_code(request: LintRequest, current_user: dict = Depends(get_current_user)):
    suffix = ".cpp" if request.language == "cpp" else ".py"
    with tempfile.NamedTemporaryFile(suffix=suffix, mode="w", delete=False, encoding="utf-8") as f:
        f.write(request.code)
        fname = f.name
    try:
        if request.language == "cpp":
            result = subprocess.run(
                ["g++", "-fsyntax-only", "-Wall", "-Wextra", fname],
                capture_output=True, text=True, timeout=10
            )
        else:
            result = subprocess.run(
                ["python", "-m", "py_compile", fname],
                capture_output=True, text=True, timeout=10
            )
        errors = (result.stderr or "").replace(fname, "code")
        return {"errors": errors, "has_errors": result.returncode != 0}
    except subprocess.TimeoutExpired:
        return {"errors": "", "has_errors": False}
    except FileNotFoundError:
        # g++ not installed — return empty so frontend doesn't break
        return {"errors": "", "has_errors": False}
    finally:
        try:
            os.unlink(fname)
        except Exception:
            pass