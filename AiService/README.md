# AI Service Documentation

## Overview
Dịch vụ AI hỗ trợ **Business AI Notebook (RAG)**. Sử dụng Python/FastAPI kết hợp với LangChain, Qdrant và Google Gemini 1.5 Pro.

## Technology Stack
- **Framework**: FastAPI
- **Orchestration**: LangChain
- **Vector DB**: Qdrant
- **LLM**: Google Gemini 1.5 Pro
- **Embedding**: Google Gemini Embeddings (`models/embedding-001`)

## Key Features
- **Multi-tenant Isolation**: Mọi vector đều được gán `tenant_id`. AI chỉ truy xuất các đoạn văn bản có `tenant_id` khớp với yêu cầu hoặc thuộc `system`.
- **Security Guardrails**: System Prompt nghiêm ngặt ngăn chặn việc rò rỉ thông tin kỹ thuật (Database schema, API, Code).
- **Markdown Support**: Tối ưu hóa cho việc đọc tài liệu nghiệp vụ định dạng `.md`.

## Setup & Running
1. **API Key**: Cần có `GOOGLE_API_KEY` đặt trong `.env`.
2. **Docker**: `docker-compose up -d ai-service qdrant`
3. **Ingestion**: Để nạp dữ liệu từ thư mục `.agent/knowledge/business/`, chạy:
   ```bash
   python ingest.py
   ```

## Endpoints
- `GET /`: Kiểm tra trạng thái service.
- `POST /chat`: Gửi câu hỏi nghiệp vụ.
  - Body: `{ "message": "...", "tenant_id": "...", "chat_history": [] }`
  - Response: `{ "answer": "...", "sources": [...], "tenant_context": "..." }`

## Project Rules
- **Không code kỹ thuật**: AI service chỉ được phép trả lời các nội dung nghiệp vụ đã có trong tài liệu.
- **Cập nhật tri thức**: Sau khi hoàn thành một màn hình UI, cần cập nhật tài liệu nghiệp vụ vào thư mục `knowledge/business`.
