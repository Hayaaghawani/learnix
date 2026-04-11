import pytest
from fastapi import HTTPException

import app.api.v1.router_courses as router_courses


# Mock DB helpers,  fake fetchall results.
class MockResult:
    def __init__(self, fetchone_value=None, fetchall_value=None):
        self._fetchone_value = fetchone_value
        self._fetchall_value = fetchall_value or []

    def fetchone(self):
        return self._fetchone_value

    def fetchall(self):
        return self._fetchall_value

# Records executed SQL calls and supports commit tracking.
class MockConnection:
    def __init__(self, responses=None):
        self.responses = responses or []
        self.executed = []
        self.commit_called = False
        self._index = 0

    def execute(self, query, params=None):
        self.executed.append((str(query), params))

        if self._index < len(self.responses):
            result = self.responses[self._index]
            self._index += 1
            return result

        return MockResult()

    def commit(self):
        self.commit_called = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb): #returns the mocked connection.
        pass


class MockEngine:
    def __init__(self, connection):
        self.connection = connection

    def connect(self):
        return self.connection


# Fixtures, provide reusable test data.
@pytest.fixture
def instructor_user():
    return {"userid": "inst-1", "role": "instructor"}


@pytest.fixture
def student_user():
    return {"userid": "stud-1", "role": "student"}


@pytest.fixture
def admin_user():
    return {"userid": "admin-1", "role": "admin"}


# Test delete expired courses
def test_purge_expired_courses_executes_delete():
    conn = MockConnection()

    router_courses.purge_expired_courses(conn)

    assert len(conn.executed) == 1
    assert "DELETE FROM courses" in conn.executed[0][0]


# Test get instructor course success
def test_get_my_courses_for_instructor(monkeypatch, instructor_user):
    course_rows = [
        ("course-1", "Python", "desc", "Python", "2026-04-01", "2026-07-01", "inst-1")
    ]
    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchall_value=course_rows),  # instructor query
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_my_courses(instructor_user)

    assert result["count"] == 1
    assert result["courses"][0]["courseId"] == "course-1"
    assert result["courses"][0]["courseName"] == "Python"
    assert conn.commit_called is True

#get student courses success
def test_get_my_courses_for_student(monkeypatch, student_user):
    course_rows = [
        ("course-2", "Java", "desc", "Java", "2026-04-01", "2026-07-01", "inst-9")
    ]
    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchall_value=course_rows),  # student query
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_my_courses(student_user)

    assert result["count"] == 1
    assert result["courses"][0]["courseId"] == "course-2"
    assert result["courses"][0]["courseName"] == "Java"

#reject getting courses for authenticated user
def test_get_my_courses_unsupported_role(monkeypatch):
    current_user = {"userid": "x1", "role": "guest"}
    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_my_courses(current_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Unsupported role"


# students access to courses
def test_get_course_student_success(monkeypatch, student_user):
    course = ("course-1", "Python", "desc", "Python", "2026-04-01", "2026-07-01", "inst-1")
    enrollment = (1,)

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=course),  # course lookup
            MockResult(fetchone_value=enrollment),  # enrollment check
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_course("course-1", student_user)

    assert result["courseId"] == "course-1"
    assert result["courseName"] == "Python"

#UNROLLED STUDENTS GET 403 EHEN TRYING TO ACCESS COURSE DETAILS 
def test_get_course_student_not_enrolled(monkeypatch, student_user):
    course = ("course-1", "Python", "desc", "Python", "2026-04-01", "2026-07-01", "inst-1")

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=course),  # course lookup
            MockResult(fetchone_value=None),  # enrollment check
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_course("course-1", student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to access this course"

#COURSE INSTRUCTOR CAN ACCESS COURSE DETAILS SUCCESS
def test_get_course_instructor_success(monkeypatch, instructor_user):
    course = ("course-1", "Python", "desc", "Python", "2026-04-01", "2026-07-01", "inst-1")

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=course),  # course lookup
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_course("course-1", instructor_user)

    assert result["courseId"] == "course-1"
    assert result["instructorId"] == "inst-1"

#NON OWNER INSTRUCTOR GETS 403 WHEN TRYING TO ACCESS COURSE
def test_get_course_instructor_wrong_owner(monkeypatch, instructor_user):
    course = ("course-1", "Python", "desc", "Python", "2026-04-01", "2026-07-01", "other-inst")

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=course),  # course lookup
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_course("course-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to access this course"

#INVALID COURSE ID GETS 404
def test_get_course_not_found(monkeypatch, student_user):
    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=None),  # course lookup
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_course("missing-course", student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Course not found"


# Test creatION OF course
def test_create_course_success(monkeypatch, instructor_user):
    request = router_courses.CourseCreate(
        courseName="New Course",
        description="desc",
        languageUsed="Python",
        startDate="2026-04-01",
        endDate="2026-07-01",
    )

    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("new-course-id",)),
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.create_course(request, instructor_user)

    assert result["message"] == "Course created successfully"
    assert result["courseId"] == "new-course-id"
    assert conn.commit_called is True


# Test : invalid code format
def test_join_course_invalid_join_code_length(student_user):
    request = router_courses.JoinCourseRequest(joinKey="shortcode")

    with pytest.raises(HTTPException) as exc:
        router_courses.join_course(request, student_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid join code"

#: code not found in DB gets 400.
def test_join_course_invalid_join_code_db_mismatch(monkeypatch, student_user):
    course_id = "12345678-1234-1234-1234-123456789012"
    request = router_courses.JoinCourseRequest(joinKey="teacher" + course_id)

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=None),  # course lookup by join code
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.join_course(request, student_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid join code"

#ALREADY ENROLLED STUDENTS GET MESSAGE SAYING THEY ARE ALREADY ENROLLED IN COURSE
def test_join_course_already_enrolled(monkeypatch, student_user):
    course_id = "12345678-1234-1234-1234-123456789012"
    request = router_courses.JoinCourseRequest(joinKey="teacher" + course_id)

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=(course_id, "Python")),  # course lookup
            MockResult(fetchone_value=(1,)),  # existing enrollment
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.join_course(request, student_user)

    assert result["message"] == "You are already enrolled in this course."
    assert result["courseId"] == course_id

# successful enrollment of student in course
def test_join_course_success(monkeypatch, student_user):
    course_id = "12345678-1234-1234-1234-123456789012"
    request = router_courses.JoinCourseRequest(joinKey="teacher" + course_id)

    conn = MockConnection(
        responses=[
            MockResult(),  # purge_expired_courses
            MockResult(fetchone_value=(course_id, "Python")),  # course lookup
            MockResult(fetchone_value=None),  # existing enrollment check
            MockResult(),  # insert enrollment
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.join_course(request, student_user)

    assert result["message"] == "You have been enrolled in the course."
    assert result["courseId"] == course_id
    assert conn.commit_called is True


# Test COURSE DELETION BY ADMIN 
def test_delete_course_admin_success(monkeypatch, admin_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("inst-1",)),  # course exists
            MockResult(),  # delete
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.delete_course("course-1", admin_user)

    assert result["message"] == "Course deleted successfully"
    assert result["courseId"] == "course-1"

# Test COURSE DELETION BY INSTRUCTOR OWNER 
def test_delete_course_instructor_owner_success(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("inst-1",)),  # course exists
            MockResult(),  # delete
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.delete_course("course-1", instructor_user)

    assert result["message"] == "Course deleted successfully"
    assert result["courseId"] == "course-1"

#missing course gets 404.DELETED
def test_delete_course_not_found(monkeypatch, admin_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=None),  # course exists check
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.delete_course("missing-course", admin_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Course not found"

#: non-owner instructor gets 403 when trying to delete course
def test_delete_course_instructor_not_owner(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=("other-inst",)),  # course exists
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.delete_course("course-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to delete this course"


# Test get_course_students
def test_get_course_students_instructor_success(monkeypatch, instructor_user):
    course = ("course-1", "inst-1", "Python", "teacher")
    students = [
        ("stud-1", "Tala", "Mohammed", "tala@example.com"),
        ("stud-2", "Ali", "Ahmad", "ali@example.com"),
    ]

    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=course),  # course lookup
            MockResult(fetchall_value=students),  # students list
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_course_students("course-1", instructor_user)

    assert result["courseId"] == "course-1"
    assert result["courseName"] == "Python"
    assert result["count"] == 2
    assert result["enrollmentCode"] == "teachercourse-1"
    assert result["students"][0]["studentId"] == "stud-1"

#admin gets students list.
def test_get_course_students_admin_success(monkeypatch, admin_user):
    course = ("course-1", "inst-1", "Python", "teacher")
    students = [
        ("stud-1", "Tala", "Mohammed", "tala@example.com"),
    ]

    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=course),  # course lookup
            MockResult(fetchall_value=students),  # students list
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    result = router_courses.get_course_students("course-1", admin_user)

    assert result["courseId"] == "course-1"
    assert result["count"] == 1
    assert result["students"][0]["email"] == "tala@example.com"

#non-owner instructor gets 403 when trying to access students list
def test_get_course_students_instructor_wrong_owner(monkeypatch, instructor_user):
    course = ("course-1", "other-inst", "Python", "teacher")

    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=course),  # course lookup
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_course_students("course-1", instructor_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to access this course"

# missing course gets 404.
def test_get_course_students_not_found(monkeypatch, instructor_user):
    conn = MockConnection(
        responses=[
            MockResult(fetchone_value=None),  # course lookup
        ]
    )
    monkeypatch.setattr(router_courses, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_courses.get_course_students("missing-course", instructor_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Course not found"