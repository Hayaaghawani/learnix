from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role
import uuid

router = APIRouter(prefix="/exercises", tags=["Exercises"])


class ExerciseCreate(BaseModel):
    courseId: str
    typeId: str
    title: str
    difficultyLevel: str
    exerciseType: str
    keyConcept: str | None = None
    prerequisites: str | None = None
    problem: str
    referenceSolution: str | None = None
    dueDate: str

#Get exercises for a course
@router.get("/course/{course_id}")
def get_exercises_by_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        if current_user["role"] == "student":
            enrollment = conn.execute(
                text("""
                    SELECT 1
                    FROM enrollments
                    WHERE student_id = :userid
                      AND course_id = :course_id
                """),
                {
                    "userid": current_user["userid"],
                    "course_id": course_id
                }
            ).fetchone()

            if not enrollment:
                raise HTTPException(status_code=403, detail="Not enrolled in this course")

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
                raise HTTPException(status_code=403, detail="Not your course")

        result = conn.execute(
            text("""
                SELECT exerciseid, courseid, title, difficultylevel, exercisetype,
                       keyconcept, prerequisites, problem, referencesolution,
                       isactive, createdat, duedate, updatedat, typeid, userid
                FROM exercise
                WHERE courseid = :course_id
                ORDER BY createdat DESC
            """),
            {"course_id": course_id}
        ).fetchall()

    exercises = []
    for row in result:
        exercises.append({
            "exerciseId": str(row[0]),
            "courseId": str(row[1]),
            "title": row[2],
            "difficultyLevel": row[3],
            "exerciseType": row[4],
            "keyConcept": row[5],
            "prerequisites": row[6],
            "problem": row[7],
            "referenceSolution": row[8],
            "isActive": row[9],
            "createdAt": row[10],
            "dueDate": row[11],
            "updatedAt": row[12],
            "typeId": str(row[13]),
            "userId": str(row[14]),
        })

    return {
        "count": len(exercises),
        "exercises": exercises
    }

#Get one exercise info
@router.get("/{exercise_id}")
def get_exercise(
    exercise_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        exercise = conn.execute(
            text("""
                SELECT exerciseid, courseid, title, difficultylevel, exercisetype,
                       keyconcept, prerequisites, problem, referencesolution,
                       isactive, createdat, duedate, updatedat, typeid, userid
                FROM exercise
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id}
        ).fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        course_id = str(exercise[1])

        if current_user["role"] == "student":
            enrollment = conn.execute(
                text("""
                    SELECT 1
                    FROM enrollments
                    WHERE student_id = :userid
                      AND course_id = :course_id
                """),
                {
                    "userid": current_user["userid"],
                    "course_id": course_id
                }
            ).fetchone()

            if not enrollment:
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

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
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

    return {
        "exerciseId": str(exercise[0]),
        "courseId": str(exercise[1]),
        "title": exercise[2],
        "difficultyLevel": exercise[3],
        "exerciseType": exercise[4],
        "keyConcept": exercise[5],
        "prerequisites": exercise[6],
        "problem": exercise[7],
        "referenceSolution": exercise[8],
        "isActive": exercise[9],
        "createdAt": exercise[10],
        "dueDate": exercise[11],
        "updatedAt": exercise[12],
        "typeId": str(exercise[13]),
        "userId": str(exercise[14]),
    }

#Create exercise as instructor:
@router.post("/")
def create_exercise(
    request: ExerciseCreate,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        course = conn.execute(
            text("""
                SELECT instructorid
                FROM courses
                WHERE courseid = :course_id
            """),
            {"course_id": request.courseId}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if str(course[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="You do not own this course")

        exercise_type = conn.execute(
            text("""
                SELECT typeid
                FROM exercisestype
                WHERE typeid = :type_id
            """),
            {"type_id": request.typeId}
        ).fetchone()

        if not exercise_type:
            raise HTTPException(status_code=404, detail="Exercise type not found")

        new_exercise = conn.execute(
            text("""
                INSERT INTO exercise (
                    exerciseid, courseid, userid, typeid,
                    title, difficultylevel, exercisetype,
                    keyconcept, prerequisites, problem,
                    referencesolution, duedate, isactive, createdat
                )
                VALUES (
                    :exerciseid, :courseid, :userid, :typeid,
                    :title, :difficultylevel, :exercisetype,
                    :keyconcept, :prerequisites, :problem,
                    :referencesolution, :duedate, TRUE, CURRENT_TIMESTAMP
                )
                RETURNING exerciseid
            """),
            {
                "exerciseid": str(uuid.uuid4()),
                "courseid": request.courseId,
                "userid": current_user["userid"],
                "typeid": request.typeId,
                "title": request.title,
                "difficultylevel": request.difficultyLevel,
                "exercisetype": request.exerciseType,
                "keyconcept": request.keyConcept,
                "prerequisites": request.prerequisites,
                "problem": request.problem,
                "referencesolution": request.referenceSolution,
                "duedate": request.dueDate
            }
        ).fetchone()

        conn.commit()

    return {
        "message": "Exercise created successfully",
        "exerciseId": str(new_exercise[0])
    }
