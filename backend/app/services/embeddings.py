
import os
from langchain_community.embeddings import HuggingFaceEmbeddings


class EmbeddingFactory:
    """
    Returns an embedding model based on the provider in .env
    Follows mini-rag's EmbeddingFactory pattern.

    Supported providers:
        - "huggingface" : local, free, no API key needed (default)

    To add OpenAI later:
        - "openai" : requires OPENAI_API_KEY in .env
    """

    @staticmethod
    def get_embedding(provider: str = None):
        provider = provider or os.getenv("EMBEDDING_PROVIDER", "huggingface")

        if provider == "huggingface":
            return HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )

        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")