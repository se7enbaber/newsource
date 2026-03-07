# Share Service

**ShareService** là một project dạng Class Library (DLL) chứa các module dùng chung như Helper, Utility, DTO chung hoặc Custom Attributes,... cho toàn bộ hệ thống.

### Đặc điểm thiết kế

```text
┌──────────────────┐           ┌──────────────────────┐
│   ShareService   │           │ Thư mục: /commondll  │
│ (Class Library)  ├──────────►│  [ShareService.dll]  │
└──────────────────┘   Build   └───────▲──────▲───────┘
                                       │      │
     Reference DLL ────────────────────┘      │ Reference DLL
┌────────────────────────┐     ┌──────────────┴─────────┐
│ AdministrationService  │     │ GatewayService         │
│      (Web API)         │     │ (Console/Web API)      │
└────────────────────────┘     └────────────────────────┘
```

1. **Không định tuyến (No Routing)**: Đây không phải là một API hay Web App độc lập. Nó chỉ là thư viện dùng lại.
2. **Build ra thư mục chung (`/commondll`)**: Thay vì đặt các file build trong thư mục `/bin` cục bộ, source này đã được điều chỉnh tại file `ShareService.csproj` để xuất (output) thư viện `.dll` đã cấu dịch vào một thư mục gốc của Solution là `/commondll`.
3. **Reference từ ngoài**: Bất kỳ service nào khác trong dự án (ví dụ `AdministrationService`, `GatewayService`) khi có nhu cầu tính năng chung sẽ Reference trực tiếp vào thư viện DLL được build trong mục `/commondll`.

### Cấu hình `.csproj` liên quan
```xml
  <PropertyGroup>
    <OutputPath>..\commondll\</OutputPath>
    <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
    <AppendRuntimeIdentifierToOutputPath>false</AppendRuntimeIdentifierToOutputPath>
  </PropertyGroup>
```

### Cách sử dụng
* Khi thêm logic mới vào đây, chỉ cần Rebuild (hoặc code sẽ tự watch). Khi đó file `ShareService.dll` mới nhất sẽ tự cập nhật vào `/commondll`.
* Các dự án khác tham chiếu (Framework Reference hoặc DLL Reference) vào file DLL sinh ra đó để sử dụng thư viện chung này thay vì chép/paste source code trùng lặp.

---

### 🛠 Cấu trúc Infrastructure Tập trung (Extensions)

Dự án sử dụng các Extension Methods trong `CommonInfrastructureExtensions.cs` để đồng nhất cấu hình cho tất cả service:

#### 1. Centralized Logging (Serilog + Seq)
Sử dụng `AddCommonSerilog()` để thiết lập logging:
- **Sink**: Console, File (xoay vòng mỗi ngày), và **Seq** (tập trung log).
- **Enrichers**: Tự động đính kèm `Environment`, `ThreadId`, `TenantId`, `UserId` vào mỗi dòng log.
- **Cấu hình**: Đọc `Seq:ServerUrl` từ `appsettings.json` hoặc biến môi trường `SEQ_URL`.

#### 2. Health Checks
Sử dụng `AddCommonHealthChecks()` và `MapCommonHealthChecks()`:
- Expose các endpoint: `/health` (tổng quát), `/health/live` (sống), `/health/ready` (sẵn sàng).
- Hỗ trợ gắn tag để phân loại kiểm tra (ví dụ: tag `db` cho database).

#### 3. CORS Policy
Sử dụng `AddCommonCors()` để cấu hình chính sách chia sẻ tài nguyên:
- Mặc định cho phép tất cả (`AllowAnyOrigin`) nếu không truyền danh sách domain cụ thể.
- Hỗ trợ cấu hình `AllowCredentials` khi có danh sách origins cụ thể.
