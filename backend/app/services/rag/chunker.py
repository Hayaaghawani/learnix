
import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class FileProcessor:
    """
    Loads and chunks documents into LangChain Document objects.
    Each chunk carries metadata (source filename) for traceability.
    
    Follows mini-rag's FileProcessor pattern.
    Supports .txt and .pdf — easy to extend later.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    def process_file(self, file_path: str):
        """
        Loads a file and returns a list of Document chunks.
        Each Document has: .page_content (str) and .metadata (dict with 'source')
        """
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file type: {ext}")

        documents = loader.load()
        chunks = self.text_splitter.split_documents(documents)
        return chunks

    def process_directory(self, dir_path: str):
        """
        Processes all supported files in a directory.
        Returns a flat list of all chunks across all files.
        """
        all_chunks = []
        for filename in os.listdir(dir_path):
            filepath = os.path.join(dir_path, filename)
            ext = os.path.splitext(filename)[1].lower()
            if ext in (".txt", ".pdf"):
                chunks = self.process_file(filepath)
                all_chunks.extend(chunks)
        return all_chunks
