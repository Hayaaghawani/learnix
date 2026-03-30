# backend/test_chunker.py
import sys
sys.path.append(".")

from app.services.chunker import FileProcessor

processor = FileProcessor()
chunks = processor.process_directory("knowledge_base")

print(f"Total chunks across all files: {len(chunks)}\n")
for i, chunk in enumerate(chunks):
    print(f"--- Chunk {i+1} ---")
    print(f"Source: {chunk.metadata['source']}")
    print(f"Content ({len(chunk.page_content)} chars):\n{chunk.page_content}")
    print()