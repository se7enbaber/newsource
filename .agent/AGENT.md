# AGENT KNOWLEDGE BASE

## Tech Stack
* **Frontend**: Next.js 16.1 (App Router), React 19.2, TypeScript, Ant Design v6.3.0, TailwindCSS v4, i18next, @microsoft/signalr.
* **Backend**: .NET 10.0, ASP.NET Core API.
* **Database & ORM**: PostgreSQL, Entity Framework Core 10.0. Dynamic Connection String per Tenant.
* **Auth**: ASP.NET Core Identity, OpenIddict (OIDC), JWT Bearer Tokens.
* **Cache & Realtime**: Redis (Distributed Cache + SignalR backplane), fallback IMemoryCache.
* **Gateway**: YARP Reverse Proxy.
* **Storage**: MinIO (S3 Compatible).
* **Logging**: Serilog, Seq, ASP.NET Core HealthChecks.
* **Jobs**: Hangfire.

---

## ✅ Luôn làm

| Rule | Chi tiết |
|------|----------|
| Đọc README trước | Đọc `README.md` / `README_PROJECT.md` trước khi bắt đầu task |
| Kế thừa Base Class | Backend service/repo → kế thừa `BaseService<TEntity,TDto,TCreateDto>` và `BaseRepository<T>` từ ShareService |
| Audit & Soft Delete | Entity phải implement `IAuditEntity`, `IAuditDeleteEntity`, `IMultiTenant` |
| Prefix table DB | Dùng tiền tố `ADMIN_` (từ `AppConstants.PrefixTable`) cho mọi entity table |
| DTO dùng chung | DTO, Interface khai báo tập trung ở ShareService, không khai báo trùng |
| Bypass filter đúng chỗ | Admin/background task → dùng `IgnoreQueryFilters()` / `GetAllIgnoreFilters()` |
| Custom UI Component | Grid → `<AppGrid>`, Button → `<AppButton>` từ `app/components/common` |
| Dọn rác sau task | Xóa file log `.txt`, script tạm sau khi làm xong |
| ✅ Gen file test | Sau khi hoàn thành bất kỳ tính năng nào — tạo file `.agent/specs/{module}/{feature}.test.spec.md` theo đúng format của skill `erp-testing`. Không được đóng task khi chưa có file test này. |

---

## ❌ Không làm

| Rule | Chi tiết |
|------|----------|
| Hard-code Tenant filter | Không dùng `WHERE TenantId = ...` thủ công — đã có Global Query Filter |
| Xóa vĩnh viễn data | Không dùng `Remove()` / `ExecuteDeleteAsync()` trực tiếp — dùng Soft Delete |
| Raw antd import | Không `import { Button, Table } from 'antd'` — dùng `AppButton`, `AppGrid` |
| Call backend cross-origin | Frontend không call thẳng port backend — phải đi qua YARP Gateway |
| Copy-paste DTO | Không khai báo lại DTO đã có trong ShareService |
| Khai báo lại Serilog/CORS | Dùng `ShareService.Extensions`, không khai báo lại trên từng microservice |
| Sửa file ngoài scope | Chỉ sửa file liên quan trực tiếp đến yêu cầu, không lan man sang service khác |

---

## Quy tắc dự án

* **Phân quyền**: Controller endpoint phải gắn `[HasPermission("ModuleName.Action")]`
* **i18n**: Text tĩnh dùng `t('key', 'Default Text')` từ `useTranslation()`
* **Middleware order**: `Routing → CORS → RateLimiter → WebSockets → Authentication → Authorization → MapControllers/YARP`
* **Theme**: Dùng `const { token } = useToken()` từ Ant Design, không hard-code màu HEX

---

## Scope & File

**Khai báo trước mỗi task:**
```
✅ Đọc  : {file 1}, {file 2}
✅ Sửa  : {file 3}
✅ Tạo  : {file 4} (nếu có)
🚫 Bỏ qua: {service / file không đụng vào}
```
Scope không rõ → hỏi lại, không tự đoán.
Phát hiện vấn đề ngoài scope → **ghi chú cuối response, không sửa**.
Tạo file mới chỉ khi yêu cầu nói rõ hoặc skill checklist yêu cầu.

**Tách file (ngưỡng 200 dòng):**
File vượt 200 dòng → hỏi trước khi tách, không tự tách.
Tách theo nhóm logic (không cắt cơ học theo số dòng). Tên file con: `{gốc}-{nhóm}.ext`. Không dùng: `part1, v2, new, old`.
File gốc sau tách chỉ giữ overview + link sang file con.
