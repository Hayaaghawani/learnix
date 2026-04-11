from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth_router,
    admin_router,
    users_router,
    courses_router,
    exercises_router,
    notifications_router,
    material_router
)
from app.api.routes_chat import router as routes_chat
from app.api.attempts import router as attempts_router

# ── App init ────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(courses_router)
app.include_router(exercises_router)
app.include_router(attempts_router)
#app.include_router(users_router)
app.include_router(admin_router)
app.include_router(material_router)
app.include_router(routes_chat)




