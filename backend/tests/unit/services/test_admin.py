import pytest
from fastapi import HTTPException

import app.api.v1.router_admin as router_admin


class MockResult:
    def __init__(self, fetchone_value=None, fetchall_value=None, scalar_value=None):
        self._fetchone_value = fetchone_value
        self._fetchall_value = fetchall_value or []
        self._scalar_value = scalar_value

    def fetchone(self):
        return self._fetchone_value

    def fetchall(self):
        return self._fetchall_value

    def scalar(self):
        return self._scalar_value


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
def admin_user():
    return {"userid": "admin-1", "role": "admin"}


# UT-A01
def test_admin_dashboard_success(admin_user):
    result = router_admin.admin_dashboard(admin_user)

    assert result["message"] == "Admin dashboard"
    assert result["adminId"] == "admin-1"


# UT-A02
def test_get_admin_stats_success(monkeypatch, admin_user):
    conn = MockConnection([
        MockResult(scalar_value=20),  # users
        MockResult(scalar_value=10),  # students
        MockResult(scalar_value=5),   # instructors
        MockResult(scalar_value=7),   # courses
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.get_admin_stats(admin_user)

    assert result["users"] == 20
    assert result["students"] == 10
    assert result["instructors"] == 5
    assert result["courses"] == 7


# UT-A03
def test_get_admin_users_success(monkeypatch, admin_user):
    rows = [
        ("u1", "Tala", "Mohammed", "tala@example.com", "student", True, "2026-04-01"),
        ("u2", "Ali", "Ahmad", "ali@example.com", "instructor", True, "2026-04-02"),
    ]
    conn = MockConnection([
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.get_admin_users(admin_user)

    assert len(result["users"]) == 2
    assert result["users"][0]["id"] == "u1"
    assert result["users"][0]["name"] == "Tala Mohammed"
    assert result["users"][0]["role"] == "Student"


# UT-A04
def test_get_admin_courses_success(monkeypatch, admin_user):
    rows = [
        ("c1", "Python Basics", "Ali Ahmad", 15, "Active"),
        ("c2", "Java Basics", "Tala Mohammed", 8, "Completed"),
    ]
    conn = MockConnection([
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.get_admin_courses(admin_user)

    assert len(result["courses"]) == 2
    assert result["courses"][0]["id"] == "c1"
    assert result["courses"][0]["name"] == "Python Basics"
    assert result["courses"][0]["students"] == 15
    assert result["courses"][0]["status"] == "Active"


# UT-A05
def test_get_admin_logs_success(monkeypatch, admin_user):
    rows = [
        ("user1@example.com", True, "2026-04-13 10:00:00"),
        ("user2@example.com", False, "2026-04-13 09:00:00"),
    ]
    conn = MockConnection([
        MockResult(fetchall_value=rows)
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.get_admin_logs(admin_user)

    assert len(result["logs"]) == 2
    assert result["logs"][0]["success"] is True
    assert "Login success" in result["logs"][0]["message"]
    assert result["logs"][1]["success"] is False


# UT-A06
def test_invite_user_invalid_role(admin_user):
    payload = router_admin.InviteUserRequest(
        email="user@example.com",
        role="admin"
    )

    with pytest.raises(HTTPException) as exc:
        router_admin.invite_user(payload, admin_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Role must be Student or Instructor"


# UT-A07
def test_invite_user_invalid_email(admin_user):
    payload = router_admin.InviteUserRequest(
        email="invalid-email",
        role="student"
    )

    with pytest.raises(HTTPException) as exc:
        router_admin.invite_user(payload, admin_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "A valid email is required"


# UT-A08
def test_invite_user_already_exists(monkeypatch, admin_user):
    payload = router_admin.InviteUserRequest(
        email="existing@example.com",
        role="student"
    )

    conn = MockConnection([
        MockResult(fetchone_value=(1,))  # existing user found
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_admin.invite_user(payload, admin_user)

    assert exc.value.status_code == 409
    assert exc.value.detail == "User with this email already exists"


# UT-A09
def test_invite_user_success(monkeypatch, admin_user):
    payload = router_admin.InviteUserRequest(
        email="new.student@example.com",
        role="student"
    )

    conn = MockConnection([
        MockResult(fetchone_value=None),         # user does not exist
        MockResult(fetchone_value=("new-id",)),  # user inserted
        MockResult(),                            # student row inserted
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.invite_user(payload, admin_user)

    assert result["message"] == "User invited successfully"
    assert result["userId"] == "new-id"
    assert result["temporaryPassword"] == "Temp@1234"
    assert conn.commit_called is True


# UT-A10
def test_update_user_status_user_not_found(monkeypatch, admin_user):
    payload = router_admin.UserStatusUpdate(active=True)

    conn = MockConnection([
        MockResult(fetchone_value=None)  # user not found
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    with pytest.raises(HTTPException) as exc:
        router_admin.update_user_status("missing-user", payload, admin_user)

    assert exc.value.status_code == 404
    assert exc.value.detail == "User not found"


# UT-A11
def test_update_user_status_success(monkeypatch, admin_user):
    payload = router_admin.UserStatusUpdate(active=False)

    conn = MockConnection([
        MockResult(fetchone_value=(1,)),  # user exists
        MockResult(),                     # update success
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.update_user_status("user-1", payload, admin_user)

    assert result["message"] == "User status updated"
    assert result["userId"] == "user-1"
    assert result["active"] is False
    assert conn.commit_called is True


# UT-A12
def test_delete_user_self_forbidden(admin_user):
    with pytest.raises(HTTPException) as exc:
        router_admin.delete_user("admin-1", admin_user)

    assert exc.value.status_code == 400
    assert exc.value.detail == "You cannot delete your own admin account"


# UT-A13
def test_delete_user_success(monkeypatch, admin_user):
    conn = MockConnection([
        MockResult(fetchone_value=(1,)),  # user exists
        MockResult(),                     # delete success
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.delete_user("user-1", admin_user)

    assert result["message"] == "User deleted"
    assert result["userId"] == "user-1"
    assert conn.commit_called is True


# UT-A14
def test_save_settings_success(monkeypatch, admin_user):
    payload = router_admin.SettingsUpdate(
        aiModel="gpt-4",
        hintLimit=5,
        executionTimeout=30
    )

    conn = MockConnection([
        MockResult()
    ])
    monkeypatch.setattr(router_admin, "engine", MockEngine(conn))

    result = router_admin.save_settings(payload, admin_user)

    assert result["message"] == "Settings saved"
    assert result["settings"]["aiModel"] == "gpt-4"
    assert result["settings"]["hintLimit"] == 5
    assert result["settings"]["executionTimeout"] == 30
    assert conn.commit_called is True