import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

import app.api.v1.router_exercises as router_exercises

#replace router_exercises.engine with MockEngine so that database interactions can be controlled and tested without relying on a real database. This allows us to simulate various scenarios and verify that the router_exercises functions behave correctly in each case.
class MockResult:
    def __init__(self, fetchone_value=None, fetchall_value=None):
        self._fetchone_value = fetchone_value
        self._fetchall_value = fetchall_value or []

    def fetchone(self):
        return self._fetchone_value

    def fetchall(self):
        return self._fetchall_value


class FakeOrigExc(Exception):
    pass


class MockConnection:
    def __init__(self, responses=None):
        self.responses = responses or []
        self.executed = []
        self.commit_called = False
        self.rollback_called = False
        self._index = 0

    def execute(self, query, params=None):
        self.executed.append((str(query), params))

        if self._index < len(self.responses):
            item = self.responses[self._index]
            self._index += 1
            if isinstance(item, Exception):
                raise item
            return item

        return MockResult()

    def commit(self):
        self.commit_called = True

    def rollback(self):
        self.rollback_called = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        pass


class MockEngine:
    def __init__(self, conn):
        self.conn = conn

    def connect(self):
        return self.conn

#role fixtures for auth
@pytest.fixture
def student_user():
    return {"userid": "stud-1", "role": "student"}


@pytest.fixture
def instructor_user():
    return {"userid": "inst-1", "role": "instructor"}


@pytest.fixture
def admin_user():
    return {"userid": "admin-1", "role": "admin"}

#delete expired exercise 
def test_purge_expired_exercises_executes_delete():
    conn = MockConnection()
    router_exercises.purge_expired_exercises(conn)

    assert len(conn.executed) == 1
    assert "DELETE FROM exercise" in conn.executed[0][0]


#enrolled stud can see exercises
def test_get_exercises_by_course_student_success(monkeypatch, student_user):
    rows = [
        ("ex-1", "course-1", "Loops", "Easy", "coding", "loop", "vars", "Solve it", "ref", True, "2026-04-01", "2026-05-01", None, "type-1", "inst-1")
    ]
    conn = MockConnection(
        responses=[
            MockResult(),  # purge
            MockResult(fetchone_value=(1,)),  # enrollment
            MockResult(fetchall_value=rows),  # exercises
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.get_exercises_by_course("course-1", student_user)

    assert result["count"] == 1
    assert result["exercises"][0]["exerciseId"] == "ex-1"

#non-enrolled accesing exercises should be forbidden
def test_get_exercises_by_course_student_not_enrolled(monkeypatch, student_user):
    conn = MockConnection(
        responses=[
            MockResult(),  # purge
            MockResult(fetchone_value=None),  # enrollment
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.get_exercises_by_course("course-1", student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not enrolled in this course"

#course owner instructor can SEe exercises.
def test_get_exercises_by_course_instructor_success(monkeypatch, instructor_user):
    rows = [
        ("ex-1", "course-1", "Loops", "Easy", "coding", "loop", "vars", "Solve it", "ref", True, "2026-04-01", "2026-05-01", None, "type-1", "inst-1")
    ]
    conn = MockConnection(
        responses=[
            MockResult(),  # purge
            MockResult(fetchone_value=("inst-1",)),  # course owner
            MockResult(fetchall_value=rows),  # exercises
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.get_exercises_by_course("course-1", instructor_user)

    assert result["count"] == 1
    assert result["exercises"][0]["title"] == "Loops"

#returns available modes 
def test_get_exercise_types_success(monkeypatch, instructor_user):
    rows = [
        ("type-1", "Mode A", "desc", 3, 1, 1, "style", "misc", True, "course-1")
    ]
    conn = MockConnection(responses=[MockResult(fetchall_value=rows)])
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.get_exercise_types("course-1", instructor_user)

    assert len(result["types"]) == 1
    assert result["types"][0]["typeId"] == "type-1"
    assert result["types"][0]["name"] == "Mode A"

#create customized mode
def test_create_custom_mode_success(monkeypatch, instructor_user):
    request = router_exercises.CustomModeCreate(
        name=" Debug Mode ",
        description=" test ",
        defaultHintLimit=4,
        defaultCooldownStrategy=25,
        strictLevel=5,
        guidanceStyle="guide",
        anticipatedMisconceptions="logic",
        category="course-1",
    )
    conn = MockConnection(
        responses=[
            MockResult(),  # alter 1
            MockResult(),  # alter 2
            MockResult(),  # alter 3
            MockResult(fetchone_value=("type-99",)),  # insert
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.create_custom_mode(request, instructor_user)

    assert result["message"] == "Custom mode created successfully"
    assert result["typeId"] == "type-99"
    assert conn.commit_called is True

#no duplicates of customized mode names allowed
def test_create_custom_mode_duplicate_name(monkeypatch, instructor_user):
    request = router_exercises.CustomModeCreate(name="Mode A")

    orig = FakeOrigExc("duplicate key")
    exc = IntegrityError("INSERT failed", params=None, orig=orig)
    exc.args = ("exercisestype_name_key",)

    conn = MockConnection(
        responses=[
            MockResult(),  # alter 1
            MockResult(),  # alter 2
            MockResult(),  # alter 3
            exc,           # insert fails
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as raised:
        router_exercises.create_custom_mode(request, instructor_user)

    assert raised.value.status_code == 409
    assert "Mode name already exists" in raised.value.detail
    assert conn.rollback_called is True


#test deleting system modes
def test_delete_custom_mode_system_mode_forbidden(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("type-1", True)),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.delete_custom_mode("type-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Cannot delete system modes"

#delete customized mode 
def test_delete_custom_mode_success(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("type-1", False)),
            MockResult(),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.delete_custom_mode("type-1", instructor_user)

    assert result["message"] == "Mode deleted successfully"
    assert result["typeId"] == "type-1"

#create exercise for course that instructor doesn't own should be forbidden
def test_create_exercise_not_owner(monkeypatch, instructor_user):
    request = router_exercises.ExerciseCreate(
        courseId="course-1",
        typeId="type-1",
        title="Ex 1",
        difficultyLevel="Easy",
        exerciseType="coding",
        problem="Do it",
        dueDate="2026-05-01",
        testCases=[],
    )
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("other-inst",)),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.create_exercise(request, instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "You do not own this course"

#create exercise successfully with test cases
def test_create_exercise_success_with_testcases(monkeypatch, instructor_user):
    request = router_exercises.ExerciseCreate(
        courseId="course-1",
        typeId="type-1",
        title="Ex 1",
        difficultyLevel="Easy",
        exerciseType="coding",
        keyConcept="loops",
        prerequisites="variables",
        problem="Do it",
        referenceSolution="print('ok')",
        dueDate="2026-05-01",
        testCases=[
            router_exercises.TestCaseCreate(input="1", expectedOutput="2"),
            router_exercises.TestCaseCreate(input="2", expectedOutput="3"),
        ],
    )
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("inst-1",)),   # course owner
            MockResult(fetchone_value=("type-1",)),   # type exists
            MockResult(fetchone_value=("ex-55",)),    # insert exercise
            MockResult(),                             # testcase 1
            MockResult(),                             # testcase 2
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.create_exercise(request, instructor_user)

    assert result["message"] == "Exercise created successfully"
    assert result["exerciseId"] == "ex-55"
    assert conn.commit_called is True

#instructor trying to delete exercise from course they don't own should
def test_delete_exercise_instructor_forbidden(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("ex-1", "course-1", "other-inst")),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.delete_exercise("ex-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to delete this exercise"

#admin can delete any exercise
def test_delete_exercise_admin_success(monkeypatch, admin_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("ex-1", "course-1", "inst-1")),
            MockResult(),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.delete_exercise("ex-1", admin_user)

    assert result["message"] == "Exercise deleted successfully"
    assert result["exerciseId"] == "ex-1"
    assert result["courseId"] == "course-1"

#enrolled student can access exercise details
def test_get_exercise_student_success(monkeypatch, student_user):
    exercise = ("ex-1", "course-1", "Loops", "Easy", "coding", "loop", "vars", "Solve", "ref", True, "2026-04-01", "2026-05-01", None, "type-1", "inst-1")
    conn = MockConnection(
        responses=[
            MockResult(),                     # purge
            MockResult(fetchone_value=exercise),
            MockResult(fetchone_value=(1,)),  # enrollment
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.get_exercise("ex-1", student_user)

    assert result["exerciseId"] == "ex-1"
    assert result["courseId"] == "course-1"

#course owner instructor can access exercise details
def test_get_exercise_instructor_success(monkeypatch, instructor_user):
    exercise = ("ex-1", "course-1", "Loops", "Easy", "coding", "loop", "vars", "Solve", "ref", True, "2026-04-01", "2026-05-01", None, "type-1", "inst-1")
    conn = MockConnection(
        responses=[
            MockResult(),                          # purge
            MockResult(fetchone_value=exercise),
            MockResult(fetchone_value=("inst-1",)) # course owner
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    result = router_exercises.get_exercise("ex-1", instructor_user)

    assert result["exerciseId"] == "ex-1"
    assert result["userId"] == "inst-1"

#non-owner instructor should not access exercise details
def test_get_exercise_instructor_forbidden(monkeypatch, instructor_user):
    exercise = ("ex-1", "course-1", "Loops", "Easy", "coding", "loop", "vars", "Solve", "ref", True, "2026-04-01", "2026-05-01", None, "type-1", "inst-1")
    conn = MockConnection(
        responses=[
            MockResult(),                              # purge
            MockResult(fetchone_value=exercise),
            MockResult(fetchone_value=("other-inst",)) # course owner
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.get_exercise("ex-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to access this exercise"

#exercise not found should return 404
def test_get_exercise_not_found(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(),  # purge
            MockResult(fetchone_value=None),
        ]
    )
    monkeypatch.setattr(router_exercises, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_exercises.get_exercise("missing-ex", instructor_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Exercise not found"