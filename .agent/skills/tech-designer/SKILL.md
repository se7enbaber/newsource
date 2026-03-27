---
name: erp-tech-designer
description: Dùng sau khi đã có file .spec.md và Notion đã được confirm. Công việc của skill này là chuyển specs chức năng thành tài liệu thiết kế kỹ thuật chi tiết (.tech.md) dành riêng cho Developer và AI thực thi từng bước.
---

# ERP Technical Designer — Thiết kế Kỹ thuật & Kế hoạch Thực thi

## Nguyên tắc cốt lõi

> Phân tách rõ ràng giữa "Làm cái gì" (Spec) và "Làm như thế nào" (Tech).  
> Tài liệu kỹ thuật phải đủ chi tiết để AI có thể tự thực hiện mà không cần hỏi lại.  
> **LUÔN** tuân thủ kiến trúc Microservices và các Base class có sẵn trong MintERP.

---

## Quy trình thực hiện

```
[1. Đọc .spec.md]
        ↓
[2. Research Codebase] (Xác định Base classes, Repository, Service hiện tại)
        ↓
[3. Thiết kế Database] (Migration, Column name, Data type)
        ↓
[4. Thiết kế các Layer Backend] (Controller, Service, Repository, DTO)
        ↓
[5. Thiết kế Frontend Layers] (API Service, Component, Page, Validation)
        ↓
[6. Tạo file .tech.md local] (Cùng thư mục với .spec.md)
        ↓
[7. Chờ Approve → Bắt đầu Code theo Step-by-Step]
```

---

## Tài liệu Thiết kế Kỹ thuật (.tech.md)

**Vị trí:** Phải nằm cùng thư mục với file `.spec.md` tương ứng.  
**Tên file:** Nếu spec là `users.spec.md` -> tech là `users.tech.md`.

### Template `.tech.md` chuẩn (BẮT BUỘC)

```markdown
# [TECH] Tên tính năng/vấn đề

> **Spec tương ứng:** [tên-file.spec.md](./tên-file.spec.md)
> **Ngày thiết kế:** YYYY-MM-DD
> **Status:** preparing | coding | testing | done
> **Module:** {Service liên quan}

---

## 🛠 1. Database & Model Changes
- [ ] **Migrations:** Tên file migration (nếu có).
- [ ] **Table `Xxx`**:
    - `ColumnName` (Type, Nullable, Description)
- [ ] **New Entity:** `Yyy.cs` (BaseEntity / FullAuditedEntity)

## ⚙️ 2. Backend (C# / .NET)
### Data Transfer Objects (DTOs)
- [ ] `XxxDto`, `CreateXxxInput`, `UpdateXxxInput`
### Application Services
- [ ] `IXxxAppService` interface
- [ ] `XxxAppService` (Kế thừa BaseService, xử lý logic nghiệp vụ)
### Repositories
- [ ] `IXxxRepository` (Kế thừa BaseRepository)
### Controllers
- [ ] `XxxController` (Routing, [Authorize], [DynamicPermission])

## 🎨 3. Frontend (Next.js / TypeScript)
### API Interaction
- [ ] `src/services/xxxService.ts` (Mapping endpoints)
### Components
- [ ] `components/Xxx/XxxModal.tsx` (Logic, Props, State)
- [ ] Validation: `z.object({...})` dùng Zod
### Page Logic
- [ ] `app/xxx/page.tsx` (Server components vs Client components)

## 🔄 4. Background Job & SignalR (Nếu có)
- [ ] `XxxJob.cs`: Logic xử lý ngầm, Hangfire config
- [ ] `SignalRHub`: Client method, Notify logic

## ✅ 5. Checklist Thực thi (Step-by-Step cho AI)
1. **Infrastructure**: Chạy migration, cập nhật Connection String.
2. **Backend Core**: Tạo Entity, Repository, DTOs.
3. **Backend Logic**: Implement AppService, đăng ký Dependency Injection.
4. **Backend API**: Tạo Controller, gán Permission code.
5. **Frontend API**: Tạo file service gọi API.
6. **Frontend UI**: Build components, tích hợp form validation.
7. **Testing**: Chạy Unit test, verify flow trên UI.

## 📝 Ghi chú Kỹ thuật
- {Lưu ý về Performance, Cache, hoặc Security}
```

---

## Hướng dẫn Research Codebase

Trước khi viết `.tech.md`, hãy dùng công cụ để tìm hiểu:
- **Base Classes:** Search `BaseService`, `BaseRepository` để xem cách kế thừa.
- **Dependency Injection:** Xem `DependencyInjection.cs` của module đó.
- **Permission System:** Xem cách dùng attribute `[DynamicPermission]` hoặc check claim.
- **Frontend Proxy:** Xem cách `my-nextjs` gọi qua Gateway.

---

## Quy tắc đặt tên (Naming Convention)

| Layer | Convention | Ví dụ |
|-------|------------|-------|
| Table | `ServicePrefix_TableName` | `ADMIN_Tenants` |
| Column | `PascalCase` | `TenantName` |
| Entity | `PascalCase` | `Tenant.cs` |
| DTO | `EntityPrefix` + `Dto/Input` | `TenantDto`, `CreateTenantInput` |
| Controller | `EntityPrefix` + `Controller` | `TenantsController` |
| Service (FE) | `camelCase` | `tenantService.ts` |
| Component | `PascalCase` | `TenantModal.tsx` |

---

## Kiểm tra chéo (Cross-check)

- [ ] Tech spec có cover hết các điểm trong `.spec.md` không?
- [ ] Tên cột DB có trùng với entity property không?
- [ ] Đã có logic xử lý lỗi (Exception handling) chưa?
- [ ] Đã check permission chưa?
