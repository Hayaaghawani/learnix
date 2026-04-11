import pytest
from fastapi import HTTPException

# Change this import if your file name/path is different
import app.api.v1.router_notifications as router_notifications


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
            item = self.responses[self.index]
            self.index += 1
            if isinstance(item, Exception):
                raise item
            return item

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
    return {
        "userid": "stud-1",
        "role": "student",
        "email": "student@example.com"
    }


@pytest.fixture
def instructor_user():
    return {
        "userid": "inst-1",
        "role": "instructor",
        "email": "instructor@example.com"
    }


# get_my_notifications(student/instructor)
def test_get_my_notifications_success(monkeypatch, student_user):
    rows = [
        ("notif-1", "stud-1", "inst-1", "Reminder", "Submit your work", False, "2026-04-11", "Ali", "Ahmad", "ali@example.com")
    ]

    conn = MockConnection([
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    result = router_notifications.get_my_notifications(student_user)

    assert result["message"] == "Notifications retrieved successfully"
    assert result["count"] == 1
    assert result["notifications"][0]["notificationId"] == "notif-1"
    assert result["notifications"][0]["title"] == "Reminder"


# non instructor sends notification
def test_send_notification_non_instructor_forbidden(student_user):
    request = router_notifications.SendNotificationRequest(
        recipientEmail="student2@example.com",
        title="Hello",
        message="Test"
    )

    with pytest.raises(HTTPException) as exc:
        router_notifications.send_notification(request, student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only instructors can send notifications"

#instructor sends notification to a student that does not exist
def test_send_notification_student_not_found(monkeypatch, instructor_user):
    request = router_notifications.SendNotificationRequest(
        recipientEmail="missing@example.com",
        title="Hello",
        message="Test"
    )

    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_notifications.send_notification(request, instructor_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Student with this email not found"

#test send  notifications for a new student
def test_send_notification_success(monkeypatch, instructor_user):
    request = router_notifications.SendNotificationRequest(
        recipientEmail="student@example.com",
        title="Quiz Reminder",
        message="Do not forget the quiz"
    )

    conn = MockConnection([
        MockResult(fetchone_value=("stud-1", "student@example.com", "student")),
        MockResult()
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    result = router_notifications.send_notification(request, instructor_user)

    assert result["message"] == "Notification sent successfully"
    assert result["recipientEmail"] == "student@example.com"
    assert conn.commit_called is True



# test mark non existed notification as read 
def test_mark_notification_as_read_not_found(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_notifications.mark_notification_as_read("notif-1", student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Notification not found"

#mark as read by unauthorized users 
def test_mark_notification_as_read_not_allowed(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=("notif-1", "other-user", False))
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_notifications.mark_notification_as_read("notif-1", student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed"

# test successful marking of notification as read
def test_mark_notification_as_read_success(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=("notif-1", "stud-1", False)),
        MockResult()
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    result = router_notifications.mark_notification_as_read("notif-1", student_user)

    assert result["message"] == "Notification marked as read"
    assert result["notificationId"] == "notif-1"
    assert conn.commit_called is True


# delete notification that does not exist
def test_delete_notification_not_found(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=None)
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_notifications.delete_notification("notif-1", student_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Notification not found"

# dlete notification by unauthorized users
def test_delete_notification_not_allowed(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=("notif-1", "other-user"))
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_notifications.delete_notification("notif-1", student_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Not allowed to delete this notification"

# test successful deletion of notification
def test_delete_notification_success(monkeypatch, student_user):
    conn = MockConnection([
        MockResult(fetchone_value=("notif-1", "stud-1")),
        MockResult()
    ])
    monkeypatch.setattr(router_notifications, "engine", MockEngine(conn))

    result = router_notifications.delete_notification("notif-1", student_user)

    assert result["message"] == "Notification deleted successfully"
    assert result["notificationId"] == "notif-1"
    assert conn.commit_called is True