from fastapi import APIRouter, Depends
from app.api.v1.router_auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user
