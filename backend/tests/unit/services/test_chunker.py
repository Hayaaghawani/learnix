# backend/tests/unit/services/test_chunker.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../..'))

from app.services.rag.chunker import FileProcessor

processor = FileProcessor()
chunks = processor.process_directory("data/knowledge_base")

print(f"Total chunks across all files: {len(chunks)}\n")
for i, chunk in enumerate(chunks):
    print(f"--- Chunk {i+1} ---")
    print(f"Source: {chunk.metadata['source']}")
    print(f"Content ({len(chunk.page_content)} chars):\n{chunk.page_content}")
    print()
