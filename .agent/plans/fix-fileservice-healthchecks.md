# Plan: Fix FileService HealthChecks Missing Services

## Task 1: Add HealthChecks Registration
**File**: `d:\App\Project\FileService\Program.cs`

1. Thêm `builder.Services.AddCommonHealthChecks("FileService");` vào phần đăng ký services.
2. Đặt nó gần các đăng ký service khác để dễ quản lý.

## Task 2: Verification
1. Build `FileService` để kiểm tra lỗi cú pháp.
2. (Nếu có thể) Chạy service và check endpoint `/health`.

## Task 3: Cleanup
1. Cập nhật trạng thái trong `d:\App\Project\.agent\specs\fileservice\bug-healthchecks-missing.md`.
2. Xóa các file log tạm nếu có.
