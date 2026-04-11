from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from app.api.v1.router_auth import hash_password, require_role
from app.core.database import engine

router = APIRouter(prefix="/admin", tags=["Admin"])


class InviteUserRequest(BaseModel):
    email: str
    role: str


class UserStatusUpdate(BaseModel):
    active: bool


class SettingsUpdate(BaseModel):
    aiModel: str
    hintLimit: int | None = None
    executionTimeout: int | None = None


@router.get("/dashboard")
def admin_dashboard(current_user: dict = Depends(require_role(["admin"]))):
    return {"message": "Admin dashboard", "adminId": current_user["userid"]}


@router.get("/stats")
def get_admin_stats(current_user: dict = Depends(require_role(["admin"]))):
    with engine.connect() as conn:
        users = conn.execute(text("SELECT COUNT(*) FROM users")).scalar() or 0
        students = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'student'")) .scalar() or 0
        instructors = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'instructor'")) .scalar() or 0
        courses = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar() or 0

    return {
        "users": int(users),
        "students": int(students),
        "instructors": int(instructors),
        "courses": int(courses),
    }


@router.get("/users")
def get_admin_users(current_user: dict = Depends(require_role(["admin"]))):
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT userid, firstname, lastname, email, role, COALESCE(isactive, TRUE), createdat
                FROM users
                ORDER BY createdat DESC, firstname ASC
                """
            )
        ).fetchall()

    users = [
        {
            "id": str(row[0]),
            "name": f"{row[1]} {row[2]}".strip(),
            "email": row[3],
            "role": str(row[4]).capitalize(),
            "active": bool(row[5]),
            "createdAt": str(row[6]) if row[6] else None,
        }
        for row in rows
    ]
    return {"users": users}


@router.get("/courses")
def get_admin_courses(current_user: dict = Depends(require_role(["admin"]))):
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                    c.courseid,
                    c.coursename,
                    COALESCE(u.firstname || ' ' || u.lastname, 'Unknown Instructor') AS instructor_name,
                    COUNT(e.student_id) AS student_count,
                    CASE WHEN c.enddate >= CURRENT_DATE THEN 'Active' ELSE 'Completed' END AS status
                FROM courses c
                LEFT JOIN users u ON c.instructorid = u.userid
                LEFT JOIN enrollments e ON e.course_id = c.courseid
                GROUP BY c.courseid, c.coursename, u.firstname, u.lastname, c.enddate
                ORDER BY c.coursename ASC
                """
            )
        ).fetchall()

    courses = [
        {
            "id": str(row[0]),
            "name": row[1],
            "instructor": row[2],
            "students": int(row[3] or 0),
            "status": row[4],
        }
        for row in rows
    ]
    return {"courses": courses}


@router.get("/logs")
def get_admin_logs(current_user: dict = Depends(require_role(["admin"]))):
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT emailused, success, attemptedat
                FROM login_logs
                ORDER BY attemptedat DESC
                LIMIT 30
                """
            )
        ).fetchall()

    logs = [
        {
            "message": f"Login {'success' if row[1] else 'failed'} for {row[0] or 'unknown email'} at {row[2]}",
            "success": bool(row[1]),
            "attemptedAt": str(row[2]) if row[2] else None,
        }
        for row in rows
    ]
    return {"logs": logs}


@router.post("/invite-user")
def invite_user(payload: InviteUserRequest, current_user: dict = Depends(require_role(["admin"]))):
    role = payload.role.strip().lower()
    if role not in ["student", "instructor"]:
        raise HTTPException(status_code=400, detail="Role must be Student or Instructor")

    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email is required")

    local_part = email.split("@")[0]
    first_name = (local_part.split(".")[0] or "New")[:20].capitalize()
    last_name = (local_part.split(".")[1] if "." in local_part else "User")[:20].capitalize()
    temp_password = "Temp@1234"

    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM users WHERE LOWER(email) = LOWER(:email)"),
            {"email": email},
        ).fetchone()
        if exists:
            raise HTTPException(status_code=409, detail="User with this email already exists")

        created = conn.execute(
            text(
                """
                INSERT INTO users (firstname, lastname, email, password, role, isactive, createdat)
                VALUES (:firstname, :lastname, :email, :password, :role, TRUE, CURRENT_TIMESTAMP)
                RETURNING userid
                """
            ),
            {
                "firstname": first_name,
                "lastname": last_name,
                "email": email,
                "password": hash_password(temp_password),
                "role": role,
            },
        ).fetchone()

        if role == "student":
            conn.execute(
                text("INSERT INTO student (userid, enrolledcoursecount) VALUES (:userid, 0)"),
                {"userid": created[0]},
            )
        elif role == "instructor":
            conn.execute(
                text("INSERT INTO instructor (userid, title, coursecount) VALUES (:userid, NULL, 0)"),
                {"userid": created[0]},
            )

        conn.commit()

    return {
        "message": "User invited successfully",
        "userId": str(created[0]),
        "temporaryPassword": temp_password,
    }


@router.patch("/user/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_user: dict = Depends(require_role(["admin"])),
):
    if str(user_id) == str(current_user["userid"]) and not payload.active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")

    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM users WHERE userid = :userid"),
            {"userid": user_id},
        ).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="User not found")

        conn.execute(
            text("UPDATE users SET isactive = :active WHERE userid = :userid"),
            {"active": payload.active, "userid": user_id},
        )
        conn.commit()

    return {"message": "User status updated", "userId": user_id, "active": payload.active}


@router.delete("/user/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(require_role(["admin"]))):
    if str(user_id) == str(current_user["userid"]):
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM users WHERE userid = :userid"),
            {"userid": user_id},
        ).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="User not found")

        conn.execute(
            text("DELETE FROM users WHERE userid = :userid"),
            {"userid": user_id},
        )
        conn.commit()

    return {"message": "User deleted", "userId": user_id}


@router.patch("/settings")
def save_settings(payload: SettingsUpdate, current_user: dict = Depends(require_role(["admin"]))):
    with engine.connect() as conn:
        conn.execute(
            text(
                """
                INSERT INTO systemsettings (updatedby, aimodel)
                VALUES (:updatedby, :aimodel)
                """
            ),
            {"updatedby": current_user["userid"], "aimodel": payload.aiModel},
        )
        conn.commit()

    return {
        "message": "Settings saved",
        "settings": {
            "aiModel": payload.aiModel,
            "hintLimit": payload.hintLimit,
            "executionTimeout": payload.executionTimeout,
        },
    }
