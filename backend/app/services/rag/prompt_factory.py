from langchain_core.prompts import ChatPromptTemplate
from app.core.enums import HelpLevel


class PromptFactory:

    @staticmethod
    def get_rag_prompt(
        help_level: HelpLevel,
        concept: str | None = None,
        exercise_context: str | None = None,
    ) -> ChatPromptTemplate:

        if help_level == HelpLevel.CONCEPTUAL_HINT:
            instruction = """
Provide a conceptual hint only. Do NOT give code or the full answer.
Ask the student one reflective question to guide their thinking.
"""
        elif help_level == HelpLevel.GUIDED_HINT:
            instruction = """
Provide a guided hint. You may show small logic fragments but NOT
the full solution. Ask one follow-up question to keep them thinking.
"""
        else:
            instruction = """
Provide the full solution with a clear step-by-step explanation.
"""

        concept_line = (
            f"The student is working on: {concept}.\n"
            if concept else ""
        )

        exercise_block = (
            f"\nExercise information:\n{exercise_context}\n"
            if exercise_context else ""
        )

        template = f"""
You are an AI teaching assistant for a CS1 programming course.
{concept_line}{exercise_block}
Use the following course material to help answer the student's question.
If the answer is not in the material, use your general knowledge
but stay focused on the topic.

Course material:
{{context}}

Pedagogical instruction:
{instruction}

Student question:
{{question}}

Answer:
"""
        return ChatPromptTemplate.from_template(template)
