import os
import json
import asyncio
import httpx
import warnings
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional

# Suppress warnings
warnings.filterwarnings("ignore", message=".*insecure connection.*")

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Load environment
if not load_dotenv():
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="MintERP Business AI Notebook")

# Config
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "qdrant_key_123")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "business_knowledge_fixed")
ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_INTERNAL_URL", "http://localhost:7038")

# Global models
embeddings = None
llm = None

# Initialize LLM
if GOOGLE_API_KEY:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=GOOGLE_API_KEY)
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1, google_api_key=GOOGLE_API_KEY)
else:
    print("❌ GOOGLE_API_KEY NOT SET")

# Simple Ingest/Doc loader logic
def get_knowledge_documents():
    # Relative to AiService folder
    knowledge_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.agent/specs/ai/knowledge/business/"))
    docs = []
    if os.path.exists(knowledge_path):
        for filename in os.listdir(knowledge_path):
            if filename.endswith(".md"):
                with open(os.path.join(knowledge_path, filename), "r", encoding="utf-8") as f:
                    docs.append({"content": f.read(), "source": filename})
    return docs

class ChatRequest(BaseModel):
    message: str
    tenant_id: str
    user_id: Optional[str] = None
    chat_history: Optional[List[dict]] = []

@app.get("/")
def home():
    return {"status": "running", "model": "gemini-2.5-flash"}

@app.post("/chat")
async def chat(request: ChatRequest):
    print(f"--- Chat Request: {request.message} (Tenant: {request.tenant_id}) ---")
    
    # 1. Retrieval
    context_chunks = []
    is_fallback = False
    
    # Use global embeddings initialized at start
    global embeddings
    if not embeddings:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=GOOGLE_API_KEY)

    try:
        # Try Qdrant first
        client = QdrantClient(url=f"http://{QDRANT_HOST}:{QDRANT_PORT}", api_key=QDRANT_API_KEY, timeout=2.0)
        client.get_collections()
        
        search_result = client.search(
            collection_name=QDRANT_COLLECTION,
            query_filter=models.Filter(must=[
                models.FieldCondition(key="metadata.tenant_id", match=models.MatchValue(value=request.tenant_id))
            ]),
            query_vector=embeddings.embed_query(request.message),
            limit=5
        )
        context_chunks = [{"content": r.payload.get("page_content", ""), "source": r.payload.get("source", "unknown")} for r in search_result]
        
    except Exception as q_err:
        print(f"⚠️ Qdrant unreachable: {q_err}. Using File Fallback.")
        is_fallback = True
        all_docs = get_knowledge_documents()
        # Simple keyword matching for local fallback
        keywords = request.message.lower().split()
        for doc in all_docs:
            score = sum(1 for kw in keywords if kw in doc["content"].lower())
            if score > 0:
                context_chunks.append(doc)
        context_chunks = context_chunks[:5]

    # 2. Build Context
    if context_chunks:
        context_text = "\n\n".join([f"FILENAME: {c['source']}\nCONTENT: {c['content']}" for c in context_chunks])
    else:
        context_text = "Không tìm thấy tài liệu nghiệp vụ nào liên quan đến câu hỏi này."

    # 3. System Prompt (Strict)
    full_prompt = f"""Bạn là trợ lý nghiệp vụ ERP chuyên dụng cho hệ thống MintERP. 
Nhiệm vụ: Trả lời câu hỏi nghiệp vụ dựa trên CONTEXT được cung cấp.

QUY TẮC CỐ ĐỊNH:
1. KHÔNG được tự giới thiệu là AI hay chuyên gia ở đầu hay cuối câu trả lời. Hãy đi thẳng vào nội dung.
2. KHÔNG chào hỏi lặp lại.
3. Nếu CONTEXT không có thông tin -> Trả lời: "Dựa trên tri thức hệ thống, tôi chưa thể trả lời vấn đề này."
4. Tuyệt đối KHÔNG trả lời về lập trình, database, API.

CONTEXT:
{context_text}

CÂU HỎI USER: {request.message}
TRẢ LỜI NGẮN GỌN (TIẾNG VIỆT):"""

    # 4. LLM Call
    try:
        response = await llm.ainvoke(full_prompt)
        print(f"--- Reply Generated ---")
        return {
            "answer": response.content,
            "sources": list(set([c["source"] for c in context_chunks])),
            "is_fallback": is_fallback
        }
    except Exception as e:
        print(f"❌ LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
