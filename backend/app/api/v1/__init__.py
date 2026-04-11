# backend/app/api/v1/__init__.py
from .router_auth import router as auth_router
from .router_admin import router as admin_router
from .router_users import router as users_router
from .router_courses import router as courses_router
from .router_exercises import router as exercises_router
from .router_notifications import router as notifications_router
from .router_materials import router as material_router


__all__ = [
    "auth_router",
    "admin_router",
    "users_router",
    "courses_router",
    "exercises_router",
    "notifications_router",
    "material_router"
]
