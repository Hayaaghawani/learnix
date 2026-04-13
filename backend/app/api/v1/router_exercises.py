from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role
from app.database.ai_schema import ensure_ai_configuration_schema
from app.core.dependencies import get_rag_service, get_controller
import uuid

router = APIRouter(prefix="/exercises", tags=["Exercises"])

SHOW_SOLUTION_POLICIES = frozenset(
    {"after_submission", "never", "after_deadline", "partial_only"}
)


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


def seconds_until_cooldown(last_at, cooldown_seconds: int | None) -> int:
    if not cooldown_seconds or cooldown_seconds <= 0 or last_at is None:
        return 0
    if getattr(last_at, "tzinfo", None) is None:
        last_at = last_at.replace(tzinfo=timezone.utc)
    elapsed = (datetime.now(timezone.utc) - last_at).total_seconds()
    return max(0, int(cooldown_seconds - elapsed))


def cooldown_strategy_from_seconds(sec: int) -> int:
    sec = max(0, sec)
    if sec == 0:
        return 0
    if sec <= 30:
        return 1
    return 2


def _fetch_junction_map(conn, table: str, type_col: str, id_col: str, type_ids: list) -> dict[str, list[int]]:
    if not type_ids:
        return {}
    keys = ", ".join(f":t{i}" for i in range(len(type_ids)))
    params = {f"t{i}": type_ids[i] for i in range(len(type_ids))}
    q = text(f"""
        SELECT {type_col}, {id_col}
        FROM {table}
        WHERE {type_col} IN ({keys})
    """)
    rows = conn.execute(q, params).fetchall()
    out: dict[str, list[int]] = {tid: [] for tid in type_ids}
    for r in rows:
        tid = str(r[0])
        out.setdefault(tid, []).append(int(r[1]))
    return out


def _type_row_to_dict(row, concepts, forbidden, misconceptions, responses) -> dict:
    tid = str(row[0])
    return {
        "typeId": tid,
        "name": row[1],
        "description": row[2],
        "defaultHintLimit": row[3],
        "defaultCooldownStrategy": row[4],
        "strictLevel": row[5],
        "guidanceStyle": row[6],
        "anticipatedMisconceptions": row[7],
        "isSystemPresent": row[8],
        "category": str(row[9]) if row[9] is not None else None,
        "enableAdaptiveHints": bool(row[10]) if len(row) > 10 else False,
        "hintLimit": row[11] if len(row) > 11 else None,
        "cooldownSeconds": row[12] if len(row) > 12 else 0,
        "enableErrorExplanation": bool(row[13]) if len(row) > 13 else True,
        "enableRag": bool(row[14]) if len(row) > 14 else False,
        "showSolutionPolicy": row[15] if len(row) > 15 else "after_submission",
        "conceptIds": concepts.get(tid, []),
        "forbiddenTopicIds": forbidden.get(tid, []),
        "misconceptionIds": misconceptions.get(tid, []),
        "responseTypeIds": responses.get(tid, []),
    }


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
    conceptIds: list[int] = Field(default_factory=list)
    forbiddenTopicIds: list[int] = Field(default_factory=list)
    misconceptionIds: list[int] = Field(default_factory=list)
    responseTypeIds: list[int] = Field(default_factory=list)
    enableAdaptiveHints: bool = False
    hintLimit: int | None = None
    cooldownSeconds: int = 0
    enableErrorExplanation: bool = True
    enableRag: bool = False
    showSolutionPolicy: str = "after_submission"


class HintRequest(BaseModel):
    message: str | None = None


# ── MUST BE FIRST — specific paths before /{exercise_id} ──────────────────


@router.get("/ai-catalog")
def get_ai_catalog(current_user: dict = Depends(get_current_user)):
    """All predefined lookup rows for exercise-type configuration."""
    with engine.connect() as conn:
        ensure_ai_configuration_schema(conn)
        conn.commit()
        concepts = conn.execute(
            text("SELECT id, name FROM concept ORDER BY name")
        ).fetchall()
        forbidden = conn.execute(
            text("SELECT id, name FROM forbidden_topic ORDER BY name")
        ).fetchall()
        misc = conn.execute(
            text("SELECT id, name FROM misconception ORDER BY name")
        ).fetchall()
        rtypes = conn.execute(
            text("SELECT id, name FROM response_type ORDER BY name")
        ).fetchall()
    return {
        "concepts": [{"id": r[0], "name": r[1]} for r in concepts],
        "forbiddenTopics": [{"id": r[0], "name": r[1]} for r in forbidden],
        "misconceptions": [{"id": r[0], "name": r[1]} for r in misc],
        "responseTypes": [{"id": r[0], "name": r[1]} for r in rtypes],
        "showSolutionPolicies": sorted(SHOW_SOLUTION_POLICIES),
    }


@router.get("/course/{course_id}/concepts")
def get_course_concepts_for_types(
    course_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"])),
):
    with engine.connect() as conn:
        ensure_ai_configuration_schema(conn)
        conn.commit()
        if current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :cid"),
                {"cid": course_id},
            ).fetchone()
            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed to access this course")
        rows = conn.execute(
            text("""
                SELECT c.id, c.name
                FROM concept c
                JOIN course_concept cc ON cc.concept_id = c.id
                WHERE cc.course_id = :cid
                ORDER BY c.name
            """),
            {"cid": course_id},
        ).fetchall()
    return {"concepts": [{"id": r[0], "name": r[1]} for r in rows]}


@router.get("/course/{course_id}")
def get_exercises_by_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
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
                {"userid": current_user["userid"], "course_id": course_id},
            ).fetchone()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not enrolled in this course")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
                {"course_id": course_id},
            ).fetchone()
            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not your course")

        result = conn.execute(
            text("""
                SELECT exerciseid, courseid, title, difficultylevel, exercisetype,
                       prerequisites, problem, referencesolution,
                       isactive, createdat, duedate, updatedat, typeid, userid
                FROM exercise
                WHERE courseid = :course_id
                ORDER BY createdat DESC
            """),
            {"course_id": course_id},
        ).fetchall()

    exercises = []
    for row in result:
        exercises.append(
            {
                "exerciseId": str(row[0]),
                "courseId": str(row[1]),
                "title": row[2],
                "difficultyLevel": row[3],
                "exerciseType": row[4],
                "prerequisites": row[5],
                "problem": row[6],
                "referenceSolution": row[7],
                "isActive": row[8],
                "createdAt": row[9],
                "dueDate": row[10],
                "updatedAt": row[11],
                "typeId": str(row[12]),
                "userId": str(row[13]),
            }
        )

    return {"count": len(exercises), "exercises": exercises}


@router.get("/types/course/{course_id}")
def get_exercise_types(course_id: str, current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        ensure_exercisestype_schema_compat(conn)
        ensure_ai_configuration_schema(conn)
        conn.commit()

        result = conn.execute(
            text("""
                SELECT typeid, name, description, defaulthintlimit,
                       defaultcooldownstrategy, strictlevel, guidancestyle,
                       anticipatedmisconceptions, issystempresent, category,
                       enable_adaptive_hints, hint_limit, cooldown_seconds,
                       enable_error_explanation, enable_rag, show_solution_policy
                FROM exercisestype
                WHERE issystempresent = TRUE OR category = :course_id
                ORDER BY issystempresent DESC, name ASC
            """),
            {"course_id": course_id},
        ).fetchall()

        type_ids = [str(r[0]) for r in result]
        cmap = _fetch_junction_map(conn, "exercise_type_concept", "exercise_type_id", "concept_id", type_ids)
        fmap = _fetch_junction_map(
            conn, "exercise_type_forbidden", "exercise_type_id", "forbidden_topic_id", type_ids
        )
        mmap = _fetch_junction_map(
            conn, "exercise_type_misconception", "exercise_type_id", "misconception_id", type_ids
        )
        rmap = _fetch_junction_map(
            conn, "exercise_type_response", "exercise_type_id", "response_type_id", type_ids
        )

    return {
        "types": [_type_row_to_dict(row, cmap, fmap, mmap, rmap) for row in result],
    }


@router.post("/types/create")
def create_custom_mode(
    request: CustomModeCreate,
    current_user: dict = Depends(require_role(["instructor"])),
):
    if request.showSolutionPolicy not in SHOW_SOLUTION_POLICIES:
        raise HTTPException(
            status_code=400,
            detail=f"showSolutionPolicy must be one of: {', '.join(sorted(SHOW_SOLUTION_POLICIES))}",
        )

    if request.enableAdaptiveHints:
        if request.hintLimit is None or request.hintLimit < 1:
            raise HTTPException(
                status_code=400,
                detail="hintLimit is required and must be at least 1 when enableAdaptiveHints is true",
            )
    else:
        request.hintLimit = None

    cooldown_sec = max(0, int(request.cooldownSeconds))
    cooldown_strategy = cooldown_strategy_from_seconds(cooldown_sec)
    strict_level = min(2, max(0, request.strictLevel))
    legacy_hint = request.hintLimit if request.enableAdaptiveHints else max(0, request.defaultHintLimit)

    with engine.connect() as conn:
        ensure_exercisestype_schema_compat(conn)
        ensure_ai_configuration_schema(conn)
        conn.commit()

        course_id = request.category
        if not course_id:
            raise HTTPException(status_code=400, detail="category (course id) is required for custom modes")

        owns = conn.execute(
            text("SELECT 1 FROM courses WHERE courseid = :cid AND instructorid = :uid"),
            {"cid": course_id, "uid": current_user["userid"]},
        ).fetchone()
        if not owns:
            raise HTTPException(status_code=403, detail="You do not own this course")

        if request.conceptIds:
            uq = list(set(request.conceptIds))
            ck = ", ".join(f":c{i}" for i in range(len(uq)))
            cparams = {f"c{i}": uq[i] for i in range(len(uq))}
            ok = conn.execute(
                text(f"""
                    SELECT COUNT(*) FROM course_concept
                    WHERE course_id = :cid AND concept_id IN ({ck})
                """),
                {**cparams, "cid": course_id},
            ).fetchone()[0]
            if int(ok) != len(uq):
                raise HTTPException(
                    status_code=400,
                    detail="All conceptIds must be concepts assigned to this course",
                )

        def _validate_lookup(table: str, ids: list[int]) -> None:
            if not ids:
                return
            uq = list(set(ids))
            ik = ", ".join(f":i{j}" for j in range(len(uq)))
            ip = {f"i{j}": uq[j] for j in range(len(uq))}
            cnt = conn.execute(
                text(f"SELECT COUNT(*) FROM {table} WHERE id IN ({ik})"),
                ip,
            ).fetchone()[0]
            if int(cnt) != len(uq):
                raise HTTPException(status_code=400, detail=f"Invalid ids for {table}")

        _validate_lookup("forbidden_topic", request.forbiddenTopicIds)
        _validate_lookup("misconception", request.misconceptionIds)
        _validate_lookup("response_type", request.responseTypeIds)

        try:
            new_type = conn.execute(
                text("""
                    INSERT INTO exercisestype (
                        typeid, name, description, defaulthintlimit,
                        defaultcooldownstrategy, strictlevel, guidancestyle,
                        anticipatedmisconceptions, issystempresent, category,
                        enable_adaptive_hints, hint_limit, cooldown_seconds,
                        enable_error_explanation, enable_rag, show_solution_policy
                    )
                    VALUES (
                        uuid_generate_v4(), :name, :description, :hintlimit,
                        :cooldown, :strictlevel, :guidancestyle,
                        :misconceptions, FALSE, :category,
                        :eadaptive, :hlimit, :csec,
                        :eerr, :erag, :spol
                    )
                    RETURNING typeid
                """),
                {
                    "name": request.name.strip(),
                    "description": (request.description or "").strip(),
                    "hintlimit": max(0, legacy_hint),
                    "cooldown": cooldown_strategy,
                    "strictlevel": strict_level,
                    "guidancestyle": request.guidanceStyle,
                    "misconceptions": request.anticipatedMisconceptions,
                    "category": course_id,
                    "eadaptive": request.enableAdaptiveHints,
                    "hlimit": request.hintLimit,
                    "csec": cooldown_sec,
                    "eerr": request.enableErrorExplanation,
                    "erag": request.enableRag,
                    "spol": request.showSolutionPolicy,
                },
            ).fetchone()
            tid = str(new_type[0])

            for cid in set(request.conceptIds):
                conn.execute(
                    text("""
                        INSERT INTO exercise_type_concept (exercise_type_id, concept_id)
                        VALUES (:tid, :cid)
                    """),
                    {"tid": tid, "cid": cid},
                )
            for fid in set(request.forbiddenTopicIds):
                conn.execute(
                    text("""
                        INSERT INTO exercise_type_forbidden (exercise_type_id, forbidden_topic_id)
                        VALUES (:tid, :fid)
                    """),
                    {"tid": tid, "fid": fid},
                )
            for mid in set(request.misconceptionIds):
                conn.execute(
                    text("""
                        INSERT INTO exercise_type_misconception (exercise_type_id, misconception_id)
                        VALUES (:tid, :mid)
                    """),
                    {"tid": tid, "mid": mid},
                )
            for rid in set(request.responseTypeIds):
                conn.execute(
                    text("""
                        INSERT INTO exercise_type_response (exercise_type_id, response_type_id)
                        VALUES (:tid, :rid)
                    """),
                    {"tid": tid, "rid": rid},
                )

            conn.commit()
        except IntegrityError as exc:
            conn.rollback()
            if "exercisestype_name_key" in str(exc):
                raise HTTPException(
                    status_code=409,
                    detail="Mode name already exists. Choose a different name.",
                )
            raise HTTPException(
                status_code=400,
                detail=f"Mode creation failed due to database constraints: {str(exc.orig)}",
            )

    return {"message": "Custom mode created successfully", "typeId": tid}


@router.delete("/types/{type_id}")
def delete_custom_mode(
    type_id: str,
    current_user: dict = Depends(require_role(["instructor"])),
):
    with engine.connect() as conn:
        mode = conn.execute(
            text("""
                SELECT typeid, issystempresent
                FROM exercisestype
                WHERE typeid = :type_id
            """),
            {"type_id": type_id},
        ).fetchone()

        if not mode:
            raise HTTPException(status_code=404, detail="Mode not found")

        if mode[1]:
            raise HTTPException(status_code=403, detail="Cannot delete system modes")

        conn.execute(
            text("DELETE FROM exercisestype WHERE typeid = :type_id"),
            {"type_id": type_id},
        )
        conn.commit()

    return {"message": "Mode deleted successfully", "typeId": type_id}


@router.post("/")
def create_exercise(
    request: ExerciseCreate,
    current_user: dict = Depends(require_role(["instructor"])),
):
    with engine.connect() as conn:
        ensure_ai_configuration_schema(conn)
        conn.commit()

        course = conn.execute(
            text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
            {"course_id": request.courseId},
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if str(course[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="You do not own this course")

        exercise_type = conn.execute(
            text("SELECT typeid FROM exercisestype WHERE typeid = :type_id"),
            {"type_id": request.typeId},
        ).fetchone()

        if not exercise_type:
            raise HTTPException(status_code=404, detail="Exercise type not found")

        new_exercise = conn.execute(
            text("""
                INSERT INTO exercise (
                    exerciseid, courseid, userid, typeid,
                    title, difficultylevel, exercisetype,
                    prerequisites, problem,
                    referencesolution, duedate, isactive, createdat
                )
                VALUES (
                    :exerciseid, :courseid, :userid, :typeid,
                    :title, :difficultylevel, :exercisetype,
                    :prerequisites, :problem,
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
                "prerequisites": request.prerequisites,
                "problem": request.problem,
                "referencesolution": request.referenceSolution,
                "duedate": request.dueDate,
            },
        ).fetchone()

        for tc in request.testCases:
            conn.execute(
                text("""
                    INSERT INTO testcases (testcaseid, exerciseid, input, expectedoutput, weight, isvisible)
                    VALUES (:testcaseid, :exerciseid, :input, :expectedoutput, :weight, :isvisible)
                """),
                {
                    "testcaseid": str(uuid.uuid4()),
                    "exerciseid": str(new_exercise[0]),
                    "input": tc.input or "",
                    "expectedoutput": tc.expectedOutput,
                    "weight": 1.0,
                    "isvisible": tc.isVisible,
                },
            )
        conn.commit()

    return {
        "message": "Exercise created successfully",
        "exerciseId": str(new_exercise[0]),
    }


@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"])),
):
    with engine.connect() as conn:
        exercise = conn.execute(
            text("""
                SELECT e.exerciseid, e.courseid, c.instructorid
                FROM exercise e
                JOIN courses c ON e.courseid = c.courseid
                WHERE e.exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id},
        ).fetchone()

        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")

        if current_user["role"] == "instructor" and str(exercise[2]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed to delete this exercise")

        conn.execute(
            text("DELETE FROM exercise WHERE exerciseid = :exercise_id"),
            {"exercise_id": exercise_id},
        )
        conn.commit()

    return {
        "message": "Exercise deleted successfully",
        "exerciseId": exercise_id,
        "courseId": str(exercise[1]),
    }


@router.post("/{exercise_id}/hint")
def request_exercise_hint(
    exercise_id: str,
    request: HintRequest,
    current_user: dict = Depends(require_role(["student"])),
    rag=Depends(get_rag_service),
    controller=Depends(get_controller),
):
    with engine.connect() as conn:
        ensure_ai_configuration_schema(conn)
        conn.commit()

        row = conn.execute(
            text("""
                SELECT e.exerciseid, e.courseid, e.problem, e.typeid,
                       t.enable_adaptive_hints, t.hint_limit, t.cooldown_seconds
                FROM exercise e
                JOIN exercisestype t ON e.typeid = t.typeid
                WHERE e.exerciseid = :eid
            """),
            {"eid": exercise_id},
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Exercise not found")

        course_id = str(row[1])
        enr = conn.execute(
            text("""
                SELECT 1 FROM enrollments
                WHERE student_id = :uid AND course_id = :cid
            """),
            {"uid": current_user["userid"], "cid": course_id},
        ).fetchone()
        if not enr:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        if not row[4]:
            raise HTTPException(status_code=400, detail="Adaptive hints are not enabled for this exercise type")

        hint_limit = row[5]
        cooldown_sec = row[6] or 0

        st = conn.execute(
            text("""
                SELECT hints_used, last_ai_response_at
                FROM student_exercise_ai_state
                WHERE userid = :uid AND exerciseid = :eid
            """),
            {"uid": current_user["userid"], "eid": exercise_id},
        ).fetchone()
        hints_used = int(st[0]) if st else 0
        last_at = st[1] if st else None

        wait = seconds_until_cooldown(last_at, cooldown_sec)
        if wait > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait} seconds before the next AI response.",
            )

        if hint_limit is not None and hints_used >= hint_limit:
            raise HTTPException(status_code=429, detail="Hint limit reached for this exercise")

        problem = row[2] or ""
        extra = (request.message or "").strip()
        question = (
            "Give a short, pedagogical nudge or hint for the following programming exercise. "
            "Do not reveal the full solution or complete working code.\n\n"
            f"Exercise problem:\n{problem}\n"
        )
        if extra:
            question += f"\nStudent context: {extra}\n"

        concept = controller.detect_concept(question)
        response_text = rag.get_response(
            question=question,
            help_level="guided_hint",
            concept=concept,
            exercise_context=problem[:2000],
        )

        # hints_used applies only to this endpoint; /chat does not increment it (hint_limit vs cooldown).
        conn.execute(
            text("""
                INSERT INTO student_exercise_ai_state (userid, exerciseid, hints_used, last_ai_response_at)
                VALUES (:uid, :eid, 1, NOW())
                ON CONFLICT (userid, exerciseid) DO UPDATE SET
                    hints_used = student_exercise_ai_state.hints_used + 1,
                    last_ai_response_at = NOW()
            """),
            {"uid": current_user["userid"], "eid": exercise_id},
        )
        lat_row = conn.execute(
            text("""
                SELECT last_ai_response_at
                FROM student_exercise_ai_state
                WHERE userid = :uid AND exerciseid = :eid
            """),
            {"uid": current_user["userid"], "eid": exercise_id},
        ).fetchone()
        cd_rem = seconds_until_cooldown(lat_row[0] if lat_row else None, cooldown_sec)
        conn.commit()

        new_hints = hints_used + 1
        return {
            "hint": response_text,
            "hintsUsed": new_hints,
            "hintLimit": hint_limit,
            "cooldownSeconds": cooldown_sec,
            "secondsUntilNextAiResponse": cd_rem,
        }


# ── MUST BE LAST — catches any /{exercise_id} ─────────────────────────────


@router.get("/{exercise_id}")
def get_exercise(
    exercise_id: str,
    current_user: dict = Depends(get_current_user),
):
    with engine.connect() as conn:
        purge_expired_exercises(conn)
        conn.commit()
        ensure_ai_configuration_schema(conn)
        conn.commit()

        exercise = conn.execute(
            text("""
                SELECT exerciseid, courseid, title, difficultylevel, exercisetype,
                       prerequisites, problem, referencesolution,
                       isactive, createdat, duedate, updatedat, typeid, userid
                FROM exercise
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id},
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
                {"userid": current_user["userid"], "course_id": course_id},
            ).fetchone()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
                {"course_id": course_id},
            ).fetchone()
            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed to access this exercise")

        test_cases = conn.execute(
            text("""
                SELECT testcaseid, input, expectedoutput, isvisible
                FROM testcases
                WHERE exerciseid = :exercise_id
            """),
            {"exercise_id": exercise_id},
        ).fetchall()

        ai_assistant = None
        if current_user["role"] == "student":
            trow = conn.execute(
                text("""
                    SELECT enable_adaptive_hints, hint_limit, cooldown_seconds
                    FROM exercisestype
                    WHERE typeid = :tid
                """),
                {"tid": str(exercise[12])},
            ).fetchone()
            st = conn.execute(
                text("""
                    SELECT hints_used, last_ai_response_at
                    FROM student_exercise_ai_state
                    WHERE userid = :uid AND exerciseid = :eid
                """),
                {"uid": current_user["userid"], "eid": exercise_id},
            ).fetchone()
            hints_used = int(st[0]) if st else 0
            last_at = st[1] if st else None
            e_adapt = bool(trow[0]) if trow else False
            h_lim = trow[1] if trow else None
            c_sec = int(trow[2] or 0) if trow else 0
            cd_rem = seconds_until_cooldown(last_at, c_sec)
            at_hint_limit = h_lim is not None and hints_used >= h_lim
            hint_disabled = (not e_adapt) or at_hint_limit or cd_rem > 0
            ai_assistant = {
                "enableAdaptiveHints": e_adapt,
                "hintLimit": h_lim,
                "hintsUsed": hints_used,
                "cooldownSeconds": c_sec,
                "secondsUntilNextAiResponse": cd_rem,
                "getHintDisabled": hint_disabled,
            }

    payload = {
        "exerciseId": str(exercise[0]),
        "courseId": str(exercise[1]),
        "title": exercise[2],
        "difficultyLevel": exercise[3],
        "exerciseType": exercise[4],
        "prerequisites": exercise[5],
        "problem": exercise[6],
        "referenceSolution": exercise[7],
        "isActive": exercise[8],
        "createdAt": exercise[9],
        "dueDate": exercise[10],
        "updatedAt": exercise[11],
        "typeId": str(exercise[12]),
        "userId": str(exercise[13]),
        "testCases": [
            {
                "testCaseId": str(tc[0]),
                "input": tc[1],
                "expectedOutput": tc[2],
                "isVisible": tc[3],
            }
            for tc in test_cases
        ],
    }
    if ai_assistant is not None:
        payload["aiAssistant"] = ai_assistant
    return payload
