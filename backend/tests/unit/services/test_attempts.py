import pytest
from fastapi import HTTPException

# Change this import if your path/file name is different
import app.api.attempts as router_attempts


class MockResult:
    def __init__(self, fetchone_value=None, fetchall_value=None):
        self._fetchone_value = fetchone_value
        self._fetchall_value = fetchall_value or []

    def fetchone(self):
        return self._fetchone_value

    def fetchall(self):
        return self._fetchall_value


class MockConnection:
    def __init__(self, responses=None):
        self.responses = responses or []
        self.executed = []
        self.commit_called = False
        self.index = 0

    def execute(self, query, params=None):
        self.executed.append((str(query), params))
        if self.index < len(self.responses):
            result = self.responses[self.index]
            self.index += 1
            return result
        return MockResult()

    def commit(self):
        self.commit_called = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        pass


class MockEngine:
    def __init__(self, conn):
        self.conn = conn

    def connect(self):
        return self.conn


@pytest.fixture
def student_user():
    return {"userid": "stud-1", "role": "student"}


@pytest.fixture
def instructor_user():
    return {"userid": "inst-1", "role": "instructor"}


# UT-AT01
def test_get_my_attempts_success(monkeypatch, student_user):
    rows = [
        ("att-1", "stud-1", "ex-1", "rep-1", 2, "Completed", 85, 1, "print(1)", 3),
        ("att-2", "stud-1", "ex-2", "rep-1", 1, "InProgress", 0, 0, "print(2)", 0),
    ]
    conn = MockConnection([
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.get_my_attempts(student_user)

    assert result["count"] == 2
    assert result["attempts"][0]["attemptId"] == "att-1"
    assert result["attempts"][1]["attemptId"] == "att-2"


# UT-AT02
def test_get_attempt_not_found(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.get_attempt("missing-attempt", student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Attempt not found"


# UT-AT03
def test_get_attempt_student_own_attempt(monkeypatch, student_user):
    attempt = ("att-1", "stud-1", "ex-1", "rep-1", 1, "Completed", 90, 0, "code", 5)
    conn = MockConnection([
        MockResult(fetchone_value=attempt)
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.get_attempt("att-1", student_user)

    assert result["attemptId"] == "att-1"
    assert result["userId"] == "stud-1"
    assert result["exerciseId"] == "ex-1"


# UT-AT04
def test_get_attempt_instructor_own_course(monkeypatch, instructor_user):
    attempt = ("att-1", "stud-1", "ex-1", "rep-1", 1, "Completed", 90, 0, "code", 5)
    exercise = ("course-1", "inst-1")

    conn = MockConnection([
        MockResult(fetchone_value=attempt),   # get attempt
        MockResult(fetchone_value=exercise),  # verify instructor owns course
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.get_attempt("att-1", instructor_user)

    assert result["attemptId"] == "att-1"
    assert result["userId"] == "stud-1"


# UT-AT05
def test_get_attempt_instructor_not_allowed(monkeypatch, instructor_user):
    attempt = ("att-1", "stud-1", "ex-1", "rep-1", 1, "Completed", 90, 0, "code", 5)
    exercise = ("course-1", "other-inst")

    conn = MockConnection([
        MockResult(fetchone_value=attempt),   # get attempt
        MockResult(fetchone_value=exercise),  # instructor is not owner
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.get_attempt("att-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed"


# UT-AT06
def test_create_attempt_exercise_not_found(monkeypatch, student_user):
    request = router_attempts.AttemptCreate(
        exerciseId="missing-ex",
        submittedCode="print(1)"
    )

    conn = MockConnection([
        MockResult(fetchone_value=None)  # exercise not found
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.create_attempt(request, student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Exercise not found"


# UT-AT07
def test_create_attempt_student_not_enrolled(monkeypatch, student_user):
    request = router_attempts.AttemptCreate(
        exerciseId="ex-1",
        submittedCode="print(1)"
    )

    exercise = ("ex-1", "course-1")

    conn = MockConnection([
        MockResult(fetchone_value=exercise),  # exercise exists
        MockResult(fetchone_value=None),      # no enrollment
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.create_attempt(request, student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "You are not enrolled in this course"


# UT-AT08
def test_create_attempt_existing_report(monkeypatch, student_user):
    request = router_attempts.AttemptCreate(
        exerciseId="ex-1",
        submittedCode="print(1)"
    )

    exercise = ("ex-1", "course-1")
    enrollment = (1,)
    report = ("rep-1",)
    last_attempt = (2,)
    new_attempt = ("att-3",)

    conn = MockConnection([
        MockResult(fetchone_value=exercise),     # exercise exists
        MockResult(fetchone_value=enrollment),   # enrolled
        MockResult(fetchone_value=report),       # existing report
        MockResult(fetchone_value=last_attempt), # max attempt number
        MockResult(fetchone_value=new_attempt),  # insert attempt
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.create_attempt(request, student_user)

    assert result["message"] == "Attempt created successfully"
    assert result["attemptId"] == "att-3"
    assert result["attemptNumber"] == 3
    assert result["reportId"] == "rep-1"
    assert conn.commit_called is True


# UT-AT09
def test_create_attempt_no_report_creates_report(monkeypatch, student_user):
    request = router_attempts.AttemptCreate(
        exerciseId="ex-1",
        submittedCode="print(1)"
    )

    exercise = ("ex-1", "course-1")
    enrollment = (1,)
    report_not_found = None
    created_report = ("rep-new",)
    last_attempt = (0,)
    new_attempt = ("att-1",)

    conn = MockConnection([
        MockResult(fetchone_value=exercise),       # exercise exists
        MockResult(fetchone_value=enrollment),     # enrolled
        MockResult(fetchone_value=report_not_found), # no report
        MockResult(fetchone_value=created_report), # create report
        MockResult(fetchone_value=last_attempt),   # max attempt number
        MockResult(fetchone_value=new_attempt),    # create attempt
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.create_attempt(request, student_user)

    assert result["message"] == "Attempt created successfully"
    assert result["attemptId"] == "att-1"
    assert result["attemptNumber"] == 1
    assert result["reportId"] == "rep-new"
    assert conn.commit_called is True


# UT-AT10
def test_add_execution_summary_attempt_not_found(monkeypatch, student_user):
    request = router_attempts.ExecutionSummaryCreate(
        runtimeMs=100,
        memoryKb=256,
        stdout="ok",
        stderr="",
        passedCount=3,
        failedCount=0,
    )

    conn = MockConnection([
        MockResult(fetchone_value=None)  # attempt not found
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.add_execution_summary("missing-att", request, student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Attempt not found"


# UT-AT11A - student authorized
def test_add_execution_summary_student_success(monkeypatch, student_user):
    request = router_attempts.ExecutionSummaryCreate(
        runtimeMs=100,
        memoryKb=256,
        stdout="ok",
        stderr="",
        passedCount=3,
        failedCount=0,
    )

    attempt = ("att-1", "stud-1", "ex-1")
    existing_summary = None
    new_summary = ("sum-1",)

    conn = MockConnection([
        MockResult(fetchone_value=attempt),               # attempt exists
        MockResult(fetchone_value=existing_summary),      # no existing summary
        MockResult(fetchone_value=new_summary),           # insert summary
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.add_execution_summary("att-1", request, student_user)

    assert result["message"] == "Execution summary added successfully"
    assert result["summaryId"] == "sum-1"
    assert conn.commit_called is True


# UT-AT11B - instructor authorized
def test_add_execution_summary_instructor_success(monkeypatch, instructor_user):
    request = router_attempts.ExecutionSummaryCreate(
        runtimeMs=120,
        memoryKb=300,
        stdout="ok",
        stderr="",
        passedCount=4,
        failedCount=1,
    )

    attempt = ("att-1", "stud-1", "ex-1")
    course_owner = ("inst-1",)
    existing_summary = None
    new_summary = ("sum-2",)

    conn = MockConnection([
        MockResult(fetchone_value=attempt),          # attempt exists
        MockResult(fetchone_value=course_owner),     # instructor owns course
        MockResult(fetchone_value=existing_summary), # no summary yet
        MockResult(fetchone_value=new_summary),      # insert summary
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    result = router_attempts.add_execution_summary("att-1", request, instructor_user)

    assert result["message"] == "Execution summary added successfully"
    assert result["summaryId"] == "sum-2"
    assert conn.commit_called is True


# UT-AT12
def test_add_execution_summary_duplicate(monkeypatch, student_user):
    request = router_attempts.ExecutionSummaryCreate(
        runtimeMs=100,
        memoryKb=256,
        stdout="ok",
        stderr="",
        passedCount=3,
        failedCount=0,
    )

    attempt = ("att-1", "stud-1", "ex-1")
    existing_summary = ("sum-existing",)

    conn = MockConnection([
        MockResult(fetchone_value=attempt),          # attempt exists
        MockResult(fetchone_value=existing_summary), # summary already exists
    ])
    monkeypatch.setattr(router_attempts, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_attempts.add_execution_summary("att-1", request, student_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Execution summary already exists for this attempt"