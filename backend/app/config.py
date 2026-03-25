import os
from dotenv import load_dotenv

load_dotenv()

FIREWORKS_API_KEY = os.getenv("FIREWORKS_API_KEY")
FIREWORKS_BASE_URL = os.getenv("FIREWORKS_BASE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")