# backend/app/api/v1/router_auth.py
# libraries
from fastapi import APIRouter, HTTPException,Request, Depends, Header
from passlib.context import CryptContext
from sqlalchemy import text
from app.core.database import engine
from app.schemas.auth import LoginRequest
import jwt
from datetime import datetime, timedelta


#Generate a JWT token
SECRET_KEY = "P$^tLe@rn!g"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 1


# router object where you define API endpoints.
router = APIRouter(prefix="/auth", tags=["Authentication"]) 

# configures the password hashing system
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# hash password
def hash_password(password: str):
   return pwd_context.hash(password)

# verify password, It checks if the password entered by the user matches the stored hashed password in Database
def verify_password(plain_password, password):
   return pwd_context.verify(plain_password, password)


# create JWT token
def create_access_token(userid: str):
    expire = datetime.now() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    payload = {
        "userid": userid,
        "exp": expire
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token, expire




#LOGIN ENDPOINT
@router.post("/login")
def login(request: LoginRequest):

#get user by email
    with engine.connect() as conn:
        query = text("SELECT userid, password FROM users WHERE email = :email")
        result = conn.execute(query, {"email": request.email}).fetchone()

        if not result:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        userid = result[0]
        stored_hash = result[1]


#if email not found -> log failed attempt
        if not result:
            conn.execute(
                text("""
                    INSERT INTO login_logs (emailUsed, success)
                    VALUES (:email, :success)
                """),
                {
                    "email": request.email,
                    "success": False,
                }
            )
            conn.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")

        userid = result[0]
        stored_hash = result[1]

# if password is wrong -> log failed attempt
        if not verify_password(request.password, stored_hash):
            conn.execute(
                text("""
                    INSERT INTO login_logs (emailused, success)
                    VALUES (:email, :success)
                """),
                {
                    "email": request.email,
                    "success": False,
                }
            )
            conn.commit()
            raise HTTPException(status_code=401, detail="Invalid email or password")


        # successful login, generate token
        token, expire_time = create_access_token(str(userid))

        #save session
        conn.execute(
            text("""
                INSERT INTO sessions (userid, token, expiresAt)
                VALUES (:userid, :token, :expiresAt)
            """),
            {
                "userid": userid,
                "token": token,
                "expiresAt": expire_time
            }
        )

        #log successful login
        conn.execute(
            text("""
                INSERT INTO login_logs (userid, emailused, success, attemptedAt)
                VALUES (:userid, :email, :success, :attemptedAt)
            """),
            {
                "userid": userid,
                "email": request.email,
                "success": True,
                "attemptedAt": datetime.utcnow()
            }
        )

        conn.commit()

    return {
        "message": "Login successful",
        "userid": str(userid),
        "access_token": token,
        "expiresAt": expire_time
    }


from fastapi import Header, HTTPException

@router.post("/logout")
def logout(request: Request):
    authorization = request.headers.get("Authorization")
    print("AUTH HEADER:", authorization)

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.split(" ", 1)[1].strip()

    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT sessionid
                FROM sessions
                WHERE token = :token
            """),
            {"token": token}
        ).fetchone()

        print("SESSION FOUND:", result)

        #if not result:
            #raise HTTPException(status_code=401, detail="Session not found or already logged out")

        conn.execute(
            text("""
                DELETE FROM sessions
                WHERE token = :token
            """),
            {"token": token}
        )

        conn.commit()

    return {"message": "Logout successful"}


# proves and reads that identity


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
            raise HTTPException(status_code=401, detail="Invalid token payload")

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    with engine.connect() as conn:
        session_row = conn.execute(
            text("""
                SELECT userid, token, expiresAt
                FROM sessions
                WHERE token = :token
            """),
            {"token": token}
        ).fetchone()

        if not session_row:
            raise HTTPException(status_code=401, detail="Session not found")

        user_row = conn.execute(
            text("""
                SELECT userid, email, role
                FROM users
                WHERE userid = :userid
            """),
            {"userid": userid}
        ).fetchone()

        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

    return {
        "userid": str(user_row[0]),
        "email": user_row[1],
        "role": user_row[2],
        "token": token
    }


def require_role(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return role_checker

#get user's data
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Authorized user",
        "user": {
            "userid": current_user["userid"],
            "email": current_user["email"],
            "role": current_user["role"]
        }
    }

#admin page 
@router.get("/admin-only")
def admin_only(current_user: dict = Depends(require_role(["admin"]))):
    return {
        "message": "Welcome admin",
        "user": current_user
    }

#instructor
@router.get("/instructor-only")
def instructor_only(current_user: dict = Depends(require_role(["instructor"]))):
    return {
        "message": "Welcome instructor",
        "user": current_user
    }

#student
@router.get("/student-only")
def student_only(current_user: dict = Depends(require_role(["student"]))):
    return {
        "message": "Welcome student",
        "user": current_user
    }
