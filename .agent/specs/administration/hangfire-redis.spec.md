---
feature: Hangfire Redis Storage
module: AdministrationService
status: active
updated: 2026-03-15
---

# Hangfire Redis Storage Integration

## Mô tả
Chuyển đổi lưu trữ dữ liệu của Hangfire từ PostgreSQL sang Redis để tối ưu hóa hiệu năng và tách biệt resource xử lý job ngầm.

## Flow chính
1. `AdministrationService` khởi tạo một `ConnectionMultiplexer` kết nối tới Redis (dựa trên cấu hình trong `docker-compose.yml`).
2. Hangfire được cấu hình sử dụng `UseRedisStorage` với prefix `hangfire:`.
3. Nếu Redis không khả dụng, hệ thống tự động fallback về PostgreSQL để đảm bảo tính sẵn sàng (áp dụng trong môi trường dev).

## Acceptance Criteria
- [ ] Hangfire dashboard truy cập bình thường tại `/hangfire`.
- [ ] Các job ngầm (Migrations, DbSeeder) được lưu trữ và quản lý trong Redis (Database 0, Prefix hangfire:).
- [ ] Không gây xung đột với Redis Distributed Cache (sử dụng cùng ConnectionMultiplexer).

## Cấu hình (Environment)
- `REDIS_HOST`: redis
- `REDIS_PORT`: 6379
- `REDIS_PASSWORD`: (theo .env)

## Known Issues / Guardrails
- **Abstract/interface job types**: Không enqueue/schedule job bằng type `interface`/`abstract` trừ khi type đó đã được đăng ký DI. Xem: [bug-hangfire-abstract-job.spec.md](./bug-hangfire-abstract-job.spec.md).
