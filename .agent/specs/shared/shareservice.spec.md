---
feature: Shared Infrastructure
module: ShareService
status: stable
updated: 2026-03-10
---

# Share Service (Common Base)

## Mô tả
Class Library chứa các thành phần dùng chung: Base Entities, Extension configs (Serilog, HealthChecks, CORS, Swagger), Repository & Service base logic cho toàn hệ thống để tiết kiệm mã nguồn lặp lại.

## Flow chính
ShareService không có routing độc lập. Các file build thành thư viện `.dll` xuất và lưu sẵn vào thư mục `commondll/`. AdministrationService, GatewayService, SignalRService sau đó tham chiếu tập tin .dll chạy chức năng thay vì phải sửa source.

## Acceptance Criteria
- [ ] Cung cấp System Repository (BaseRepository) tự động áp dụng vòng lặp MultiTenant Query Filters.
- [ ] Cung cấp Service (BaseService) tự động chèn TenantId.
- [ ] Tự xuất target build ra thư mục `/commondll`.
- [ ] Bọc gọn logic gọi Extension method DI trong `Program.cs` cấu hình Logging / CORS.

## Liên quan
- Skill: [Backend Architecture Layer](../../skills/erp-architecture-layer/SKILL.md)
