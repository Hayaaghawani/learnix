from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role


router = APIRouter(prefix="/courses", tags=["Courses"])


class CourseCreate(BaseModel):
    courseName: str
    description: str | None = None
    languageUsed: str
    startDate: str   # format: YYYY-MM-DD
    endDate: str     # format: YYYY-MM-DD


class JoinCourseRequest(BaseModel):
    joinKey: str


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


# JOIN COURSE (STUDENT)
@router.post("/join")
def join_course(
    request: JoinCourseRequest,
    current_user: dict = Depends(require_role(["student"]))
):
    join_key = request.joinKey or ""
    if len(join_key) <= 36:
        raise HTTPException(status_code=400, detail="Invalid join code")

    course_id = join_key[-36:]
    instructor_username = join_key[:-36].lower()

    with engine.connect() as conn:
        course = conn.execute(
            text("""
                SELECT c.courseid, c.coursename
                FROM courses c
                JOIN users u ON c.instructorid = u.userid
                WHERE c.courseid = :course_id
                  AND lower(split_part(u.email, '@', 1)) = :username
            """),
            {"course_id": course_id, "username": instructor_username}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=400, detail="Invalid join code")

        existing = conn.execute(
            text("""
                SELECT 1
                FROM enrollments
                WHERE student_id = :student_id
                  AND course_id = :course_id
            """),
            {"student_id": current_user["userid"], "course_id": course_id}
        ).fetchone()

        if existing:
            return {
                "message": "You are already enrolled in this course.",
                "courseId": str(course[0])
            }

        conn.execute(
            text("INSERT INTO enrollments (student_id, course_id) VALUES (:student_id, :course_id)"),
            {"student_id": current_user["userid"], "course_id": course_id}
        )
        conn.commit()

    return {
        "message": "You have been enrolled in the course.",
        "courseId": course_id
    }


# DELETE COURSE (INSTRUCTOR OR ADMIN)
@router.delete("/{course_id}")
def delete_course(
    course_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"]))
):
    with engine.connect() as conn:
        # Check if course exists
        course = conn.execute(
            text("""
                SELECT instructorid
                FROM courses
                WHERE courseid = :course_id
            """),
            {"course_id": course_id}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check authorization: only course owner or admin can delete
        instructor_id = course[0]
        if current_user["role"] == "instructor" and str(instructor_id) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed to delete this course")

        # Delete course (cascading deletes should handle exercises, enrollments, etc.)
        conn.execute(
            text("DELETE FROM courses WHERE courseid = :course_id"),
            {"course_id": course_id}
        )
        conn.commit()

    return {
        "message": "Course deleted successfully",
        "courseId": course_id
    }




## get enrolled students
@router.get("/{course_id}/students")
def get_course_students(
    course_id: str,
    current_user: dict = Depends(require_role(["instructor", "admin"]))
):
    with engine.connect() as conn:
        # if instructor, make sure they own the course
        if current_user["role"] == "instructor":
            course = conn.execute(
                text("""
                    SELECT c.courseid, c.instructorid, c.coursename,
                           lower(split_part(u.email, '@', 1)) AS username
                    FROM courses c
                    JOIN users u ON c.instructorid = u.userid
                    WHERE c.courseid = :course_id
                """),
                {"course_id": course_id}
            ).fetchone()

            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            if str(course[1]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not allowed to access this course")

            course_name = course[2]
            instructor_username = course[3]

        else:
            course = conn.execute(
                text("""
                    SELECT c.courseid, c.instructorid, c.coursename,
                           lower(split_part(u.email, '@', 1)) AS username
                    FROM courses c
                    JOIN users u ON c.instructorid = u.userid
                    WHERE c.courseid = :course_id
                """),
                {"course_id": course_id}
            ).fetchone()

            if not course:
                raise HTTPException(status_code=404, detail="Course not found")

            course_name = course[2]
            instructor_username = course[3]

        # get enrolled students
        result = conn.execute(
            text("""
                SELECT u.userid, u.firstname, u.lastname, u.email
                FROM enrollments e
                JOIN users u ON e.student_id = u.userid
                WHERE e.course_id = :course_id
                ORDER BY u.firstname, u.lastname, u.email
            """),
            {"course_id": course_id}
        ).fetchall()

    students = []
    for row in result:
        students.append({
            "studentId": str(row[0]),
            "name": f"{row[1]} {row[2]}".strip(),
            "email": row[3]
        })

    return {
        "courseId": course_id,
        "courseName": course_name,
        "enrollmentCode": f"{instructor_username}{course_id}",
        "count": len(students),
        "students": students
    }