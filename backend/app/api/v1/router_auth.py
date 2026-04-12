# libraries
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Request, Depends
from passlib.context import CryptContext
from sqlalchemy import text
from app.core.database import engine
from app.schemas import LoginRequest
import jwt
from datetime import datetime, timedelta

# JWT config
SECRET_KEY = "P$^tLe@rn!g_PLATFORM_SECRET_KEY_2026_SECURE_32_BYTES"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1

# router
router = APIRouter(prefix="/auth", tags=["Authentication"])

# password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# create token
def create_access_token(userid: str):
    expire = datetime.now() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "userid": userid,
        "exp": expire
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


# ================= LOGIN =================
@router.post("/login")
def login(request: LoginRequest):

    with engine.connect() as conn:
        query = text("SELECT userid, password FROM users WHERE email = :email")
        result = conn.execute(query, {"email": request.email}).fetchone()

        # ❌ EMAIL NOT FOUND
        if not result:
            conn.execute(
                text("""
                    INSERT INTO login_logs (emailused, success, attemptedat, ipaddress)
                    VALUES (:email, :success, :attemptedat, :ipaddress)
                """),
                {
                    "email": request.email,
                    "success": False,
                    "attemptedat": datetime.utcnow(),
                    "ipaddress": None  # Can be enhanced to capture IP later
                }
            )
            conn.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")

        userid = result[0]
        stored_hash = result[1]

        # WRONG PASSWORD
        if not verify_password(request.password, stored_hash):
            conn.execute(
                text("""
                    INSERT INTO login_logs (emailused, success, attemptedat, ipaddress)
                    VALUES (:email, :success, :attemptedat, :ipaddress)
                """),
                {
                    "email": request.email,
                    "success": False,
                    "attemptedat": datetime.utcnow(),
                    "ipaddress": None
                }
            )
            conn.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")

        #SUCCESS LOGIN
        token, expire_time = create_access_token(str(userid))

        # save session
        conn.execute(
            text("""
                INSERT INTO sessions (userid, token, expiresat)
                VALUES (:userid, :token, :expiresat)
            """),
            {
                "userid": userid,
                "token": token,
                "expiresat": expire_time
            }
        )

        # log success
        conn.execute(
            text("""
                INSERT INTO login_logs (userid, emailused, success, attemptedat, ipaddress)
                VALUES (:userid, :email, :success, :attemptedat, :ipaddress)
            """),
            {
                "userid": userid,
                "email": request.email,
                "success": True,
                "attemptedat": datetime.utcnow(),
                "ipaddress": None
            }
        )

        conn.commit()

    return {
        "message": "Login successful",
        "userid": str(userid),
        "access_token": token,
        "expiresAt": expire_time
    }


# ================= LOGOUT =================
@router.post("/logout")
def logout(request: Request):
    authorization = request.headers.get("Authorization")

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.split(" ", 1)[1].strip()

    with engine.connect() as conn:
        conn.execute(
            text("DELETE FROM sessions WHERE token = :token"),
            {"token": token}
        )
        conn.commit()

    return {"message": "Logout successful"}


# ================= AUTH =================
def get_current_user(request: Request):
    authorization = request.headers.get("Authorization")

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        userid = payload.get("userid")
        if not userid:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT userid, email, role, firstname, lastname FROM users WHERE userid = :userid"),
            {"userid": userid}
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    return {
        "userid": str(user[0]),
        "email": user[1],
        "role": user[2],
        "firstname": user[3],
        "lastname": user[4],
        "token": token
    }


def require_role(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return role_checker


# ================= ROUTES =================
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user
    }


@router.get("/admin-only")
def admin_only(current_user: dict = Depends(require_role(["admin"]))):
    return {"message": "Welcome admin"}


@router.get("/instructor-only")
def instructor_only(current_user: dict = Depends(require_role(["instructor"]))):
    return {"message": "Welcome instructor"}


@router.get("/student-only")
def student_only(current_user: dict = Depends(require_role(["student"]))):
    return {"message": "Welcome student"}

class ResetPasswordRequest(BaseModel):
    email: str
    newPassword: str

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT userid FROM users WHERE LOWER(email) = LOWER(:email)"),
            {"email": request.email.strip()}
        ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="No account found with this email.")

        if len(request.newPassword) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

        new_hash = hash_password(request.newPassword)
        conn.execute(
            text("UPDATE users SET password = :password WHERE userid = :userid"),
            {"password": new_hash, "userid": user[0]}
        )
        conn.commit()

    return {"message": "Password reset successfully."}