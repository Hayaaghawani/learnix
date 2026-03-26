
class PedagogicalController:

    def __init__(self):
        self.course_knowledge = {
            "recursion": """
Recursion is a technique where a function calls itself.
Every recursive function must have a base case that stops the recursion.
Example: factorial(n) = n * factorial(n-1)
""",

            "loops": """
Loops allow repeated execution of code.
Common C++ loops are for, while, and do-while.
""",

            "arrays": """
Arrays store multiple elements of the same type in contiguous memory.
Elements are accessed using indices starting from 0.
"""
        }


    
    def detect_concept(self, question: str):

        q = question.lower()

        if "factorial" in q or "recursion" in q:
            return "recursion"

        if "loop" in q:
            return "loops"

        if "array" in q:
            return "arrays"

        return None


    def determine_help_level(self, attempts: int):

        if attempts == 0:
            return "conceptual_hint"

        elif attempts <= 2:
            return "guided_hint"

        else:
            return "solution"


    def retrieve_context(self, concept):

        if concept in self.course_knowledge:
            return self.course_knowledge[concept]

        return ""


    def build_prompt(self, question, attempts):

        concept = self.detect_concept(question)

        help_level = self.determine_help_level(attempts)

        context = self.retrieve_context(concept)

        if help_level == "conceptual_hint":

            instruction = """
Provide a conceptual hint only.
Do not give code.
Encourage the student to think about the concept.
"""

        elif help_level == "guided_hint":

            instruction = """
Provide guided hints.
You may show small fragments of logic but not the full solution.
Ask the student reflective questions.
"""

        else:

            instruction = """
Provide the full solution with explanation.
"""

        prompt = f"""
You are an AI teaching assistant for a CS1 programming course.

Course context:
{context}

Instruction rules:
{instruction}

Student question:
{question}
"""

        return prompt