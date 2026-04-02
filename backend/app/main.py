from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.api import login_auth, users, admin, notifications, courses, exercises

# ❌ comment unused imports
# from langchain_openai import ChatOpenAI
# from app.services.pedagogical_controller import PedagogicalController

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_auth.router)
app.include_router(notifications.router)
app.include_router(courses.router)
app.include_router(exercises.router)