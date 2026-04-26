from fastapi import FastAPI, Request
from fastapi.responses import Response
from app.api.sandbox import router as sandbox_router  

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
from app.api.router_help_requests import router as help_request_router, instructor_router  # ← fixed path

app = FastAPI()  # ← must come before any app.include_router()

from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

app.include_router(auth_router)
app.include_router(notifications_router)
app.include_router(courses_router)
app.include_router(exercises_router)
app.include_router(attempts_router)
app.include_router(admin_router)
app.include_router(material_router)
app.include_router(routes_chat)
app.include_router(sandbox_router)
app.include_router(help_request_router)   # ← moved to bottom with the rest
app.include_router(instructor_router)