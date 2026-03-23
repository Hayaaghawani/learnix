from fastapi import FastAPI
from app.api import login_auth

app = FastAPI()

# connect login_auth router
app.include_router(login_auth.router)

@app.get("/")
def home():
    return {"message": "Welcome to Learnix API!"}
