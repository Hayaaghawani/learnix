import sys
sys.path.append(".")

from app.services.chunker import FileProcessor
from app.services.vectorstore_provider import VectorStoreProvider

# Step 1: chunk all files
processor = FileProcessor()
chunks = processor.process_directory("knowledge_base")
print(f"Loaded {len(chunks)} chunks\n")

# Step 2: embed and index
store = VectorStoreProvider()
store.build_from_documents(chunks)

# Step 3: retrieve
retriever = store.get_retriever(k=3)
query = "What is a base case in recursion?"
results = retriever.invoke(query)

print(f"\nQuery: '{query}'")
print(f"Retrieved {len(results)} chunks:\n")
for i, doc in enumerate(results):
    print(f"--- Result {i+1} ---")
    print(f"Source: {doc.metadata.get('source', 'unknown')}")
    print(f"Content: {doc.page_content}\n")