
---

## 6. Lỗi thường gặp & Debug Checklist

### A. OpenIddict trả về `ID2083` — "This server only accepts HTTPS requests"

**Nguyên nhân:** OpenIddict mặc định yêu cầu HTTPS trên `/connect/token`. Khi chạy dev bằng HTTP (`http://localhost:5027`), sẽ bị chặn ngay.

**Giải pháp trong `Program.cs`:**
```csharp
.AddServer(options => {
    // ...
    options.AcceptAnonymousClients(); // Không bắt buộc client_id
    if (builder.Environment.IsDevelopment())
    {
        options.UseAspNetCore().DisableTransportSecurityRequirement(); // Bỏ yêu cầu HTTPS
    }
})
```

> ⚠️ Chỉ dùng `DisableTransportSecurityRequirement()` trong **Development**. Production phải dùng HTTPS.

---

### B. 403 Forbidden khi gọi API với token hợp lệ

**Checklist debug theo thứ tự:**

1. **Claims trong JWT có Role không?**
   - Role claim phải được gán `SetDestinations(AccessToken)` rõ ràng, nếu không OpenIddict sẽ **xóa claim đó** trước khi phát hành token.
   - Sửa trong `AuthorizationController.cs`:
   ```csharp
   var roleClaim = new Claim(OpenIddictConstants.Claims.Role, roleName);
   roleClaim.SetDestinations(OpenIddictConstants.Destinations.AccessToken);
   identity.AddClaim(roleClaim);
   ```

2. **Handler kiểm tra quyền Admin có đọc đúng claim type không?**
   - OpenIddict dùng claim type `"role"` (lowercase), không phải `ClaimTypes.Role` (full URI).
   - `PermissionAuthorizationHandler` phải kiểm tra cả hai:
   ```csharp
   context.User.HasClaim(c => c.Type == "role" && c.Value.Equals("Admin", StringComparison.OrdinalIgnoreCase))
   ```

3. **Middleware TenantId có chạy _trước_ Controller không?**
   - `app.Use(TenantMiddleware)` phải đặt **trước** `app.MapControllers()` trong pipeline.
   - Nếu không, `TenantService.TenantId = Guid.Empty` → Global Query Filter không tìm thấy Role trong DB.

4. **User có thực sự được gán Role trong DB không?**
   - Kiểm tra bảng `ADMIN_UserRoles` trong database.
   - Nếu DbSeeder đã chạy nhưng user tồn tại trước → logic gán Role trong block `if (adminUser == null)` bị skip.
   - Giải pháp: luôn kiểm tra và gán Role **bên ngoài** block `if (adminUser == null)`.

---

### C. `System.BadImageFormatException: Bad binary signature`

**Nguyên nhân:** File `.cs` được tạo bằng PowerShell `Out-File` mặc định dùng UTF-16 LE encoding, C# compiler không parse được.

**Giải pháp:** Tạo file C# qua công cụ có encoding UTF-8 (Visual Studio, `write_to_file`, hoặc `Out-File -Encoding UTF8`).

---

### D. Ambiguous reference `Permissions` (CS0104)

**Nguyên nhân:** Conflict giữa `AdministrationService.Authorization.Permissions` và `OpenIddict.Abstractions.OpenIddictConstants.Permissions`.

**Giải pháp trong `DbSeeder.cs`:**
```csharp
// Thay vì:
Permissions.GetAll();                         // ❌ Ambiguous
Permissions.Endpoints.Token;                  // ❌ Ambiguous

// Dùng fully-qualified name:
AdministrationService.Authorization.Permissions.GetAll();       // ✅
OpenIddictConstants.Permissions.Endpoints.Token;               // ✅
```

---

### E. `dotnet watch` không áp dụng thay đổi cấu hình Startup

**Vấn đề:** Hot reload chỉ áp dụng cho logic code, **không** áp dụng cho thay đổi DI registrations hoặc middleware pipeline (như `AddOpenIddict`, `UseCors`, v.v.).

**Giải pháp:** Phải **restart hoàn toàn** `dotnet watch` (Ctrl+C → `dotnet watch` lại) sau khi thay đổi `Program.cs`.

---

### Thứ tự Middleware Pipeline đúng

```
app.UseCors(...)                 ← CORS trước nhất (xử lý Preflight)
app.UseAuthentication()          ← Parse JWT Bearer token
app.UseAuthorization()           ← Kiểm tra Policy/Role
app.Use(TenantMiddleware)        ← Đọc tenant_id từ JWT đã parse
app.MapControllers()             ← Route đến Controller endpoint
```

---

### G. Lỗi `Npgsql.NpgsqlException: Name or service not known` trong Docker

**Nguyên nhân:** Trong Docker container, `localhost` hoặc `127.0.0.1` trỏ về chính container hiện tại, không phải container của Database (`erp-postgres`).

**Giải pháp tự động (Automatic Patching):**
Hệ thống đã tích hợp logic tự động kiểm tra tham số `DOTNET_RUNNING_IN_CONTAINER`. Nếu phát hiện đang chạy trong Docker và chuỗi kết nối chứa `localhost`/`127.0.0.1`, nó sẽ tự động thay thế bằng `postgres` (tên service trong mạng nội bộ Docker).

Logic này được thực thi tại:
- **Login**: `AuthorizationController.cs` (khi lấy DB context của Tenant).
- **Background Jobs**: `TenantMigrationJob.cs` (khi chạy Migration ngầm).
- **Runtime Middleware**: `Program.cs` (mọi request API bình thường).
- **Connection Check**: `TenantAppService.cs` (nút "Kiểm tra kết nối" trên UI).

---

### H. Không truy cập được Hangfire Dashboard (401/403 qua Gateway)

**Vấn đề:** Hangfire chặn các truy cập không phải từ Localhost.

**Giải pháp trong `Program.cs`:**
1. Sử dụng `HangfireCustomAuthorizationFilter` trả về `true`.
2. Bật `IgnoreAntiforgeryToken = true` để tránh lỗi CSRF mismatch khi request đi qua Gateway/Proxy.

```csharp
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireCustomAuthorizationFilter() },
    IgnoreAntiforgeryToken = true
});
```

---

### I. Hangfire Dashboard không hiện Log (Chỉ hiện Succeeded/Failed)

**Giải pháp:**
1. Package **Hangfire.Console** đã được cài đặt.
2. Kích hoạt trong `Program.cs`: `config.UseConsole()`.
3. Trong Job (ví dụ `TenantMigrationJob`), truyền `PerformContext` vào method và gọi `context.WriteLine("...")`.

---

### Thứ tự Middleware Pipeline chuẩn cho Docker

```
app.UseCors(...)                 ← CORS trước nhất
app.UseAuthentication()          ← Parse JWT
app.UseAuthorization()           ← Policy/Role
app.UseHangfireDashboard(...)    ← Dashboard Jobs (sau Auth/Authz)
app.Use(TenantMiddleware)        ← Đọc TenantId từ JWT
app.MapControllers()             ← API Endpoints
```
