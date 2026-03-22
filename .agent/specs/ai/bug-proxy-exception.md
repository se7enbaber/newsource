# [BUG] AI Proxy Exception

> Ngày phát hiện: 2026-03-22
> Trạng thái: Fixed (2026-03-22)
> Module: Next.js API Routes (AI)

## 📋 Mô tả
Lỗi `Proxy Exception` xảy ra khi người dùng gửi tin nhắn hoặc yêu cầu ingest dữ liệu AI trong môi trường phát triển (Next.js chạy ngoài Docker).

## 🔍 Phân tích nguyên nhân
- **Hostname Resolution**: Docker container name `ai-service` không thể phân giải được từ môi trường Windows host khi chạy Next.js bằng `npm run dev`.
- **Thiếu Configuration**: Biến môi trường `AI_SERVICE_URL` chưa được định nghĩa trong `.env.local`.
- **Sự không đồng nhất**: Có hai biến khác nhau cho cùng một mục đích (`AI_SERVICE_URL` và `AI_SERVICE_BASE_URL`).

## ✅ Giải pháp đề xuất
1. Hợp nhất thành 1 biến duy nhất: `AI_SERVICE_BASE_URL`.
2. Cập nhật `my-nextjs/.env.local` với giá trị `http://localhost:8001`.
3. Sửa code trong `chat/route.ts` và `ingest/route.ts` để sử dụng biến chung này.

## ✅ Checklist
- [x] Tạo branch: `fix/ai-proxy-exception`
- [x] Cập nhật `.env.local`
- [x] Sửa `my-nextjs/app/api/ai/chat/route.ts`
- [x] Sửa `my-nextjs/app/api/ai/ingest/route.ts` (unify consistency)
- [x] Cập nhật `docker-compose.yml` for consistency
- [x] Verify fix bằng cách gửi tin nhắn thực tế
- [ ] Cập nhật trạng thái "Fixed" vào spec và đồng bộ Notion
