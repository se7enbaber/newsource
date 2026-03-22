import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Load environment variables
# Try to load env from current folder, then parent
if not load_dotenv():
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "business_knowledge")

def get_knowledge_documents():
    """
    Load markdown documents from the knowledge directory.
    """
    knowledge_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.agent/specs/ai/knowledge/business/"))
    if not os.path.exists(knowledge_path):
        print(f"⚠️ Knowledge path not found: {knowledge_path}")
        return []
        
    loader = DirectoryLoader(knowledge_path, glob="*.md", loader_cls=TextLoader)
    return loader.load()

def ingest_knowledge(tenant_id: str = "system"):
    """
    Script to read .md files from knowledge directory and push to Vector DB with tenant_id tagging.
    """
    print(f"--- Ingesting knowledge for Tenant: {tenant_id} ---")
    
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY is not set in .env")
        return

    # 1. Load Markdown Files
    documents = get_knowledge_documents()
    
    if not documents:
        print("⚠️ No documents found to ingest.")
        return

    # 2. Text Splitting (Keeping structure)
    # Strategy: Split by Headers then by characters if too long
    headers_to_split_on = [
        ("#", "Header 1"),
        ("##", "Header 2"),
        ("###", "Header 3"),
    ]
    
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        add_start_index=True
    )
    
    final_docs = []
    for doc in documents:
        chunks = text_splitter.split_documents([doc])
        # Add tenant_id to metadata for EVERY chunk
        for chunk in chunks:
            chunk.metadata["tenant_id"] = tenant_id
            chunk.metadata["source"] = os.path.basename(chunk.metadata.get("source", "unknown"))
        final_docs.extend(chunks)

    print(f"Created {len(final_docs)} chunks from {len(documents)} documents.")

    # 3. Setup Gemini Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=GOOGLE_API_KEY)

    # 4. Store in Qdrant
    try:
        # Simple ingestion
        QdrantVectorStore.from_documents(
            documents=final_docs,
            embedding=embeddings,
            url=f"http://{QDRANT_HOST}:{QDRANT_PORT}",
            api_key=QDRANT_API_KEY,
            collection_name=QDRANT_COLLECTION
        )
        print(f"✅ SUCCESSFULLY ingested {len(final_docs)} chunks into Qdrant collection '{QDRANT_COLLECTION}'.")
        
    except Exception as e:
        print(f"❌ ERROR connecting to Qdrant or Ingesting: {e}")

if __name__ == "__main__":
    # Default ingestion for system-wide knowledge base
    ingest_knowledge(tenant_id="system")
