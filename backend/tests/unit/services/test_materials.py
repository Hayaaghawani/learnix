import pytest
from fastapi import HTTPException

import app.api.v1.router_materials as router_materials


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
        self.index = 0
        self.commit_called = False

    def execute(self, query, params=None):
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
def instructor_user():
    return {"userid": "inst-1", "role": "instructor"}


@pytest.fixture
def student_user():
    return {"userid": "stud-1", "role": "student"}

#test upload material to an unvalid course
def test_upload_material_course_not_found(monkeypatch, instructor_user):
    request = router_materials.MaterialCreate(
        courseId="course-1",
        title="Week 1",
        filetype="pdf",
        filename="intro.pdf",
        content="abc"
    )

    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.upload_material(request, instructor_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Course not found"

#test upload material to a course that the instructor does not own
def test_upload_material_not_owner(monkeypatch, instructor_user):
    request = router_materials.MaterialCreate(
        courseId="course-1",
        title="Week 1",
        filetype="pdf",
        filename="intro.pdf",
        content="abc"
    )

    conn = MockConnection([
        MockResult(fetchone_value=("other-inst",))
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.upload_material(request, instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "You do not own this course"

#test successful upload of material
def test_upload_material_success(monkeypatch, instructor_user):
    request = router_materials.MaterialCreate(
        courseId="course-1",
        title="Week 1",
        filetype="pdf",
        filename="intro.pdf",
        content="abc"
    )

    conn = MockConnection([
        MockResult(fetchone_value=("inst-1",)),
        MockResult()
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    result = router_materials.upload_material(request, instructor_user)

    assert result["message"] == "Material uploaded successfully"
    assert conn.commit_called is True

#test get materials for a student who is enrolled in the course
def test_get_materials_student_success(monkeypatch, student_user):
    rows = [
        ("mat-1", "Week 1", "pdf", "intro.pdf", "abc", "2026-04-11")
    ]

    conn = MockConnection([
        MockResult(fetchone_value=(1,)),
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    result = router_materials.get_materials("course-1", student_user)

    assert result["count"] == 1
    assert result["materials"][0]["materialId"] == "mat-1"

#test get materials for a student who is not enrolled in the course
def test_get_materials_student_not_enrolled(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.get_materials("course-1", student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not enrolled in this course"

#test get materials for an instructor who owns the course
def test_get_materials_instructor_success(monkeypatch, instructor_user):
    rows = [
        ("mat-1", "Week 1", "pdf", "intro.pdf", "abc", "2026-04-11")
    ]

    conn = MockConnection([
        MockResult(fetchone_value=("inst-1",)),
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    result = router_materials.get_materials("course-1", instructor_user)

    assert result["count"] == 1
    assert result["materials"][0]["title"] == "Week 1"

#test get materials for an instructor who does not own the course
def test_get_materials_instructor_not_owner(monkeypatch, instructor_user):
    conn = MockConnection([
        MockResult(fetchone_value=("other-inst",))
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.get_materials("course-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not your course"

#test delete material that does not exist
def test_delete_material_not_found(monkeypatch, instructor_user):
    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.delete_material("mat-1", instructor_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Material not found"

#test delete material that the instructor does not own
def test_delete_material_not_allowed(monkeypatch, instructor_user):
    conn = MockConnection([
        MockResult(fetchone_value=("mat-1", "other-inst"))
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_materials.delete_material("mat-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed"

#test successful delete of material
def test_delete_material_success(monkeypatch, instructor_user):
    conn = MockConnection([
        MockResult(fetchone_value=("mat-1", "inst-1")),
        MockResult()
    ])
    monkeypatch.setattr(router_materials, "engine", MockEngine(conn))

    result = router_materials.delete_material("mat-1", instructor_user)

    assert result["message"] == "Material deleted successfully"
    assert conn.commit_called is True