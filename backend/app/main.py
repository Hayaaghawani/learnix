from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

from app.config import (
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    MODEL_NAME,
)

app = FastAPI()


class ChatRequest(BaseModel):
    message: str



llm = ChatOpenAI(
    api_key=FIREWORKS_API_KEY,
    base_url=FIREWORKS_BASE_URL,
    model=MODEL_NAME,
    temperature=0.7,
)
from app.services.pedagogical_controller import PedagogicalController

controller = PedagogicalController()

def generate_response(question):

    attempts = 1   # temporary for demo

    prompt = controller.build_prompt(question, attempts)

    response = llm.invoke(prompt)

    return response


@app.post("/chat")
def chat(request: ChatRequest):
    response = generate_response(request.message)
    print("Generated response:", response.content)
    return {"response": response.content}



