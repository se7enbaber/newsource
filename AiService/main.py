import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from qdrant_client import QdrantClient

# Load env
load_dotenv()

app = FastAPI(title="Business AI Notebook Backend")

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "business_knowledge")

# Initialize models
if GOOGLE_API_KEY:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.1)
else:
    print("⚠️ WARNING: GOOGLE_API_KEY is not set. Services will fail.")

# Security Guardrail Prompt
BUSINESS_PROMPT_TEMPLATE = """Bạn là chuyên gia về quy trình nghiệp vụ ERP (Business Process Specialist).
Tài liệu của bạn chỉ bao gồm các quy trình kinh doanh, hướng dẫn nghiệp vụ và chính sách công ty.

QUY TẮC BẢO MẬT TUYỆT ĐỐI:
1. Bạn CHỈ được phép trả lời dựa trên thông tin nghiệp vụ được cung cấp trong Context dưới đây.
2. Nếu câu hỏi liên quan đến: Cấu trúc Database, API Endpoint, Code Backend (.NET/Python), Kiến trúc hệ thống, hoặc bất kỳ thông tin kỹ thuật nào khác -> Hãy lịch sự từ chối: "Xin lỗi, tôi là trợ lý nghiệp vụ và không có thẩm quyền truy cập hoặc cung cấp thông tin kỹ thuật của hệ thống."
3. Nếu câu hỏi không có trong Context -> Hãy nói: "Dựa trên tài liệu nghiệp vụ hiện có, tôi chưa tìm thấy thông tin cụ thể về vấn đề này. Tuy nhiên, theo quy trình chung..." và đưa ra gợi ý nghiệp vụ phù hợp.
4. KHÔNG bao giờ bịa đặt thông tin kỹ thuật (Hallucination).

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
    chat_history: Optional[List[dict]] = []

from ingest import ingest_knowledge

class FeedbackRequest(BaseModel):
    message_id: Optional[str] = None
    rating: int  # 1 for up, -1 for down
    comment: Optional[str] = None
    tenant_id: str

@app.get("/")
def read_root():
    return {"status": "AI Service is running", "provider": "Google Gemini 1.5 Pro"}

@app.post("/ingest")
async def trigger_ingest(tenant_id: str = "system"):
    """
    Trigger manual re-ingestion of knowledge base documents.
    """
    try:
        ingest_knowledge(tenant_id=tenant_id)
        return {"status": "success", "message": f"Knowledge ingestion completed for tenant: {tenant_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/feedback")
async def log_feedback(request: FeedbackRequest):
    """
    Log user feedback for AI answers.
    In a real app, this would save to a database.
    """
    print(f"--- Feedback Received ---")
    print(f"Tenant: {request.tenant_id}")
    print(f"Rating: {request.rating}")
    print(f"Comment: {request.comment}")
    # TODO: Save to SQL Database (e.g. Postgres)
    return {"status": "success", "message": "Feedback recorded"}

@app.post("/chat")
async def chat(request: ChatRequest):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key is not configured.")

    try:
        # 1. Connect to Vector DB
        client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        # 2. Setup Vector Store with Metadata Filter for Tenant
        vector_store = Qdrant(
            client=client,
            collection_name=QDRANT_COLLECTION,
            embeddings=embeddings
        )

        # Multi-tenant isolation filter
        # Only retrieve documents that match the request's tenant_id (or are global/system)
        retriever = vector_store.as_retriever(
            search_kwargs={
                "filter": {"tenant_id": request.tenant_id}
            }
        )

        # 3. Build RAG Chain
        chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            combine_docs_chain_kwargs={"prompt": BUSINESS_PROMPT},
            return_source_documents=True
        )

        # 4. Execute
        # Format history for LangChain
        chat_history = []
        for msg in request.chat_history:
            chat_history.append((msg.get("role") == "user" and "human" or "ai", msg.get("content")))

        result = chain.invoke({
            "question": request.message,
            "chat_history": [] # For simplicity in this step, keeping it stateless per request or manually managed
        })

        return {
            "answer": result["answer"],
            "sources": [doc.metadata.get("source", "unknown") for doc in result["source_documents"]],
            "tenant_context": request.tenant_id
        }

    except Exception as e:
        print(f"❌ Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
