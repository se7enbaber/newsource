# Hướng dẫn Bảo trì & Cập nhật Tri thức AI (Phase 4)

Tài liệu này hướng dẫn cách duy trì hệ thống Business AI Notebook luôn cập nhật thông tin nghiệp vụ mới nhất từ dự án.

## 1. Quy trình Cập nhật Tri thức

Khi có một tính năng mới hoặc màn hình mới được phát triển (đặc biệt là sau khi hoàn thành phần giao diện), hãy thực hiện các bước sau:

### Bước A: Tạo tài liệu mô tả nghiệp vụ
Tạo một file `.md` mới trong thư mục `.agent/specs/ai/knowledge/business/`.
File này nên tập trung vào **Logic nghiệp vụ** từ góc nhìn người dùng, không phải chi tiết kỹ thuật (code/database).

**Cấu trúc khuyến nghị:**
```markdown
# [Tên tính năng]
## 1. Mục tiêu
Mô tả ngắn gọn tính năng này dùng để làm gì.
## 2. Quy trình thực hiện
Các bước người dùng cần làm.
## 3. Các quy định và ràng buộc
Các quy tắc (Validation, Business Rules) cần tuân thủ.
```

### Bước B: Nạp tri thức vào Vector DB (Ingestion)
Sau khi thêm file markdown, bạn cần nạp chúng vào cơ sở dữ liệu vector để AI có thể "đọc" được.

**Cách thực hiện:**
1. Đảm bảo container `qdrant` và `ai-service` đang chạy.
2. Chạy lệnh nạp dữ liệu từ bên trong container `ai-service`:
```bash
docker exec -it erp-ai-service python ingest.py
```
*Script sẽ tự động quét thư mục `.agent/specs/ai/knowledge/business/` và nạp những nội dung mới.*

## 2. Tinh chỉnh AI Assistant (Fine-tuning Prompt)

Nếu bạn thấy AI trả lời quá dài dòng hoặc không đúng trọng tâm, bạn có thể điều chỉnh **System Prompt** tại:
`AiService/main.py` -> Biến `RAG_SYSTEM_PROMPT`.

## 3. Quản lý Multi-tenancy
Lưu ý rằng tri thức nạp vào được gắn tag `tenant_id`. 
- Nếu tài liệu là chung cho mọi khách hàng, hãy đảm bảo script `ingest.py` gán một ID chung (như `system` hoặc các ID khách hàng cụ thể).
- Hiện tại, hệ thống hỗ trợ phân tách tri thức chuyên biệt cho từng doanh nghiệp nếu cần.

## 4. Kiểm tra sức khỏe AI
Bạn có thể kiểm tra trạng thái dịch vụ tại:
- AI Service API: `http://localhost:8001/`
- Qdrant Dashboard: `http://localhost:6333/dashboard`
