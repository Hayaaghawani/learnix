# app/services/rag/prompt_factory.py

from langchain_core.prompts import ChatPromptTemplate


class PromptFactory:
    """
    Builds educational RAG prompts based on help level.
    Keeps prompt logic separate from retrieval logic.
    Follows mini-rag's PromptFactory pattern.
    """

    @staticmethod
    def get_rag_prompt(help_level: str) -> ChatPromptTemplate:

        if help_level == "conceptual_hint":
            instruction = """
Provide a conceptual hint only. Do NOT give code or the full answer.
Ask the student a reflective question to guide their thinking.
"""
        elif help_level == "guided_hint":
            instruction = """
Provide guided hints. You may show small fragments of logic but NOT the full solution.
Ask the student a follow-up question to keep them thinking.
"""
        else:  # solution
            instruction = """
Provide the full solution with a clear explanation.
Walk through the logic step by step.
"""

        template = f"""
You are an AI teaching assistant for a CS1 programming course.

Use the following course material to help answer the student's question.
If the answer is not in the context, rely on your general knowledge but stay focused on the topic.

Context:
{{context}}

Pedagogical instruction:
{instruction}

Student question:
{{question}}

Answer:
"""
        return ChatPromptTemplate.from_template(template)
