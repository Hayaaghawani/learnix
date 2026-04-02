# backend/tests/unit/services/test_rag_service_full.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../..'))

from app.services.rag.llm_service import RAGService

print("Initializing RAG service...")
rag = RAGService(knowledge_base_path="data/knowledge_base")

question = "How do I write a recursive function in C++?"

print(f"\nQuestion: {question}")
print("\n--- conceptual_hint ---")
print(rag.get_response(question, help_level="conceptual_hint"))

print("\n--- guided_hint ---")
print(rag.get_response(question, help_level="guided_hint"))

print("\n--- solution ---")
print(rag.get_response(question, help_level="solution"))
