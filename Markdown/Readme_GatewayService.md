# Gateway Service

**GatewayService** đóng vai trò là Cổng giao tiếp API (API Gateway / Reverse Proxy) đứng giữa Frontend (`my-nextjs`) và Backend (`AdministrationService`).

Công nghệ cốt lõi được sử dụng là **YARP (Yet Another Reverse Proxy)** của Microsoft.

## Tính năng
- **Single Entry Point**: Tất cả các request từ Next.js thay vì gọi rải rác thẳng vào `AdministrationService` (port 7027) sẽ được gọi duy nhất thông qua Gateway (port 5000/5001).
- **CORS Management**: Gateway cấu hình CORS tập trung để cho phép Next.js và các app nội bộ gọi vào.
- **SSL Bypass / Forwarding**: Xử lý mượt mà certificate SSL cho môi trường Localhost (tự động bỏ qua lỗi SSL khi gọi nội bộ xuống `https://localhost:7027`).
- **Active Health Checks**: Gateway liên tục kiểm tra trạng thái của các microservice backend (Administration, SignalR) để đảm bảo không điều hướng request vào các node đang lỗi.
- Tại đây trong tương lai có thể thêm: *Rate Limiting*, *Caching*, *Load Balancing*, hoặc *Internal Firewall*.

## Cấu trúc Route (YARP)
Được cấu hình hoàn toàn linh hoạt trong file `appsettings.json`:
- `/api/**` -> Forward tới `https://localhost:7027/api/**` (Administration Service)
- `/connect/**` -> Forward tới `https://localhost:7027/connect/**` (Dành cho OpenIddict Login/Logout)
- `/notificationHub/**` -> Forward tới `http://localhost:5063/notificationHub` (Dành cho SignalR Websocket Server)

## Cách thiết lập với Frontend (Next.js)
Trong thư mục `my-nextjs`, mở file `.env.local` và trỏ lại URL thay vì gọi trực tiếp vào 7027:

```env
# Sửa từ: BACKEND_URL=https://localhost:7027
# Thành:
BACKEND_URL=https://localhost:5001
```

## Chạy Gateway
```bash
cd Gateway
dotnet run
```
Gateway sẽ bắt đầu lắng nghe ở `http://localhost:5000` và `https://localhost:5001`.
