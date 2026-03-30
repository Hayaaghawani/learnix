# app/services/vectorstore_provider.py

from langchain_community.vectorstores import Chroma
from app.services.embeddings import EmbeddingFactory


class VectorStoreProvider:
    """
    Wraps the vector store with clean methods:
        - build_from_documents(): index chunks into the store
        - get_retriever():        returns a LangChain retriever for search

    Follows mini-rag's VectorStoreProvider pattern.
    Currently uses Chroma (in-memory).
    When pgvector is ready, only this file changes — nothing else.
    """

    def __init__(self, collection_name: str = "learnix"):
        self.collection_name = collection_name
        self.embeddings = EmbeddingFactory.get_embedding()
        self.vectorstore = None

    def build_from_documents(self, documents: list):
        """
        Takes a list of LangChain Document chunks,
        embeds them, and stores them in the vector store.
        """
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            collection_name=self.collection_name,
        )
        print(f"[VectorStoreProvider] Indexed {len(documents)} chunks.")

    def get_retriever(self, k: int = 3):
        """
        Returns a LangChain retriever.
        k = number of chunks to retrieve per query.
        """
        if self.vectorstore is None:
            raise RuntimeError("Vector store not built yet. Call build_from_documents() first.")

        return self.vectorstore.as_retriever(search_kwargs={"k": k})
