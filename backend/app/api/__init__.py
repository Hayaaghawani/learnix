# backend/app/api/__init__.py
from app.api.v1 import (
    auth_router,
    admin_router,
    users_router,
    courses_router,
    exercises_router,
    notifications_router,
)

__all__ = [
    "auth_router",
    "admin_router",
    "users_router",
    "courses_router",
    "exercises_router",
    "notifications_router",
]
