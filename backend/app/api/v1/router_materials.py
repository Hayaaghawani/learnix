from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user, require_role
import uuid

router = APIRouter(prefix="/materials", tags=["Materials"])

class MaterialCreate(BaseModel):
    courseId: str
    title: str
    filetype: str
    filename: str
    content: str  # base64 or plain text

@router.post("/")
def upload_material(
    request: MaterialCreate,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        course = conn.execute(
            text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
            {"course_id": request.courseId}
        ).fetchone()

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if str(course[0]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="You do not own this course")

        conn.execute(
            text("""
                INSERT INTO material (materialid, courseid, title, filetype, filename, content, uploadedby, createdat)
                VALUES (uuid_generate_v4(), :courseid, :title, :filetype, :filename, :content, :uploadedby, CURRENT_TIMESTAMP)
            """),
            {
                "courseid": request.courseId,
                "title": request.title,
                "filetype": request.filetype,
                "filename": request.filename,
                "content": request.content,
                "uploadedby": current_user["userid"]
            }
        )
        conn.commit()

    return {"message": "Material uploaded successfully"}


@router.get("/course/{course_id}")
def get_materials(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        if current_user["role"] == "student":
            enrollment = conn.execute(
                text("SELECT 1 FROM enrollments WHERE student_id = :userid AND course_id = :course_id"),
                {"userid": current_user["userid"], "course_id": course_id}
            ).fetchone()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not enrolled in this course")

        elif current_user["role"] == "instructor":
            course = conn.execute(
                text("SELECT instructorid FROM courses WHERE courseid = :course_id"),
                {"course_id": course_id}
            ).fetchone()
            if not course or str(course[0]) != str(current_user["userid"]):
                raise HTTPException(status_code=403, detail="Not your course")

        result = conn.execute(
            text("""
                SELECT materialid, title, filetype, filename, content, createdat
                FROM material
                WHERE courseid = :course_id
                ORDER BY createdat DESC
            """),
            {"course_id": course_id}
        ).fetchall()

    materials = []
    for row in result:
        materials.append({
            "materialId": str(row[0]),
            "title": row[1],
            "filetype": row[2],
            "filename": row[3],
            "content": row[4],
            "createdAt": str(row[5])
        })

    return {"count": len(materials), "materials": materials}


@router.delete("/{material_id}")
def delete_material(
    material_id: str,
    current_user: dict = Depends(require_role(["instructor"]))
):
    with engine.connect() as conn:
        material = conn.execute(
            text("""
                SELECT m.materialid, c.instructorid 
                FROM material m
                JOIN courses c ON m.courseid = c.courseid
                WHERE m.materialid = :material_id
            """),
            {"material_id": material_id}
        ).fetchone()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")
        if str(material[1]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed")

        conn.execute(
            text("DELETE FROM material WHERE materialid = :material_id"),
            {"material_id": material_id}
        )
        conn.commit()

    return {"message": "Material deleted successfully"}