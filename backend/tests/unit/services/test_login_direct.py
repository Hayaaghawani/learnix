import pytest
import jwt
from fastapi import HTTPException
from starlette.requests import Request
from types import SimpleNamespace

from app.api.v1.router_auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    SECRET_KEY,
    ALGORITHM,
)

#  for mocking database # monkeypatch to replace router_auth.engine with MockEngine so get_current_user behavior can be tested deterministically.
class MockResult:
    def __init__(self, row):
        self.row = row

    def fetchone(self):
        return self.row


class MockConnection:
    def __init__(self, user_row=None):
        self.user_row = user_row

    def execute(self, *args, **kwargs):
        return MockResult(self.user_row)

    def commit(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        pass


class MockEngine:
    def __init__(self, user_row=None):
        self.user_row = user_row

    def connect(self):
        return MockConnection(self.user_row)


def make_request_with_auth(auth_value=None):
    headers = []
    if auth_value is not None:
        headers.append((b"authorization", auth_value.encode()))

    scope = {
        "type": "http",
        "method": "GET",
        "headers": headers,
    }
    return Request(scope)


# Unit tests for password isnt stored in plain text
def test_hash_password_returns_hashed_value():
    password = "realadmin"
    hashed = hash_password(password)

    assert hashed != password
    assert isinstance(hashed, str)

# Unit tests for password verification
def test_verify_password_correct():
    password = "realadmin"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True

# for password is wrong validation 
def test_verify_password_wrong():
    password = "realadmin3"
    hashed = hash_password(password)

    assert verify_password("WrongPassword", hashed) is False


# for token creation 
def test_create_access_token_returns_token_and_expiry():
    userid = "123"
    token, expire = create_access_token(userid)

    assert isinstance(token, str)
    assert expire is not None

    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["userid"] == userid
    assert "exp" in payload


# for get_current_user, no auth header should fail
def test_get_current_user_missing_authorization_header():
    request = make_request_with_auth()

    with pytest.raises(HTTPException) as exc:
        get_current_user(request)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Authorization header missing"


#invalid token instead Bearer ...
def test_get_current_user_invalid_authorization_format():
    request = make_request_with_auth("Token abc123")

    with pytest.raises(HTTPException) as exc:
        get_current_user(request)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid authorization format"

#invalid token that cannot be decoded
def test_get_current_user_invalid_token(monkeypatch):
    request = make_request_with_auth("Bearer invalid.token.here")

    with pytest.raises(HTTPException) as exc:
        get_current_user(request)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid token"

#no user found in DB for given token
def test_get_current_user_user_not_found(monkeypatch):
    token, _ = create_access_token("999")
    request = make_request_with_auth(f"Bearer {token}")

    # mock DB: no user found
    mock_engine = MockEngine(user_row=None)

    # patch engine inside router_auth module
    import app.api.v1.router_auth as router_auth
    monkeypatch.setattr(router_auth, "engine", mock_engine)

    with pytest.raises(HTTPException) as exc:
        get_current_user(request)

    assert exc.value.status_code == 404
    assert exc.value.detail == "User not found"

# successful retrieval of user info from token
def test_get_current_user_success(monkeypatch):
    userid = "111"
    token, _ = create_access_token(userid)
    request = make_request_with_auth(f"Bearer {token}")

    mock_user = (userid, "user@example.com", "student", "Tala", "Mohammed")
    mock_engine = MockEngine(user_row=mock_user)

    import app.api.v1.router_auth as router_auth
    monkeypatch.setattr(router_auth, "engine", mock_engine)

    result = get_current_user(request)

    assert result["userid"] == userid
    assert result["email"] == "user@example.com"
    assert result["role"] == "student"
    assert result["firstname"] == "Tala"
    assert result["lastname"] == "Mohammed"
    assert result["token"] == token


# for role checking
def test_require_role_allows_valid_role():
    checker = require_role(["admin", "instructor"])
    current_user = {"role": "admin"}

    result = checker(current_user)

    assert result == current_user

#role checking blocks invalid role
def test_require_role_blocks_invalid_role():
    checker = require_role(["admin"])
    current_user = {"role": "student"}

    with pytest.raises(HTTPException) as exc:
        checker(current_user)

    assert exc.value.status_code == 403
    assert exc.value.detail == "Forbidden"