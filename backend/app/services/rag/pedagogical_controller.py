
from app.core.enums import HelpLevel


class PedagogicalController:

    def detect_concept(self, question: str) -> str | None:
        q = question.lower()
        if "factorial" in q or "recursion" in q or "recursive" in q:
            return "recursion"
        if "loop" in q or "for" in q or "while" in q:
            return "loops"
        if "array" in q or "index" in q:
            return "arrays"
        return None

    def determine_help_level(self, attempts: int) -> HelpLevel:
        if attempts == 0:
            return HelpLevel.CONCEPTUAL_HINT
        elif attempts <= 2:
            return HelpLevel.GUIDED_HINT
        else:
            return HelpLevel.SOLUTION
