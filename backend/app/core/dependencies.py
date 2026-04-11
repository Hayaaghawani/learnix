
from functools import lru_cache
import os
from app.services.rag import RAGService
from app.services.rag import PedagogicalController


@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:
    """
    Initializes RAGService once and caches it for the app lifetime.
    @lru_cache ensures this runs exactly once regardless of how many
    requests come in — same guarantee as a module-level global,
    but testable and injectable.
    """
    kb_path = os.path.join(os.path.dirname(__file__), "../../data/knowledge_base")
    return RAGService(knowledge_base_path=kb_path)


@lru_cache(maxsize=1)
def get_controller() -> PedagogicalController:
    return PedagogicalController()