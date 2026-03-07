# Dịch vụ SignalR (SignalRService)

## 🏗 Tổng quan Kiến trúc

**SignalRService** đóng vai trò là một microservice chuyên biệt đảm nhiệm việc phát (broadcast) dữ liệu thời gian thực (real-time) thông qua WebSocket.

Thay vì để API chính (AdministrationService) phải duy trì và xử lý hàng nghìn kết nối WebSocket chiếm nhiều tài nguyên, toàn bộ hệ thống Push Notification (Thông báo đẩy) đã được tách rời hoàn toàn về đây, giúp giảm tải (load decoupling) và tăng tính bền bỉ (durability) cho toàn bộ hệ thống.

`	ext
┌─────────────────────────┐          ┌──────────────────────────┐
│ Trình duyệt (Người dùng) │ Websocket│ SignalR Service          │
│ Next.js Client           ├─────────►│ Cổng NotificationHub     │
└─────────────────────────┘          └───────────▲──────────────┘
                                                 │
                                                 │ REST API (POST)
                           ┌─────────────────────┴─────────────┐
                           │ Administration Service (Backend)  │
                           │   - Các Logic Nghiệp vụ           │
                           │   - Hangfire Background Jobs      │
                           └───────────────────────────────────┘
`

### Cơ chế hoạt động cốt lõi
*   **WebSockets qua SignalR**: Các client (thông qua Gateway hoặc trực tiếp từ Next.js UI) sẽ kết nối và duy trì kết nối hai chiều gốc (duplex connection) vào các Hub như /notificationHub.
*   **Tách biệt nguồn phát**: Các thao tác nghiệp vụ cốt lõi xảy ra tại một microservice khác (VD: AdministrationService). Các microservice gốc này **không chịu trách nhiệm** trực tiếp quản lý các kết nối WebSocket.

---

## 🚀 Tích hợp và Tương tác & Gợi ý cho Hangfire

Để yêu cầu SignalRService truyền thông báo đi toàn hệ thống hay cho một client cụ thể, các microservice gốc sẽ phát ra chỉ thị (directive payload) qua REST API HTTP hoặc gRPC qua mạng nội bộ.

#### Ví dụ Thực tế: Cách Hangfire sử dụng hệ thống SignalR này sau này
1. **Xử lý nền (Background Process)**: Hangfire chạy bên trong AdministrationService, liên tục thực thi các Job nặng và phức tạp (VD: chạy TenantMigrations).
2. **Ngăn chặn Broadcast cục bộ**: Thay vì gọi trực tiếp SignalR _hubContext.Clients qua Dependency Injection theo cách truyền thống, Hangfire job sẽ sử dụng một **client ngoại vi** (Ví dụ như thiết lập một ISignalRService có vai trò như HTTP Wrapper).
3. **Phân phối qua HTTP**: Lệnh SendNotificationAsync sẽ gửi một HTTP POST /api/notifications HTTP Request một cách âm thầm sang địa chỉ mạng nội bộ của SignalRService.
4. **Đẩy sang WebSocket (WebSocket Push)**: SignalRService sẽ tiếp nhận HTTP POST này từ mạng nội bộ một cách an toàn, rồi thực hiện phát (broadcast) thông điệp lên WebSocket qua _hubContext.Clients.All.SendAsync(...) tới tất cả Frontend Next.js đang lắng nghe.

---

### Khởi chạy môi trường Phát triển (Local)
Khi bạn lập trình tại máy cá nhân, chỉ cần sử dụng script start-terminals.cmd. Service này sẽ được khởi động song song với AdministrationService, GatewayService và Next.js. Hãy đảm bảo các port (ví dụ: 5063 hoặc 7251) không bị xung đột với Gateway chuyển tiếp (YARP port 5000).