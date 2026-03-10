---
feature: Real-time SignalR
module: SignalRService
status: stable
updated: 2026-03-10
---

# WebSocket Real-time Notification

## Mô tả
Service chuyên biệt phát (broadcast) dữ liệu thời gian thực thông qua WebSocket, giúp tách biệt resource xử lý HTTP và WebSockets cho hệ thống.

## Flow chính
Next.js Client → Mở kết nối WebSocket tới Gateway `/notificationHub` → Định tuyến tới `SignalRService` (port 5200).
Khi Backend (AdministrationService) muốn gửi thông báo → Gửi HTTP POST trực tiếp tới REST API của SignalRService → SignalRService broadcast message qua SignalR Client → Nếu có scale nhiều instance, Redis backplane sẽ tự động đồng bộ.

## Acceptance Criteria
- [ ] Cho phép Client kết nối WebSockets ở endpoint `/notificationHub`
- [ ] SignalRService nhận publish HTTP POST từ nội bộ và push realtime cho tất cả/specific client
- [ ] Đồng bộ nhiều node SignalRService qua StackExchange.Redis Backplane

## API
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| HTTP GET/WS | `/notificationHub` | Endpoint SignalR cho client |
| HTTP POST | `/api/notifications` | REST API nội bộ nhận thông điệp để push |

## Liên quan
- Tích hợp Hangfire Job Progress / Tenant Migration status update.
