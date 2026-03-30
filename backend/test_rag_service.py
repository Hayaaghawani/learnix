# backend/test_rag_service.py
import sys
sys.path.append(".")

from app.services.llm_service import RAGService

print("Initializing RAG service...")
rag = RAGService()

question = "How do I write a recursive function in C++?"

print(f"\nQuestion: {question}")
print("\n--- conceptual_hint ---")
print(rag.get_response(question, help_level="conceptual_hint"))

print("\n--- guided_hint ---")
print(rag.get_response(question, help_level="guided_hint"))

print("\n--- solution ---")
print(rag.get_response(question, help_level="solution"))