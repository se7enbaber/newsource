import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, UnstructuredMarkdownLoader
from langchain.text_splitter import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Load environment variables
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "business_knowledge")

def ingest_knowledge(tenant_id: str = "system"):
    """
    Script to read .md files from knowledge directory and push to Vector DB with tenant_id tagging.
    """
    knowledge_path = os.path.abspath("../.agent/specs/ai/knowledge/business/")
    print(f"--- Ingesting knowledge for Tenant: {tenant_id} ---")
    print(f"Scanning documents from: {knowledge_path}")
    
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY is not set in .env")
        return

    # 1. Load Markdown Files
    loader = DirectoryLoader(knowledge_path, glob="*.md", loader_cls=UnstructuredMarkdownLoader)
    documents = loader.load()
    
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
        chunk_size=1000,
        chunk_overlap=100,
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
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    # 4. Store in Qdrant
    try:
        # Initialize client to check/create collection first
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        # Create collection if not exists
        collections = client.get_collections()
        collection_names = [c.name for c in collections.collections]
        
        if QDRANT_COLLECTION not in collection_names:
            print(f"Creating new collection: {QDRANT_COLLECTION}")
            client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )

        # Bulk upload
        Qdrant.from_documents(
            final_docs,
            embeddings,
            location=QDRANT_HOST,
            port=QDRANT_PORT,
            collection_name=QDRANT_COLLECTION,
            prefer_grpc=False
        )
        print(f"✅ SUCCESSFULLY ingested {len(final_docs)} chunks into Qdrant collection '{QDRANT_COLLECTION}'.")
        
    except Exception as e:
        print(f"❌ ERROR connecting to Qdrant or Ingesting: {e}")

if __name__ == "__main__":
    # Default ingestion for system-wide knowledge base
    ingest_knowledge(tenant_id="system")
