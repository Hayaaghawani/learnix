from enum import Enum


class HelpLevel(str, Enum):
    """
    Pedagogical help levels.
    Inherits from str so FastAPI serializes it cleanly in JSON responses.
    """
    CONCEPTUAL_HINT = "conceptual_hint"
    GUIDED_HINT     = "guided_hint"
    SOLUTION        = "solution"


class LLMProvider(str, Enum):
    FIREWORKS = "fireworks"


class EmbeddingProvider(str, Enum):
    FIREWORKS = "fireworks"