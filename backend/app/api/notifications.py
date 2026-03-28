from fastapi import APIRouter, Depends
from app.api.login_auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_notifications(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user["userid"],
        "notifications": []
    }