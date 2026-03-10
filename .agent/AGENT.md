# AGENT KNOWLEDGE BASE

## 🛠 Tech Stack Thực Tế
Dựa trên phân tích từ `docker-compose.yml`, `package.json`, và `AdministrationService.csproj`:
* **Frontend**: Next.js 16.1 (App Router), React 19.2, TypeScript, Ant Design v6.3.0, TailwindCSS v4, i18next, @microsoft/signalr (SignalR client).
* **Backend**: .NET 10.0, ASP.NET Core API.
* **Database & ORM**: PostgreSQL (chính), MySQL/SQLServer via Entity Framework Core 10.0. Hỗ trợ thay đổi Connection String động (Dynamic Connection String) cho từng Tenant.
* **Authentication/Authorization**: ASP.NET Core Identity, OpenIddict (OIDC), JWT Bearer Tokens.
* **Caching & Real-time**: Redis (Distributed Caching & SignalR backplane), ngầm định có thể fallback sang IMemoryCache.
* **Reverse Proxy / API Gateway**: YARP (Yet Another Reverse Proxy - .NET 8/10).
* **Storage**: MinIO (S3 Compatible).
* **Observability/Logging**: Serilog, Seq, ASP.NET Core HealthChecks.
* **Job Scheduler**: Hangfire.

---

## ✅ Danh sách "Luôn làm" (Obligatory Conventions)
1. **Kiểm tra file cấu trúc `README.md`**: Khi bắt đầu một task, TẤT BUỘC luôn phải đọc file `README.md` và `README_PROJECT.md` ở thư mục hiện tại để lấy bối cảnh trước khi generate code. Hỗ trợ update lại README khi có thay đổi logic cốt lõi.
2. **Kế thừa các Base Class (DRY Rule)**: Khi tạo service backend hoặc kết nối database, LUÔN LUÔN kế thừa từ `BaseService<TEntity, TDto, TCreateDto>` và `BaseRepository<T>` nằm trong `ShareService` để tối đa hóa tái sử dụng mã.
3. **Audit & Soft Delete**: Khi thiết kế entity trong backend, luôn triển khai interface `IAuditEntity`, `IAuditDeleteEntity` và/hoặc `IMultiTenant` (`ShareService.Infrastructure.Model.Base`). Quá trình xử lý gán thời gian, user, và chuyển Delete thành Soft-Delete (cập nhật `IsDeleted` = true) đã được override ngầm trong `ApplicationDbContext.SaveChangesAsync()`.
4. **Naming Convention cho DB**: Mọi entity table identity hoặc tùy chỉnh cần phải dùng tiền tố quy định trong `AppConstants.PrefixTable` (Mặc định: `ADMIN_`).
5. **Dùng chung DTO và Interface**: DTOs, Base Interfaces được lưu tập trung ở dự án `ShareService`. Tuyệt đối không khai báo trùng lặp mà không tham chiếu.
6. **Bypass Query Filter Khi Cần (Tác vụ Admin/Background)**: Những hàm không chịu sự kiểm soát của Tenant hiện tại hoặc muốn tìm cả các bản ghi đã xoá thì luôn phải sử dụng hàm `IgnoreQueryFilters()` hoặc hàm `GetAllIgnoreFilters()` từ BaseRepository.
7. **Sử Dụng Custom UI Component**: Mọi thao tác hiển thị bảng dữ liệu (grid) ở frontend đều phải dùng component `<AppGrid>`, đối với thao tác click phải dùng `<AppButton>` (tích hợp check permission).
8. **Chống thất lạc thư mục rác**: Dọn dẹp log tests (`.txt`, scripts rác) sau quá trình làm.

---

## 🚫 Danh sách "Không bao giờ làm" (Anti-Patterns / DO NOT DO)
1. **Không Hard-code trực tiếp cấu hình DB Tenant**: Tuyệt đối không viết logic chọn schema/tenant bằng câu lệnh `WHERE TenantId = ...` thủ công trên các câu query Entity Framework thông thường vì hệ thống đã trang bị **Global Query Filter** tích hợp thông qua `_tenantService.TenantId` từ `ApplicationDbContext`.
2. **Không tự ý xóa vĩnh viễn Data**: KHÔNG dùng `_dbSet.Remove(entity)` kết hợp với `SaveChanges` mà không xử lý Entity Interface. Hàm xóa đã tự gọi chuyển đổi `IsDeleted` nếu khai báo interface Soft Delete đúng. Tránh lệnh trực tiếp `ExecuteDeleteAsync()` trên DB nếu chưa thực sự chắc chắn.
3. **KHÔNG DÙNG RAW UI NATIVE (antd)**: 
   * Quét thấy có khuynh hướng import thuần `import { Button, Table } from 'antd'` => Rất dễ mất đồng bộ giao diện và mất khả năng kiểm duyệt role.
   * => **Right approach**: Nhập `AppButton` và `AppGrid` từ `app/components/common` cho mọi tính năng mới, truyền `permission` vào Component để auto ẩn hiện.
4. **Không bỏ qua kiến trúc YARP Gateway**: Next.js không được phép call cross-origin chéo đến backend (ví dụ port 7027) ở phía client trình duyệt. Ở Frontend luôn fetch thông qua endpoint cục bộ hoặc call Next.js API proxy, đi qua YARP `GatewayService` (port 5000), sau đó Gateway mới route xuống Backend. 
5. **Không copy-paste code dư thừa**: Nếu phải ánh xạ DTO lặp đi lặp lại nhiều class, cần dùng `MapToDto` qua các thư viện (AutoMapper hoặc thủ công ở cấp Abstract).
6. **Không trực tiếp khai báo lại Serilog hay CORS trên mỗi Microservice lẻ**: Các extension cho Service như `ShareService.Extensions` hay tương tự đã gói gọn (DRY), nên gọi vào `ShareService` để tích hợp.

---

## 🔒 Các quy tắc đặc thù dự án
* **Kiểm tra Phân Quyền**: API Endpoints (Controller) yêu cầu phân quyền cần được đính kèm Header/Attribute `[HasPermission("ModuleName.Action")]`.
* **Frontend Multi-language (i18n)**: Khi thêm Text tĩnh trên giao diện, truyền qua hàm bọc `t('key', 'Default Vietnamese Text')` từ hook `useTranslation()`.
* **Thứ tự Middleware ở Backend API**: Thông thường phải thiết lập HealthCheck, Routing, CORS (nếu bypass cục bộ), sau đó đến Authentication, AuthZ (Permisson Middleware), và YARP (đối với Gateway), MapControllers.
* **Thiết kế Theme Động**: Frontend ưu tiên sử dụng `useToken()` của `theme` từ Ant Design (`const { token } = useToken();`) để extract biến màu (colorPrimary, colorBgContainer, v.v) thay vì CSS tĩnh/hard-code mã HEX.
