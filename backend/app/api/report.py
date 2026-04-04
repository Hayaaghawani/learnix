from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.login_auth import get_current_user, require_role
import uuid
from datetime import date

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportCreate(BaseModel):
    courseId: str

# get attempts for students 
@router.get("/my")
def get_my_reports(current_user: dict = Depends(require_role(["student"]))):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT reportid, courseid, userid, completionrate,
                       weaknesssummary, performancesummary,
                       recommendations, createdat, lastupdated
                FROM studentreport
                WHERE userid = :userid
                ORDER BY lastupdated DESC
            """),
            {"userid": current_user["userid"]}
        ).fetchall()

    reports = []
    for row in result:
        reports.append({
            "reportId": str(row[0]),
            "courseId": str(row[1]),
            "userId": str(row[2]),
            "completionRate": row[3],
            "weaknessSummary": row[4],
            "performanceSummary": row[5],
            "recommendations": row[6],
            "createdAt": row[7],
            "lastUpdated": row[8],
        })

    return {
        "count": len(reports),
        "reports": reports
    }

#get specific attempt for stud+inst.
@router.get("/{report_id}")
def get_report(report_id: str, current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        report = conn.execute(
            text("""
                SELECT reportid, courseid, userid, completionrate,
                       weaknesssummary, performancesummary,
                       recommendations, createdat, lastupdated
                FROM studentreport
                WHERE reportid = :report_id
            """),
            {"report_id": report_id}
        ).fetchone()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        report_course_id = str(report[1])
        report_user_id = str(report[2])

        if current_user["role"] == "student":
            if report_user_id != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("""
                    SELECT instructorid
                    FROM courses
                    WHERE courseid = :course_id
                """),
                {"course_id": report_course_id}
            ).fetchone()

            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        weaknesses = conn.execute(
            text("""
                SELECT userid, reportid, occurrencecount,
                       lastupdated, lastdetectedat, typeid
                FROM studentweakness
                WHERE reportid = :report_id
            """),
            {"report_id": report_id}
        ).fetchall()

        attempts = conn.execute(
            text("""
                SELECT attemptid, exerciseid, attemptnumber, status,
                       score, hintcount, submittedcode, passedtestcases
                FROM exerciseattempt
                WHERE reportid = :report_id
                ORDER BY attemptnumber DESC
            """),
            {"report_id": report_id}
        ).fetchall()

    return {
        "report": {
            "reportId": str(report[0]),
            "courseId": str(report[1]),
            "userId": str(report[2]),
            "completionRate": report[3],
            "weaknessSummary": report[4],
            "performanceSummary": report[5],
            "recommendations": report[6],
            "createdAt": report[7],
            "lastUpdated": report[8],
        },
        "weaknesses": [
            {
                "userId": str(w[0]),
                "reportId": str(w[1]),
                "occurrenceCount": w[2],
                "lastUpdated": w[3],
                "lastDetectedAt": w[4],
                "typeId": str(w[5]),
            }
            for w in weaknesses
        ],
        "attempts": [
            {
                "attemptId": str(a[0]),
                "exerciseId": str(a[1]),
                "attemptNumber": a[2],
                "status": a[3],
                "score": a[4],
                "hintCount": a[5],
                "submittedCode": a[6],
                "passedTestCases": a[7],
            }
            for a in attempts
        ]
    }


@router.get("/course/{course_id}")
def get_course_reports(
    course_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"]))
):
    with engine.connect() as conn:
        if current_user["role"] == "instructor":
            course = conn.execute(
                text("""
                    SELECT instructorid
                    FROM courses
                    WHERE courseid = :course_id
                """),
                {"course_id": course_id}
            ).fetchone()

            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        result = conn.execute(
            text("""
                SELECT reportid, courseid, userid, completionrate,
                       weaknesssummary, performancesummary,
                       recommendations, createdat, lastupdated
                FROM studentreport
                WHERE courseid = :course_id
                ORDER BY lastupdated DESC
            """),
            {"course_id": course_id}
        ).fetchall()

    reports = []
    for row in result:
        reports.append({
            "reportId": str(row[0]),
            "courseId": str(row[1]),
            "userId": str(row[2]),
            "completionRate": row[3],
            "weaknessSummary": row[4],
            "performanceSummary": row[5],
            "recommendations": row[6],
            "createdAt": row[7],
            "lastUpdated": row[8],
        })

    return {
        "count": len(reports),
        "reports": reports
    }


@router.post("/")
def create_report(
    request: ReportCreate,
    current_user: dict = Depends(require_role(["student"]))
):
    today = date.today()

    with engine.connect() as conn:
        existing = conn.execute(
            text("""
                SELECT reportid
                FROM studentreport
                WHERE userid = :userid
                  AND courseid = :course_id
            """),
            {
                "userid": current_user["userid"],
                "course_id": request.courseId
            }
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Report already exists for this course")

        enrollment = conn.execute(
            text("""
                SELECT 1
                FROM enrollments
                WHERE student_id = :student_id
                  AND course_id = :course_id
            """),
            {
                "student_id": current_user["userid"],
                "course_id": request.courseId
            }
        ).fetchone()

        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        new_report = conn.execute(
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
                "courseid": request.courseId,
                "userid": current_user["userid"],
                "completionrate": 0,
                "weaknesssummary": None,
                "performancesummary": "No attempts yet",
                "recommendations": "Start solving exercises to build your report",
                "createdat": today,
                "lastupdated": today
            }
        ).fetchone()

        conn.commit()

    return {
        "message": "Report created successfully",
        "reportId": str(new_report[0])
    }


@router.post("/{report_id}/refresh")
def refresh_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    today = date.today()

    with engine.connect() as conn:
        report = conn.execute(
            text("""
                SELECT reportid, courseid, userid
                FROM studentreport
                WHERE reportid = :report_id
            """),
            {"report_id": report_id}
        ).fetchone()

        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        course_id = str(report[1])
        student_user_id = str(report[2])

        if current_user["role"] == "student":
            if student_user_id != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("""
                    SELECT instructorid
                    FROM courses
                    WHERE courseid = :course_id
                """),
                {"course_id": course_id}
            ).fetchone()

            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed")

        attempts = conn.execute(
            text("""
                SELECT status, score
                FROM exerciseattempt
                WHERE reportid = :report_id
            """),
            {"report_id": report_id}
        ).fetchall()

        total_attempts = len(attempts)
        passed_attempts = sum(1 for a in attempts if a[0] == "Passed")
        avg_score = round(sum(float(a[1]) for a in attempts) / total_attempts, 2) if total_attempts > 0 else 0

        completion_rate = round((passed_attempts / total_attempts) * 100, 2) if total_attempts > 0 else 0

        if total_attempts == 0:
            performance_summary = "No attempts yet"
            recommendations = "Start solving exercises to generate performance insights"
        elif avg_score >= 85:
            performance_summary = "Excellent performance"
            recommendations = "Keep practicing advanced exercises"
        elif avg_score >= 60:
            performance_summary = "Good progress with room for improvement"
            recommendations = "Review weak areas and retry failed exercises"
        else:
            performance_summary = "Needs improvement"
            recommendations = "Focus on fundamentals and request guidance"

        top_weakness = conn.execute(
            text("""
                SELECT et.name, sw.occurrencecount
                FROM studentweakness sw
                JOIN exercisestype et ON sw.typeid = et.typeid
                WHERE sw.reportid = :report_id
                ORDER BY sw.occurrencecount DESC
                LIMIT 1
            """),
            {"report_id": report_id}
        ).fetchone()

        weakness_summary = (
            f"Main weakness: {top_weakness[0]} ({top_weakness[1]} times)"
            if top_weakness else
            "No weaknesses recorded yet"
        )

        conn.execute(
            text("""
                UPDATE studentreport
                SET completionrate = :completionrate,
                    weaknesssummary = :weaknesssummary,
                    performancesummary = :performancesummary,
                    recommendations = :recommendations,
                    lastupdated = :lastupdated
                WHERE reportid = :report_id
            """),
            {
                "completionrate": completion_rate,
                "weaknesssummary": weakness_summary,
                "performancesummary": performance_summary,
                "recommendations": recommendations,
                "lastupdated": today,
                "report_id": report_id
            }
        )

        conn.commit()

    return {
        "message": "Report refreshed successfully",
        "reportId": report_id,
        "completionRate": completion_rate,
        "performanceSummary": performance_summary,
        "weaknessSummary": weakness_summary,
        "recommendations": recommendations
    }