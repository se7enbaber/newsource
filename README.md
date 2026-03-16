# Dự án AppProject (ERP Microservices)

Đây là hệ thống ERP xây dựng theo kiến trúc Microservices với khả năng Multi-tenant mạnh mẽ.

## 🏗 Tổng quan Kiến trúc

Tài liệu quan trọng nhất cho AI: [GEMINI.md](GEMINI.md) (Xem đầu tiên)
Tài liệu chi tiết về kiến trúc hệ thống và luồng dữ liệu xem tại: [CONTEXT.md](.agent/CONTEXT.md) và danh mục đặc tả tại [INDEX.md](.agent/specs/INDEX.md)

---

## 📁 Cấu trúc Thư mục

| Thư mục | Mô tả |
|---------|-------|
| `AdministrationService` | Backend API Core (.NET 10) |
| `GatewayService` | API Gateway (YARP) |
| `SignalRService` | Real-time Notifications |
| `FileService` | File Storage & MinIO Management |
| `ShareService` | Common Library & DTOs |
| `my-nextjs` | Frontend (Next.js) |

---

## 🚀 Hướng dẫn khởi chạy nhanh

1. Copy `.env.example` thành `.env` và điền thông tin.
2. Build và khởi động bằng Docker:
   ```bash
   docker compose up -d --build
   ```

Xem chi tiết kiến trúc tổng quan tại [CONTEXT.md](.agent/CONTEXT.md) và các đặc tả tại [.agent/specs/INDEX.md](.agent/specs/INDEX.md).
