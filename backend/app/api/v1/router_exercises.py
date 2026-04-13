from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role
import uuid

router = APIRouter(prefix="/exercises", tags=["Exercises"])


def purge_expired_exercises(conn):
    conn.execute(
        text("""
            DELETE FROM exercise
            WHERE duedate < CURRENT_DATE
        """)
    )


def ensure_exercisestype_schema_compat(conn):
    conn.execute(text("ALTER TABLE exercisestype ALTER COLUMN guidancestyle TYPE text"))
    conn.execute(text("ALTER TABLE exercisestype ALTER COLUMN anticipatedmisconceptions TYPE text"))
    conn.execute(text("ALTER TABLE exercisestype ALTER COLUMN category TYPE text"))


class TestCaseCreate(BaseModel):
    input: str | None = None
    expectedOutput: str
    isVisible: bool = True


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
    testCases: list[TestCaseCreate] = []


class CustomModeCreate(BaseModel):
    name: str
    description: str | None = None
    defaultHintLimit: int = 3
    defaultCooldownStrategy: int = 30
    strictLevel: int = 1
    guidanceStyle: str | None = None
    anticipatedMisconceptions: str | None = None
    category: str | None = None


# ── MUST BE FIRST — specific paths before /{exercise_id} ──────────────────

@router.get("/course/{course_id}")
def get_exercises_by_course(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        purge_expired_exercises(conn)
        conn.commit()

        if current_user["role"] == "student":
            enrollment = conn.execute(
                text("""
                    SELECT 1 FROM enrollments
                    WHERE student_id = :userid AND course_id = :course_id
                """),
                {"userid": current_user["userid"], "course_id": course_id}
            ).fetchone()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not enrolled in this course")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
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

    return {"count": len(exercises), "exercises": exercises}


@router.get("/types/course/{course_id}")
def get_exercise_types(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT typeid, name, description, defaulthintlimit,
                       defaultcooldownstrategy, strictlevel, guidancestyle,
                       anticipatedmisconceptions, issystempresent, category
                FROM exercisestype
                WHERE issystempresent = TRUE OR category = :course_id
                ORDER BY issystempresent DESC, name ASC
            """),
            {"course_id": course_id}
        ).fetchall()

    return {
        "types": [
            {
                "typeId": str(row[0]),
                "name": row[1],
                "description": row[2],
                "defaultHintLimit": row[3],
                "defaultCooldownStrategy": row[4],
                "strictLevel": row[5],
                "guidanceStyle": row[6],
                "anticipatedMisconceptions": row[7],
                "isSystemPresent": row[8],
                "category": row[9],
            }
            for row in result
        ]
    }


@router.post("/types/create")
def create_custom_mode(
    request: CustomModeCreate,
    current_user: dict = Depends(require_role(["instructor"]))
):
    cooldown_value = max(0, request.defaultCooldownStrategy)
    if cooldown_value == 0:
        cooldown_strategy = 0
    elif cooldown_value <= 30:
        cooldown_strategy = 1
    else:
        cooldown_strategy = 2

    strict_level = min(2, max(0, request.strictLevel))

    with engine.connect() as conn:
        ensure_exercisestype_schema_compat(conn)

        try:
            new_type = conn.execute(
                text("""
                    INSERT INTO exercisestype (
                        typeid, name, description, defaulthintlimit,
                        defaultcooldownstrategy, strictlevel, guidancestyle,
                        anticipatedmisconceptions, issystempresent, category
                    )
                    VALUES (
                        uuid_generate_v4(), :name, :description, :hintlimit,
                        :cooldown, :strictlevel, :guidancestyle,
                        :misconceptions, FALSE, :category
                    )
                    RETURNING typeid
                """),
                {
                    "name": request.name.strip(),
                    "description": (request.description or "").strip(),
                    "hintlimit": max(0, request.defaultHintLimit),
                    "cooldown": cooldown_strategy,
                    "strictlevel": strict_level,
                    "guidancestyle": request.guidanceStyle,
                    "misconceptions": request.anticipatedMisconceptions,
                    "category": request.category,
                }
            ).fetchone()
            conn.commit()
        except IntegrityError as exc:
            conn.rollback()
            if "exercisestype_name_key" in str(exc):
                raise HTTPException(status_code=409, detail="Mode name already exists. Choose a different name.")
            raise HTTPException(status_code=400, detail=f"Mode creation failed due to database constraints: {str(exc.orig)}")

    return {
        "message": "Custom mode created successfully",
        "typeId": str(new_type[0])
    }


@router.delete("/types/{type_id}")
def delete_custom_mode(
    type_id: str,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        mode = conn.execute(
            text("""
                SELECT typeid, issystempresent
                FROM exercisestype
                WHERE typeid = :type_id
            """),
            {"type_id": type_id}
        ).fetchone()

        if not mode:
            raise HTTPException(status_code=404, detail="Mode not found")

        if mode[1]:
            raise HTTPException(status_code=403, detail="Cannot delete system modes")

        conn.execute(
            text("DELETE FROM exercisestype WHERE typeid = :type_id"),
            {"type_id": type_id}
        )
        conn.commit()

    return {"message": "Mode deleted successfully", "typeId": type_id}


@router.post("/")
def create_exercise(
    request: ExerciseCreate,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        course = conn.execute(
            text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
            {"course_id": request.courseId}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if str(course[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="You do not own this course")

        exercise_type = conn.execute(
            text("SELECT typeid FROM exercisestype WHERE typeid = :type_id"),
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

        for tc in request.testCases:
            conn.execute(
                text("""
                    INSERT INTO testcases (testcaseid, exerciseid, input, expectedoutput, weight, isvisible)
                    VALUES (:testcaseid, :exerciseid, :input, :expectedoutput, :weight, :isvisible)
                """),
                {
                    "testcaseid":     str(uuid.uuid4()),
                    "exerciseid":     str(new_exercise[0]),
                    "input":          tc.input or "",
                    "expectedoutput": tc.expectedOutput,
                    "weight":         1.0,
                    "isvisible":      tc.isVisible,
                }
            )
        conn.commit()

    return {
        "message": "Exercise created successfully",
        "exerciseId": str(new_exercise[0])
    }


@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"]))
):
    with engine.connect() as conn:
        exercise = conn.execute(
            text("""
                SELECT e.exerciseid, e.courseid, c.instructorid
                FROM exercise e
                JOIN courses c ON e.courseid = c.courseid
                WHERE e.exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id}
        ).fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        if current_user["role"] == "instructor" and str(exercise[2]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed to delete this exercise")

        conn.execute(
            text("DELETE FROM exercise WHERE exerciseid = :exercise_id"),
            {"exercise_id": exercise_id}
        )
        conn.commit()

    return {
        "message": "Exercise deleted successfully",
        "exerciseId": exercise_id,
        "courseId": str(exercise[1]),
    }


# ── MUST BE LAST — catches any /{exercise_id} ─────────────────────────────

@router.get("/{exercise_id}")
def get_exercise(
    exercise_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        purge_expired_exercises(conn)
        conn.commit()

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
                    SELECT 1 FROM enrollments
                    WHERE student_id = :userid AND course_id = :course_id
                """),
                {"userid": current_user["userid"], "course_id": course_id}
            ).fetchone()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
                {"course_id": course_id}
            ).fetchone()
            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

        test_cases = conn.execute(
            text("""
                SELECT testcaseid, input, expectedoutput, isvisible
                FROM testcases
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id}
        ).fetchall()

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
        "testCases": [
            {
                "testCaseId":     str(tc[0]),
                "input":          tc[1],
                "expectedOutput": tc[2],
                "isVisible":      tc[3],
            }
            for tc in test_cases
        ],
    }