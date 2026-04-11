import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()


class LLMFactory:
    """
    Returns a configured LLM instance.
    Validates environment on startup — fails loudly at boot,
    not silently during a student's session.
    """

    @staticmethod
    def get_llm():
        provider = os.getenv("LLM_PROVIDER", "fireworks").lower()

        if provider == "fireworks":
            api_key = os.getenv("FIREWORKS_API_KEY")
            base_url = os.getenv("FIREWORKS_BASE_URL")
            model = os.getenv("MODEL_NAME")

            # Validate at startup — not during a request
            if not api_key:
                raise EnvironmentError(
                    "FIREWORKS_API_KEY is missing from .env"
                )
            if not model:
                raise EnvironmentError(
                    "MODEL_NAME is missing from .env"
                )

            return ChatOpenAI(
                api_key=api_key,
                base_url=base_url,
                model=model,
                temperature=float(os.getenv("LLM_TEMPERATURE", 0.7)),
                max_tokens=1024,  # prevent runaway responses
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
