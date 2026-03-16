---
feature: "[TEST] Hangfire abstract/interface job activation"
module: AdministrationService
status: manual
updated: 2026-03-15
---

# [TEST] Hangfire abstract/interface job activation

## Mục tiêu
- Đảm bảo Hangfire không còn throw `Instances of abstract classes cannot be created` khi job type là `interface` nhưng đã được đăng ký DI.
- Khi gặp interface/abstract type chưa đăng ký DI, log/error phải chỉ rõ job type để xử lý (xóa/requeue hoặc đăng ký mapping).

## Preconditions
- `AdministrationService` chạy với Hangfire dashboard tại `/hangfire`.
- DI có mapping: `ITenantMigrationJob -> TenantMigrationJob` (xem `AdministrationService/Extensions/DependencyInjection.cs`).

## Test cases

### TC1 — Job đã lưu bằng interface type vẫn chạy được
1. Bảo đảm trong Hangfire storage có job với type `AdministrationService.Services.ITenantMigrationJob` (tình huống thực tế: job được enqueue từ phiên bản cũ).
2. Start `AdministrationService`.
3. Quan sát worker xử lý job.

**Expected**
- Job resolve được từ DI và chạy bình thường.
- Không xuất hiện lỗi `Instances of abstract classes cannot be created`.

### TC2 — Interface/abstract type không có DI mapping phải fail rõ ràng
1. Tạo một job type là `interface`/`abstract` (hoặc giả lập bằng job cũ trong storage) nhưng không đăng ký DI mapping.
2. Start `AdministrationService` để worker thực thi.

**Expected**
- Job fail với message dạng: “job type 'X' is abstract/interface and is not registered in DI…”.
- Sau đó có thể xử lý bằng cách đăng ký DI hoặc xóa/requeue job.

