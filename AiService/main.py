import os
import json
import asyncio
import httpx
import warnings
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request

# Suppress Qdrant insecure API Key warning (used in local/Docker network)
warnings.filterwarnings("ignore", message=".*insecure connection.*")
from pydantic import BaseModel
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.globals import set_llm_cache
from langchain_community.cache import RedisSemanticCache
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain_cohere import CohereRerank
from qdrant_client import QdrantClient
import redis

# Try to load env from current folder, then parent
if not load_dotenv():
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

app = FastAPI(title="Business AI Notebook Backend")

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "business_knowledge")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Governance Config
ADMIN_SERVICE_URL = os.getenv("ADMIN_SERVICE_INTERNAL_URL", "http://admin-service:8080")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "default_ai_secret_123")

# Initialize models
if GOOGLE_API_KEY:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=GOOGLE_API_KEY)
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.1, google_api_key=GOOGLE_API_KEY)
    
    try:
        set_llm_cache(RedisSemanticCache(redis_url=REDIS_URL, embedding=embeddings))
        print(f"✅ Semantic Cache initialized with Redis")
    except Exception as e:
        print(f"⚠️ Failed to initialize Redis cache: {e}")
else:
    print("⚠️ WARNING: GOOGLE_API_KEY is not set.")

# Security Guardrail Prompt
BUSINESS_PROMPT_TEMPLATE = """Bạn là chuyên gia về quy trình nghiệp vụ ERP (Business Process Specialist).
Tài liệu của bạn chỉ bao gồm các quy trình kinh doanh, hướng dẫn nghiệp vụ và chính sách công ty.

QUY TẮC BẢO MẬT TUYỆT ĐỐI:
1. Bạn CHỈ được phép trả lời dựa trên thông tin nghiệp vụ được cung cấp trong Context dưới đây.
2. Nếu câu hỏi liên quan đến: Cấu trúc Database, API Endpoint, Code Backend (.NET/Python), Kiến trúc hệ thống, hoặc bất kỳ thông tin kỹ thuật nào khác -> Hãy lịch sự từ chối: "Xin lỗi, tôi là trợ lý nghiệp vụ và không có thẩm quyền truy cập hoặc cung cấp thông tin kỹ thuật của hệ thống."
3. Nếu câu hỏi không có trong Context -> Hãy nói: "Dựa trên tài liệu nghiệp vụ hiện có, tôi chưa tìm thấy thông tin cụ thể về vấn đề này."
4. KHÔNG bao giờ bịa đặt thông tin kỹ thuật.

CONTEXT:
{context}

CÂU HỎI: {question}
TRẢ LỜI (Tiếng Việt):"""

BUSINESS_PROMPT = PromptTemplate(
    template=BUSINESS_PROMPT_TEMPLATE, 
    input_variables=["context", "question"]
)

class ChatRequest(BaseModel):
    message: str
    tenant_id: str
    user_id: Optional[str] = None
    chat_history: Optional[List[dict]] = []

from ingest import ingest_knowledge, get_knowledge_documents

class FeedbackRequest(BaseModel):
    message_id: Optional[str] = None
    rating: int  # 1 for up, -1 for down
    comment: Optional[str] = None
    tenant_id: str

async def check_ai_quota(tenant_id: str) -> bool:
    """Check if tenant is blocked from using AI services."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{ADMIN_SERVICE_URL}/api/AiGovernance/check-status/{tenant_id}",
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json().get("isBlocked", False)
    except Exception as e:
        print(f"⚠️ Quota check failed: {e}")
    return False

async def log_ai_usage(tenant_id: str, user_id: Optional[str], prompt_tokens: int, completion_tokens: int, model: str):
    """Send usage logs to AdministrationService."""
    total_tokens = prompt_tokens + completion_tokens
    # Gemini 1.5 Pro pricing (estimate)
    input_cost = (prompt_tokens / 1_000_000) * 3.5
    output_cost = (completion_tokens / 1_000_000) * 10.5
    estimated_cost = round(input_cost + output_cost, 6)

    payload = {
        "tenantId": tenant_id,
        "userId": user_id,
        "modelName": model,
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens,
        "totalTokens": total_tokens,
        "estimatedCostUsd": estimated_cost,
        "timestamp": None 
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{ADMIN_SERVICE_URL}/api/AiGovernance/log",
                json=payload,
                headers={"X-Internal-Secret": INTERNAL_API_SECRET},
                timeout=5.0
            )
    except Exception as e:
        print(f"❌ Failed to log usage to backend: {e}")

@app.get("/")
def read_root():
    return {"status": "AI Service is running", "provider": "Google Gemini 1.5 Pro"}

@app.post("/ingest")
async def trigger_ingest(tenant_id: str = "system"):
    try:
        ingest_knowledge(tenant_id=tenant_id)
        r = redis.from_url(REDIS_URL)
        r.flushdb()
        return {"status": "success", "message": f"Knowledge ingestion completed for tenant: {tenant_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def log_feedback(request: FeedbackRequest):
    print(f"--- Feedback Received ---")
    print(f"Tenant: {request.tenant_id}, Rating: {request.rating}")
    return {"status": "success", "message": "Feedback recorded"}

@app.post("/chat")
async def chat(request: ChatRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key is not configured.")

    # 1. Quota Check (Hard Limit)
    is_blocked = await check_ai_quota(request.tenant_id)
    if is_blocked:
        raise HTTPException(
            status_code=403, 
            detail="Tài khoản của bạn đã hết hạn mức sử dụng AI trong tháng này. Vui lòng liên hệ quản trị viên."
        )

    try:
        client = QdrantClient(url=f"http://{QDRANT_HOST}:{QDRANT_PORT}", api_key=QDRANT_API_KEY)
        vector_store = QdrantVectorStore(
            client=client,
            collection_name=QDRANT_COLLECTION,
            embedding=embeddings
        )

        vector_retriever = vector_store.as_retriever(
            search_kwargs={"filter": {"tenant_id": request.tenant_id}, "k": 10}
        )
        
        final_retriever = vector_retriever
        if COHERE_API_KEY:
            try:
                compressor = CohereRerank(cohere_api_key=COHERE_API_KEY, top_n=3)
                final_retriever = ContextualCompressionRetriever(
                    base_compressor=compressor, 
                    base_retriever=vector_retriever
                )
            except Exception: pass
        
        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=final_retriever,
            combine_docs_chain_kwargs={"prompt": BUSINESS_PROMPT},
            return_source_documents=True
        )

        # Execute
        result = await chain.ainvoke({
            "question": request.message,
            "chat_history": []
        })

        # Token usage extraction placeholder
        # TODO: Implement proper usage extraction from LLM result metadata
        prompt_tokens = len(request.message) // 3 + 200
        completion_tokens = len(result["answer"]) // 3

        # Log usage async
        asyncio.create_task(log_ai_usage(
            request.tenant_id, 
            request.user_id, 
            prompt_tokens, 
            completion_tokens, 
            "gemini-1.5-pro"
        ))

        return {
            "answer": result["answer"],
            "sources": [doc.metadata.get("source", "unknown") for doc in result["source_documents"]],
            "tenant_context": request.tenant_id
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
