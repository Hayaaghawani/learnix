# app/services/llm_service.py

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.services.llm_factory import LLMFactory
from app.services.prompt_factory import PromptFactory
from app.services.chunker import FileProcessor
from app.services.vectorstore_provider import VectorStoreProvider


class RAGService:
    """
    Core RAG pipeline. Follows mini-rag's RAGService pattern.

    Responsibilities:
        - Load and index knowledge base on startup
        - Retrieve relevant chunks for a query
        - Build educational prompt based on help level
        - Return LLM response as a clean string
    """

    def __init__(self, knowledge_base_path: str = "knowledge_base"):
        # 1. Load and chunk all files
        processor = FileProcessor()
        chunks = processor.process_directory(knowledge_base_path)

        # 2. Embed and index
        self.store = VectorStoreProvider()
        self.store.build_from_documents(chunks)

        # 3. Get retriever and LLM
        self.retriever = self.store.get_retriever(k=3)
        self.llm = LLMFactory.get_llm()

    def get_response(self, question: str, help_level: str = "guided_hint") -> str:
        """
        Runs the full RAG chain for a student question.

        Args:
            question:   The student's question.
            help_level: One of 'conceptual_hint', 'guided_hint', 'solution'

        Returns:
            The LLM's response as a plain string.
        """
        prompt = PromptFactory.get_rag_prompt(help_level)

        # LCEL chain — same pattern as both reference repos
        rag_chain = (
            {
                "context": self.retriever | self._format_docs,
                "question": RunnablePassthrough(),
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        return rag_chain.invoke(question)

    @staticmethod
    def _format_docs(docs) -> str:
        """Merges retrieved document chunks into one string."""
        return "\n\n".join(doc.page_content for doc in docs)
