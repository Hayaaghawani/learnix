from fastapi import FastAPI#tala
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware#tala
from app.api import login_auth, users, admin, notifications, courses,exercises,attempts# Tala's part
from langchain_openai import ChatOpenAI
from app.services.pedagogical_controller import PedagogicalController

from app.config import (
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    MODEL_NAME,
)


app = FastAPI()

# include Tala's router
app.include_router(login_auth.router)
app.include_router(notifications.router)
app.include_router(courses.router)
app.include_router(exercises.router)
app.include_router(attempts.router)
#app.include_router(users.router)
#app.include_router(admin.router)



# Haya's chatbot setup
class ChatRequest(BaseModel):
    message: str

#llm = ChatOpenAI(
    #api_key=FIREWORKS_API_KEY,
   # base_url=FIREWORKS_BASE_URL,
  #  model=MODEL_NAME,
 #   temperature=0.7,
#)

#controller = PedagogicalController()

#def generate_response(question):
 #   attempts = 1
  #  prompt = controller.build_prompt(question, attempts)
   # response = llm.invoke(prompt)
    #return response

# Haya's endpoint
#@app.post("/chat")
#def chat(request: ChatRequest):
 #   response = generate_response(request.message)
  #  return {"response": response.content}

# Tala’s endpoint
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



