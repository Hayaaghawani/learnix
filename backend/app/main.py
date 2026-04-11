from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import attempts


from app.api.v1 import (
    auth_router,
    admin_router,
    users_router,
    courses_router,
    exercises_router,
    notifications_router,
)
from app.api.routes_chat import router as routes_chat

 

# ── App init ────────────────────────────────────────────────
app = FastAPI()


# include routers
app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(courses_router)
app.include_router(exercises_router)
app.include_router(attempts.router)
#app.include_router(users_router)
app.include_router(admin_router)
app.include_router(routes_chat)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




