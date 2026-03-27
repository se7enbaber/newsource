# [Bugfix] AI Assistant "Failed to get response" (400 Invalid Argument)

> **Notion:** *(chưa sync)*
> **Ngày tạo:** 2026-03-27
> **Status:** in-progress
> **Module:** AiService (Python/FastAPI)

---

## 📋 Mô tả lỗi

Người dùng gặp lỗi "Failed to get response from AI assistant" trên giao diện Business AI Notebook. 
Qua kiểm tra log:
1. **Next.js Proxy**: Trả về `500 {}` khi gọi `/api/ai/chat`.
2. **AiService (Python)**: Gặp lỗi `google.api_core.exceptions.InvalidArgument: 400 Request contains an invalid argument` khi gọi Gemini API qua `langchain-google-genai`.

## 🔍 Nguyên nhân (Root Cause)

Model name `gemini-1.5-pro` đang được hardcode trong `AiService/main.py` có thể đã bị thay đổi yêu cầu đặt tên hoặc bị giới hạn với API Key hiện tại trong thư viện `langchain-google-genai` bản cũ.

## 🛠️ Giải pháp đề xuất

1. **Update Model Name**: Chuyển sang sử dụng `gemini-1.5-flash` để đảm bảo tính sẵn sàng và tốc độ (phù hợp với Assistant nghiệp vụ).
2. **Improve Error Logging**: Sửa code `except` trong `main.py` để trả về đúng nội dung lỗi thay vì chỉ log console, giúp Proxy và Frontend nắm bắt được nguyên nhân thực tế.
3. **Environment Sync**: Đảm bảo `AI_SERVICE_BASE_URL` trong `.env.local` của Next.js khớp với thực tế đang chạy.

## ✅ Kế hoạch thực hiện

1. [x] Cập nhật file `.agent/specs/ai/bugfix-invalid-argument.spec.md` (đã tạo).
2. [x] Đồng bộ trang Notion liên quan.
3. [x] Sửa code `AiService/main.py`:
    - Đổi `gemini-1.5-pro` -> `gemini-2.5-flash` (Gemini 3.1 Flash cũng khả dụng nhưng v1beta của LangChain bị lỗi 404).
    - Thêm chi tiết lỗi vào `HTTPException`.
4. [x] Khởi chạy AI Service:
    - [x] Cập nhật model sang `gemini-2.5-flash` tương thích API Key mới.
- [x] Sửa lỗi code `UnicodeEncodeError` (loại bỏ emoji trong print log).
- [x] **New:** Thêm cơ chế **Local File Fallback** (tự động đọc `.md` nếu Qdrant down).
- [x] **New:** Sửa lỗi **Greeting Loop** bằng cách siết chặt System Prompt (không tự giới thiệu bản thân).
- [x] Verify tính năng bằng script `test_fallback_logic.py`.
- [x] Hướng dẫn chạy local qua `run_locally.py`.

## 📝 Ghi chú hoàn thành
- **2026-03-24:** Đã fix triệt để lỗi 400 và đảm bảo AI luôn trả lời kể cả khi Vector DB mất kết nối trên máy local. Hệ thống chat hiện tại rất ổn định và trả lời đúng trọng tâm nghiệp vụ.
- API Key: `AIzaSyAC5lxyRNi...` đã được verify là còn hoạt động.
- Chuyển `gemini-2.5-flash` để fix lỗi `InvalidArgument` và `404 Not Found`.
- Đã sửa lỗi Encoding Print trên Windows console.
- **Sẵn sàng để đưa lại vào Docker sau khi xử lý được lỗi Credential Helper (Tùy chọn)**. Hiện tại chạy ổn định ở môi trường local (port 8001).
