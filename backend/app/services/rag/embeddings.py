
import os
from dotenv import load_dotenv
from langchain_fireworks import FireworksEmbeddings

load_dotenv()


class EmbeddingFactory:
    """
    Returns an embedding model based on .env configuration.
    Follows mini-rag's EmbeddingFactory pattern.

    Currently supported:
        - "fireworks": nomic-embed-text-v1.5 via Fireworks API (default)

    To switch models, change EMBEDDING_MODEL in .env only.
    No code changes needed.
    """

    @staticmethod
    def get_embedding(provider: str = None):
        provider = provider or os.getenv("EMBEDDING_PROVIDER", "fireworks")

        if provider == "fireworks":
            return FireworksEmbeddings(
                fireworks_api_key=os.getenv("FIREWORKS_API_KEY"),
                model=os.getenv(
                    "EMBEDDING_MODEL",
                    "nomic-ai/nomic-embed-text-v1.5",
                ),
            )

        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")