---
feature: "[BUG] Hangfire abstract/interface job activation"
module: AdministrationService
status: fixed
updated: 2026-03-15
---

# [BUG] Hangfire `Instances of abstract classes cannot be created`

## Triệu chứng

Log trên `AdministrationService` (Hangfire worker):

```
System.InvalidOperationException: Instances of abstract classes cannot be created.
at Microsoft.Extensions.DependencyInjection.ActivatorUtilities.CreateInstance(...)
at Hangfire.AspNetCore.AspNetCoreJobActivatorScope.Resolve(...)
```

Job bị retry nhiều lần và không chạy được.

## Nguyên nhân gốc (Root cause)

Hangfire đang cố khởi tạo **job type là `interface` hoặc `abstract`** từ dữ liệu job đã lưu trong storage (Redis/Postgres).

Điều này thường xảy ra khi trước đó có enqueue/schedule job theo kiểu:

- `_backgroundJobClient.Enqueue<IFooJob>(job => job.Run(...))`
- `RecurringJob.AddOrUpdate<IFooJob>(...)`

Khi job được thực thi, `AspNetCoreJobActivatorScope` fallback sang `ActivatorUtilities.CreateInstance(...)` và sẽ throw nếu type là abstract/interface.

## Fix đã áp dụng

1) Đổi Hangfire activator sang **DI-first**: ưu tiên resolve job từ DI (hỗ trợ interface job nếu đã đăng ký), chỉ fallback `ActivatorUtilities.CreateInstance` cho type concrete.

- `AdministrationService/Program.cs:114` (`DiFirstJobActivator`)

2) Đăng ký DI mapping cho job interface có khả năng đã được enqueue trước đây:

- `AdministrationService/Extensions/DependencyInjection.cs:18`
  - `services.AddScoped<Services.ITenantMigrationJob, Services.TenantMigrationJob>();`

## Cách verify

1) Build:

`dotnet build .\AdministrationService\AdministrationService.csproj -c Release`

2) Chạy service và quan sát Hangfire dashboard `/hangfire`:

- Job không còn fail với lỗi “Instances of abstract classes…”

## Lưu ý khi vẫn còn lỗi sau deploy

- Nếu trong storage còn job cũ được enqueue bằng interface/abstract type khác, cần:
  - đăng ký DI cho type đó, **hoặc**
  - xóa/requeue job sai type trong Hangfire dashboard.
