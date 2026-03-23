# libraries
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from sqlalchemy import text
from app.core.database import engine
from app.schema.auth import LoginRequest
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
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    payload = {
        "userid": userid,
        "exp": expire
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token, expire


#LOGIN ENDPOINT
@router.post("/login")
def login(request: LoginRequest):

    with engine.connect() as conn:
        query = text("SELECT userid, password FROM users WHERE email = :email")
        result = conn.execute(query, {"email": request.email}).fetchone()

        if not result:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        userid = result[0]
        stored_hash = result[1]

        if not verify_password(request.password, stored_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # 1️⃣ generate token
        token, expire_time = create_access_token(str(userid))

        # 2️⃣ insert session
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

        conn.commit()

    return {
        "message": "Login successful",
        "userid": str(userid),
        "access_token": token,
        "expiresAt": expire_time
    }