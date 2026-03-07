# Dự án AppProject (ERP Microservices)

Đây là hệ thống ERP xây dựng theo kiến trúc Microservices với khả năng Multi-tenant mạnh mẽ.

## 🏗 Tổng quan Kiến trúc

Tài liệu chi tiết về kiến trúc hệ thống và luồng dữ liệu xem tại: [Readme_Project.md](./Markdown/Readme_Project.md)

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

Xem chi tiết hướng dẫn cài đặt và vận hành tại [README_Project.md](./Markdown/Readme_Project.md).
