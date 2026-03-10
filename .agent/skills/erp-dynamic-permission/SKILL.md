---
name: mint-erp-dynamic-permission
description: Phân quyền động (Dynamic Authorization), sử dụng Redis cache Role Claims để tránh bottleneck CSDL, và attribute HasPermission bảo vệ đầu vào API.
---

# Dynamic Permissions

Chặn truy vấn API an toàn bằng Attribute tuỳ chỉnh cấp Application, phân cấp cache tại Redis/Memory Cache.

## Các Pattern thực tế (Code Example)

### 1. Phân quyền API với [HasPermission]
Authorization handler sử dụng header JWT lấy User, và đọc `RoleClaims` đã cache dựa trên Redis (`IDistributedCache`) để so khớp chuỗi tính năng.

**Cách dùng ở Backend Controller:**
```csharp
[HttpPost("create")]
[HasPermission("AdministrationService.Users.Create")]  // <-- Attribute bắt buộc
public async Task<IActionResult> CreateUser([FromBody] UserCreateDto request)
{
    // ... logic
}
```

### 2. Redis Caching Permission
Hệ thống Cache `IMemoryCache` (Fallback) hoặc `Distributed Cache` (Redis 7) giữ toàn bộ claim người liên quan đến token, điều này hạn chế gọi truy vấn Entity Framework liên tục trên mỗi action check.

```csharp
// Code example: Seed và Set cache tự động
await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(permissions), options);
```

### 3. Check quyền ẩn Component ở UI (Frontend)
Thực hiện Auth-guarding ngay trong UI Rendering qua hook React Context.
```tsx
import { usePermission } from '@/lib/PermissionProvider';

const { hasPermission } = usePermission();

if (!hasPermission("AdministrationService.Users.Create")) {
    // Ẩn nội dung hoặc báo lỗi 403 Forbidden
}
```

---

## ✅ Checklist
1. Bổ sung Controller/Action -> Sinh mã Permission string mô tả quy ước `Service.Module.Action` (vd: `AdministrationService.Roles.Delete`).
2. Gắn attribute `[HasPermission("...")]` vào Action METHOD trước API request handler.
3. Kế tiếp sang Frontend cập nhật `AppButton` đính kèm property `permission="Service.Module.Action"`.
4. Nếu thay đổi quyền trong CSDL, đảm bảo Clear Cache/Invalidate để làm tráng bộ nhớ token/user cũ.

---

## 🚫 Sai vs Đúng (Anti-Patterns)

| Sai (Anti-pattern) | Đúng |
|---|---|
| Dùng `[Authorize(Roles="Admin")]` chuẩn mặc định của .NET | Dùng Attribute cấp độ Function tính năng `[HasPermission("...")]`. Tính năng mềm dẻo cho Account custom role cấp dưới. |
| Fetch lại Quyền (Permissions) từ DB mỗi khi middleware verify incoming JWT Token, gây treo DB cục bộ tại peak traffic. | Đọc Array chuỗi Permission Array từ Distributed Cache `Redis` hoặc Identity Token Claims JWT. |
| Gửi array roles = rỗng khi tạo Dropdown Roles trong Form sửa User ở Frontend. (TODO list cũ) | → Chi tiết xem: role-dropdown-flow.md |
