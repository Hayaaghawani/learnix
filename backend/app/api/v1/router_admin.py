from fastapi import APIRouter, Depends
from app.api.v1.router_auth import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
def admin_dashboard(current_user: dict = Depends(require_role(["admin"]))):
    return {"message": "Admin dashboard"}
