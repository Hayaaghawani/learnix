import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv() 


class LLMFactory:
    """
    Returns a LangChain LLM instance based on .env configuration.
    Follows mini-rag's LLMFactory pattern.
    """

    @staticmethod
    def get_llm():
        provider = os.getenv("LLM_PROVIDER", "fireworks").lower()

        if provider == "fireworks":
            return ChatOpenAI(
                api_key=os.getenv("FIREWORKS_API_KEY"),
                base_url=os.getenv("FIREWORKS_BASE_URL"),
                model=os.getenv("MODEL_NAME"),
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.7)),
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")