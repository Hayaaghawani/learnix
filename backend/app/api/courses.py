from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.login_auth import get_current_user, require_role


router = APIRouter(prefix="/courses", tags=["Courses"])


class CourseCreate(BaseModel):
    courseName: str
    description: str | None = None
    languageUsed: str
    startDate: str   # format: YYYY-MM-DD
    endDate: str     # format: YYYY-MM-DD


# GET MY COURSES
@router.get("/my")
def get_my_courses(current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        if current_user["role"] == "instructor":
            result = conn.execute(
                text("""
                    SELECT courseid, coursename, description, languageused, startdate, enddate, instructorid
                    FROM courses
                    WHERE instructorid = :userid
                    ORDER BY startdate DESC
                """),
                {"userid": current_user["userid"]}
            ).fetchall()

        elif current_user["role"] == "student":
            result = conn.execute(
                text("""
                    SELECT c.courseid, c.coursename, c.description, c.languageused, c.startdate, c.enddate, c.instructorid
                    FROM courses c
                    JOIN enrollments e ON c.courseid = e.course_id
                    WHERE e.student_id = :userid
                    ORDER BY c.startdate DESC
                """),
                {"userid": current_user["userid"]}
            ).fetchall()

       # elif current_user["role"] == "admin":
       #     result = conn.execute(
        #        text("""
         #           SELECT courseid, coursename, description, languageused, startdate, enddate, instructorid
          #          FROM courses
           #         ORDER BY startdate DESC
            #    """)
            #).fetchall()

        else:
            raise HTTPException(status_code=403, detail="Unsupported role")

    courses = []
    for row in result:
        courses.append({
            "courseId": str(row[0]),
            "courseName": row[1],
            "description": row[2],
            "languageUsed": row[3],
            "startDate": row[4],
            "endDate": row[5],
            "instructorId": str(row[6]),
        })

    return {
        "count": len(courses),
        "courses": courses
    }


# GET COURSE DETAILS
@router.get("/{course_id}")
def get_course(course_id: str, current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        course = conn.execute(
            text("""
                SELECT courseid, coursename, description, languageused, startdate, enddate, instructorid
                FROM courses
                WHERE courseid = :course_id
            """),
            {"course_id": course_id}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Optional access check for students:
        if current_user["role"] == "student":
            enrollment = conn.execute(
                text("""
                    SELECT 1
                    FROM enrollments
                    WHERE student_id = :userid AND course_id = :course_id
                """),
                {
                    "userid": current_user["userid"],
                    "course_id": course_id
                }
            ).fetchone()

            if not enrollment:
                raise HTTPException(status_code=403, detail="Not allowed to access this course")

        # Optional access check for instructors:
        elif current_user["role"] == "instructor":
            if str(course[6]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed to access this course")

    return {
        "courseId": str(course[0]),
        "courseName": course[1],
        "description": course[2],
        "languageUsed": course[3],
        "startDate": course[4],
        "endDate": course[5],
        "instructorId": str(course[6])
    }


# CREATE COURSE (INSTRUCTOR OR ADMIN)
@router.post("/")
def create_course(
    request: CourseCreate,
    current_user: dict = Depends(require_role(["instructor", "admin"]))
):
    with engine.connect() as conn:
        new_course = conn.execute(
            text("""
                INSERT INTO courses (
                    courseid, coursename, description, languageused, startdate, enddate, instructorid
                )
                VALUES (
                    uuid_generate_v4(), :coursename, :description, :languageused, :startdate, :enddate, :instructorid
                )
                RETURNING courseid
            """),
            {
                "coursename": request.courseName,
                "description": request.description,
                "languageused": request.languageUsed,
                "startdate": request.startDate,
                "enddate": request.endDate,
                "instructorid": current_user["userid"]
            }
        ).fetchone()

        conn.commit()

    return {
        "message": "Course created successfully",
        "courseId": str(new_course[0])
    }