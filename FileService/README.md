# File Service

**FileService** là một microservice độc lập chịu trách nhiệm quản lý việc lưu trữ, tải lên và tải về các tệp tin trong hệ thống, tích hợp với **MinIO** (S3-compatible storage).

---

## 🏗 Vị trí trong Hệ thống

```text
┌────────────────────────┐         ┌────────────────────────┐
│ Trình duyệt (Người dùng)│  HTTP   │ Next.js Server (Proxy) │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│                   Gateway Service (YARP)                  │
└──────────────────────────────────────────────┬────────────┘
                                               │ /files/**
                                               ▼
                                     ┌──────────────────┐
                                     │  File Service    │
                                     │  (Upload/Download)│
                                     └────────┬─────────┘
                                              │ S3 API
                                              ▼
                                     ┌──────────────────┐
                                     │      Minio       │
                                     │ (File Storage)   │
                                     └──────────────────┘
```

---

## 📁 Cấu trúc Tenant & Files

Hệ thống sử dụng cơ chế **Multi-tenant isolation** ở mức Storage:
- Mỗi **Tenant** sẽ có một **Bucket** riêng biệt với tên định dạng: `tenant-{tenantId}` (ví dụ: `tenant-admin`, `tenant-apple`).
- Dữ liệu bên trong bucket được tổ chức theo folder: `avatars/`, `documents/`, `logos/`, v.v.

---

## 🚀 Các API chính

Tất cả các request đều yêu cầu Header: `X-Tenant-Id`.

### 1. Upload File
- **Endpoint**: `POST /api/files/{folder}/upload`
- **Folder**: `avatars`, `documents`, `logos`, `reports`, `attachments`.
- **Body**: `multipart/form-data` (file).
- **Phản hồi**: Trả về `FileUploadResult` chứa URL tải về và thông tin file.

### 2. Lấy URL download (Presigned URL)
- **Endpoint**: `GET /api/files/{folder}/{fileName}/url?expiryMinutes=60`
- **Mô tả**: Trả về một URL có thời hạn (mặc định 60p) để truy cập file trực tiếp từ MinIO.

### 3. Liệt kê file
- **Endpoint**: `GET /api/files/{folder}`
- **Phản hồi**: Danh sách các `object keys` trong folder của tenant.

### 4. Xóa file
- **Endpoint**: `DELETE /api/files/{folder}/{fileName}`

---

## ⚙️ Cấu hình (Environment Variables)

- `MinIO__Endpoint`: Địa chỉ server MinIO (mặc định `minio:9000`).
- `MinIO__AccessKey`: Root user của MinIO.
- `MinIO__SecretKey`: Root password của MinIO.
- `MaxFileSizeBytes`: Kích thước file tối đa cho phép (mặc định 50MB).
- `AllowedExtensions`: Danh sách định dạng tệp cho phép.

---

## 🐳 Chạy với Docker

Dịch vụ được tích hợp sẵn trong `docker-compose.yml`. Để build và chạy riêng:

```bash
docker compose up -d --build file-service minio
```
