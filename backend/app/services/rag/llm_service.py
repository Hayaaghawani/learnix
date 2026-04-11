import logging
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

from app.services.rag.llm_factory import LLMFactory
from app.services.rag.prompt_factory import PromptFactory
from app.services.rag.chunker import FileProcessor
from app.services.rag.vectorstore_provider import VectorStoreProvider

logger = logging.getLogger(__name__)


class RAGService:
    """
    Core RAG pipeline.
    Loads and indexes knowledge base once at startup.
    Handles retrieval + prompt + LLM per request.
    """

    def __init__(self, knowledge_base_path: str = "knowledge_base"):
        processor = FileProcessor()
        chunks = processor.process_directory(knowledge_base_path)

        self.store = VectorStoreProvider()
        self.store.build_from_documents(chunks)

        self.retriever = self.store.get_retriever(k=3)
        self.llm = LLMFactory.get_llm()

    def get_response(
        self,
        question: str,
        help_level: str = "guided_hint",
        concept: str | None = None,
        exercise_context: str | None = None,
    ) -> str:
        """
        Runs the full RAG chain.

        Args:
            question:         Student's message
            help_level:       conceptual_hint | guided_hint | solution
            concept:          Detected topic (e.g. 'recursion')
            exercise_context: Problem statement + instructor notes
                              injected into prompt

        Returns:
            LLM response as plain string.
            Returns a safe fallback message if the API call fails.
        """
        try:
            prompt = PromptFactory.get_rag_prompt(
                help_level=help_level,
                concept=concept,
                exercise_context=exercise_context,
            )

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

        except Exception as e:
            logger.error(f"RAG pipeline failed: {e}")
            return (
                "I'm having trouble accessing my knowledge right now. "
                "Please try again in a moment, or ask your instructor for help."
            )

    @staticmethod
    def _format_docs(docs) -> str:
        return "\n\n".join(doc.page_content for doc in docs)