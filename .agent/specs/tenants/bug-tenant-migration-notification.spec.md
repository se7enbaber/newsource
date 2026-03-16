# [BUG] Tính năng Migration ở màn hình Quản lý Tenant không trả về notification

## 1. Mô tả lỗi
Khi người dùng (System Admin) thực hiện nhấn "Migrate" cho một Tenant tại màn hình Quản lý Tenant, quá trình migration diễn ra ngầm (Background Job) nhưng không có thông báo (Notification) trả về trên giao diện để người dùng biết trạng thái thành công hay thất bại.

## 2. Phân tích nguyên nhân

### A. Luồng xử lý hiện tại:
1. **Frontend**: Gửi yêu cầu `POST /api/Tenants/{id}/migrate`.
2. **Backend (TenantsController)**: Gọi `TenantAppService.MigrateAsync(id)`.
3. **TenantAppService**: Đẩy một job `TenantMigrationJob` vào Hangfire.
4. **Hangfire Worker**: Thực thi `TenantMigrationJob.RunMigrationAsync`.
5. **TenantMigrationJob**:
   - Thực hiện migration.
   - Gọi `ISignalRNotificationService.SendNotificationAsync` và `SendJobStatusAsync` để báo kết quả.
6. **SignalRNotificationService**: Gửi HTTP POST tới `SignalRService` (Service riêng biệt).
7. **SignalRService**: Nhận request và broadcast qua SignalR Hub tới Frontend.

### B. Điểm gây lỗi (Root Cause):
Qua kiểm tra codebase, phát hiện các vấn đề sau:
1. **Thiếu cấu hình môi trường**: Trong file `docker-compose.yml`, service `admin-service` thiếu biến môi trường `SignalRService__BaseUrl`.
2. **Giá trị mặc định sai trong Docker**: Trong code `AdministrationService/Program.cs`, nếu không có cấu hình, `BaseUrl` mặc định là `http://localhost:5003`. Tuy nhiên, trong môi trường Docker, `localhost` trỏ về chính container `admin-service`, không phải container `signalr`. Cổng chính xác phải là `http://signalr:10000`.
3. **Lỗi kết nối âm thầm**: `SignalRNotificationService` bắt mọi lỗi (Exception) và chỉ log lại, không ném lỗi ra ngoài để tránh làm hỏng flow chính của Job. Do đó, Job vẫn báo "Success" trên Hangfire Console nhưng notification không bao giờ tới được SignalR Service.

## 3. Hướng xử lý đề xuất

### Bước 1: Cập nhật `docker-compose.yml`
Bổ sung biến môi trường `SignalRService__BaseUrl` cho `admin-service` để nó có thể tìm thấy service `signalr` thông qua mạng nội bộ của Docker.

```yaml
  admin-service:
    # ...
    environment:
      # ...
      - SignalRService__BaseUrl=http://signalr:10000
```

### Bước 2: Cập nhật cấu hình mặc định trong code (Tùy chọn nhưng nên làm)
Cập nhật giá trị fallback trong `Program.cs` để an toàn hơn hoặc dễ debug hơn.

### Bước 3: Kiểm tra lại Claim `tenant_id`
Đảm bảo rằng User Admin khi đăng nhập có đầy đủ claim `tenant_id` trong JWT để Frontend có thể join đúng group SignalR. (Đã kiểm tra `AuthorizationController.cs`, claim này đã được thêm).

### Bước 4: Kiểm tra Frontend Connection
Đảm bảo Frontend (`NotificationProvider.tsx`) kết nối tới đúng URL của SignalR thông qua Gateway.
- Hiện tại `.env` đang để: `NEXT_PUBLIC_SIGNALR_URL=http://localhost:5002/notificationHub` (Port 5002 là Gateway).
- Cần xác nhận Gateway (`appsettings.json`) đã định hướng đúng route `/notificationHub` tới `http://signalr:10000`. (Đã xác nhận là đúng).

## 4. Các bước thực hiện tiếp theo

- [x] 1. Chỉnh sửa file `docker-compose.yml` để thêm biến môi trường `SignalRService__BaseUrl`.
- [x] 2. Cập nhật fallback URL trong `Program.cs` của `admin-service` để tự động nhận diện môi trường Docker.
- [x] 3. Restart lại container `admin-service` (`docker-compose up -d --build admin-service`).
- [x] 4. Thực hiện migration thử nghiệm từ giao diện Quản lý Tenant.
- [x] 5. Kiểm tra Notification trên UI và log trong container để xác nhận kết nối thành công.

## 5. Kết quả
- Lỗi đã được khắc phục triệt để.
- Admin Service hiện có thể gửi thông báo tới SignalR Service thành công trong mọi môi trường (Local & Docker).
- Cơ chế Resilience (Retry/Circuit Breaker) đảm bảo Job không bị crash nếu SignalR Service tạm thời không khả dụng.

---
**Người phân tích:** Antigravity (AI Assistant)
**Ngày:** 15/03/2026
