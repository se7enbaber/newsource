# Giới thiệu Dự án (App Project)

> **Ghi chú:** Đây là file chứa thông tin tổng quan của dự án, mô tả cấu trúc tổng thể và cách Web (Frontend) kết nối vào API (Backend).

Dự án này bao gồm hai thành phần chính: một hệ thống Backend (API) quản trị mạnh mẽ với khả năng multi-tenant và phân quyền động, cùng với một Frontend hiện đại sử dụng Next.js.

---

## 🏗 Tổng quan Kiến trúc (Architecture Overview)

```text
┌────────────────────────┐         ┌────────────────────────┐
│ Trình duyệt (Người dùng)│  HTTP   │ Next.js Server (Proxy) │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│                   Gateway Service (YARP)                  │
└──────┬──────────────────────────┬──────────────┬──────────┘
       │ /notificationHub         │ /api/**       │ /files/**
       ▼                          ▼               ▼
┌─────────────┐  HTTP   ┌──────────────────┐  ┌──────────────────┐
│SignalR Svc  │◄────────│Administration Svc│  │  File Service    │
│(WebSocket)  │  POST   │  (Core API)      │  │  (Upload/Download)│
└──────┬──────┘         └────────┬────┬────┘  └────────┬─────────┘
       │                         │    │                │
       │         Distributed     │    │ EF Core        │ S3 API
       └────────► Cache (Redis) ◄┘    ▼                ▼
                               ┌──────────────┐      ┌──────────────────┐
                               │   Database   │      │      Minio       │
                               │ (PostgreSQL) │      │ (File Storage)   │
                               └──────────────┘      └──────────────────┘
```

> **Lưu ý Quan trọng:** Luôn luôn cập nhật Tổng quan Kiến trúc này (ASCII diagram) mỗi khi bổ sung hoặc thay đổi luồng đi của một Microservice mới trong hệ thống để đảm bảo tài liệu phản ánh đúng thực tế!

---

## 📁 Cấu trúc Thư mục

| Thư mục | Mô tả | Công nghệ sử dụng |
|---------|-------|-------------------|
| `AdministrationService` | Backend API Core chịu trách nhiệm xử lý logic, quản trị người dùng, phân quyền và dữ liệu multi-tenant. | .NET 10, ASP.NET Core Identity, OpenIddict, EF Core, PostgreSQL/MySQL/SQLServer |
| `GatewayService` | Cổng API Gateway (Reverse Proxy) đứng trước AdministrationService. Frontend gọi vào Gateway để chuyển tiếp mượt mà. | .NET 8, YARP |
| `SignalRService` | Microservice chuyên biệt để quản lý luồng WebSocket và push notification thời gian thực tới Client. | .NET 10, ASP.NET Core SignalR |
| `FileService` | Microservice quản lý lưu trữ tệp tin (upload/download) tích hợp với MinIO. Mỗi Tenant có vùng lưu trữ cô lập. | .NET 10, MinIO S3 API |
| `ShareService` | Thư viện dùng chung (Class Library). Tự build ra `/commondll`. Chứa helper, util, common DTO để các service khác tham tham chiếu. | .NET 10, C# |
| `my-nextjs` | Frontend Web App cho người dùng cuối và quản trị viên thao tác trực tiếp với API. | Next.js, React, TypeScript |

---

## 1. Backend: Administration Service (`/AdministrationService`)

**AdministrationService** là trái tim của hệ thống cung cấp các RESTful APIs xử lý nghiệp vụ phức tạp.

### Các tính năng nổi bật:
- **Multi-tenant Architecture:** Khả năng phục vụ nhiều tenant (khách hàng/tổ chức) trên cùng một instances. Cấu hình kết nối DB tự động (Dynamic Connection String) và Global Query Filter áp dụng qua Entity Framework Core.
- **Dynamic Permissions (Phân quyền động):** Hệ thống phân quyền sử dụng JWT RoleClaims, cache tập trung trên **Redis** (Distributed Cache) với cơ chế fallback về `IMemoryCache` nếu Redis mất kết nối. Bảo vệ API bằng custom attribute `[HasPermission]`.
- **Identity & Authentication:** Quản lý người dùng qua `ASP.NET Core Identity` với mã hóa tiêu chuẩn và phát hành JWT OIDC thông qua `OpenIddict`.
- **Auto Audit & Soft Delete:** Sử dụng `SaveChangesAsync` override trên `ApplicationDbContext` để tự động cập nhật các field audit và không xóa vĩnh viễn dữ liệu.

### Cách chạy Backend:
1. Mở terminal tại thư mục `AdministrationService`.
2. Chạy lệnh:
   ```bash
   dotnet restore
   dotnet run
   ```
3. Xem tài liệu kỹ thuật chi tiết của backend tại: [Administration Service README](./AdministrationService/README_PROJECT.md)

---

## 2. Frontend: Next.js Client (`/my-nextjs`)

**my-nextjs** là giao diện người dùng chính được xây dựng bằng Next.js tối ưu hóa về tốc độ, SEO và trải nghiệm (App Router). 

### Các tính năng nổi bật:
- **Proxy cấu hình sẵn:** Đã được thiết lập proxy để tránh các lỗi liên quan đến CORS khi gọi xuống API của AdministrationService và vượt qua các proxy rules về HTTPS self-signed (nếu có ở localhost).
- **Tích hợp linh hoạt:** Call API nhanh chóng và dễ dàng render dựa trên phân quyền mà API trả về qua JWT.
- **UI Framework:** Tận dụng hệ thống components giao diện (bao gồm các thư viện như Ant Design nếu có) để tạo form quản lý, modal, table một cách nhất quán.

### Cách chạy Frontend:
1. Mở terminal tại thư mục `my-nextjs`.
2. Cài đặt các gói phụ thuộc (nếu chưa cài):
   ```bash
   npm install
   ```
3. Chạy môi trường phát triển (Development server):
   ```bash
   npm run dev
   ```
   *Giao diện Frontend mặc định sẽ chạy ở `http://localhost:3000`.*

---

## 🚀 Hướng dẫn khởi chạy toàn bộ Hệ thống cục bộ (Local)

Để chạy trọn vẹn cả hệ thống mượt mà và nhanh nhất, dự án cung cấp sẵn script chạy tự động cho Windows:

**Cách Mới (Tự động mở 3 Terminal):**
Chỉ cần chạy file `start-terminals.cmd` ở thư mục gốc (`d:\App\Project\start-terminals.cmd`). Hệ thống sẽ tự động bật 3 cửa sổ dòng lệnh cho: Administration Service, Gateway Service và Frontend Next.js.

**Cách Thủ công:**
1. Thiết lập **Cơ sở dữ liệu (Database)** và cấu hình chuỗi kết nối (`appsettings.json`) của `AdministrationService`.
2. Mở Terminal tại `AdministrationService` -> chạy `dotnet run`.
3. Mở Terminal tại `GatewayService/Gateway` -> chạy `dotnet run`.
4. Mở Terminal tại `my-nextjs` -> chạy `npm run dev` (mở tại `http://localhost:3000`).

---

## 📦 Hướng dẫn Build & Deploy (Publish)

Dự án này cung cấp một thư mục `Build` dùng chung ở thư mục gốc (`d:\App\Project\Build`), chứa các script để tự động hóa việc đóng gói (Publish) ứng dụng:

1. Chạy file batch `Build\AppPublish.bat`.
2. Script sẽ tự động dọn dẹp thư mục cũ và thực hiện build bản Release cho `AdministrationService`, `GatewayService` và build bản production cho `my-nextjs`.
3. Toàn bộ file đầu ra hoàn chỉnh sẽ được gom vào thư mục `Build\Release\`. Bạn có thể mang thư mục này đưa lên máy chủ hoặc cấu hình IIS/Docker để chạy Production.

## 📝 Lưu ý Phát triển (Development Notes)
- Toàn bộ thao tác thêm, sửa xóa khi ở vai trò hệ thống hay tác vụ tự động (Seeders) luôn cần cẩn trọng bypass Global Filters để không gán nhầm Tenant (`IgnoreQueryFilters()`).
- Thông tin phân quyền (Permissions) sẽ được refresh khi JWT Token mới (hoặc Refresh Token) được cấp lại.

### Tổng hợp Tính năng & Cải tiến Kiến trúc (Changelog Nổi bật)

1. **Kiến trúc Gateway Service (YARP):**
   - Thiết lập Gateway Service đóng vai trò làm Cổng API (Reverse Proxy) đứng trước Administration Service.
   - Quản lý định tuyến (routing), xử lý CORS tập trung cho Frontend và bypass SSL Certificate cho môi trường làm việc Local.

2. **Hệ thống Phân Quyền Động (Dynamic Permissions) & Tối ưu hóa hiệu năng:**
   - Xây dựng hệ thống phân quyền sử dụng JWT `RoleClaims` và custom attribute `[HasPermission]`.
   - Tối ưu cache lại toàn bộ quyền người dùng trên RAM thông qua `IMemoryCache` nhằm giảm tải số lần truy vấn Database thừa.
   - Bổ sung cơ chế tự ngầm định quét & đồng bộ (Seed) chuỗi quyền hạn vào CSDL lúc ứng dụng khởi động.
   - Frontend: Triển khai giao diện thiết lập phân quyền trực quan dạng Checkbox/List. Tự động bảo vệ danh sách Roles của hệ thống quản trị, chống việc vô tình bị vô hiệu hóa quyền.

3. **Multi-Tenant (Đa khách hàng) & Quản lý Tenant Toàn diện:**
   - Cải tiến Identity Database Index kết hợp với `TenantId`, giúp nhiều Tenant có thể cùng dùng chung một username (vd: `admin`) mà không bị tranh chấp dữ liệu mức Database.
   - Linh hoạt khi Đăng nhập (Login): Hỗ trợ nhận diện qua Code/Name, hệ thống Dynamic Scope DI tự động chuyển hướng Connection String trỏ vào Dedicated/Isolated DB riêng.
   - Bổ sung chức năng **Quản lý Tenant** trên màn hình Frontend (thông qua Permission Control, cho phép hiển thị riêng cho cấp Host/Admin).
   - Tích hợp Trigger Database Migration thủ công trên UI cho từng Tenant. Hệ thống backend dùng tiến trình **Hangfire** chạy nền lưu lịch sử cập nhật cấu trúc DB (`LastMigratedAt`).

4. **Nâng cấp Giao diện Frontend (Next.js) & Component UX/UI:**
   - Lõi cấu trúc API hóa trung tâm (`apiService.ts`): Bắt lỗi token 401/403 tự động, format lại lỗi an toàn loại bỏ các ký tự thừa trả về từ API. Chuẩn hóa kiến trúc các class frontend service.
   - Điều khiển tự động quyền truy cập Menu Sidebar phụ thuộc vào điều kiện hiển thị của tài khoản đang thao tác (`Navbar.tsx` & `PermissionProvider`).
   - **Advanced Data Grid:** Bổ sung Focus tương tác vào dòng (Row) khi User nhấp thao tác; Hoàn thiện màn hình Popup tương tác trên Avatar.
   - **Hệ thống Tour hướng dẫn (Guided Tours):** Triển khai `AppTour` tích hợp đa ngôn ngữ (i18n), giúp hướng dẫn người dùng mới làm quen với các tính năng (Search, Add, Edit, Delete, Export) thông qua các bước tương tác trực quan.
     - **Hỗ trợ cấp Trang:** Tenants, Users, Roles, Products.
     - **Hỗ trợ cấp Popup:** Đã tích hợp nút Help ngay trên tiêu đề Modal (ví dụ: `UserFormModal`) để hướng dẫn chi tiết các trường nhập liệu cụ thể.
   - **Nút Help & Xuất Excel:** Đồng bộ hóa nút Trợ giúp (Help) và Xuất dữ liệu ra file Excel (.xlsx) trên tất cả các màn hình quản trị chính (Tenants, Users, Roles, Products).
   - Khắc phục & Fix luồng gửi Dropdown Roles, đảm bảo các user khi tạo luôn gán đúng nhóm quyền mà không nhận mảng rỗng.
   - **Giao diện Mint ERP Premium (Dynamic Theme Engine):** Cập nhật toàn bộ theme sử dụng **Ant Design Tokens**, cho phép đổi màu chủ đạo đồng bộ và tự động.
    - **Premium Login Page:** Triển khai trang đăng nhập Split Layout (50/50) với vùng Branding ấn tượng.
    - **Hệ thống Component Siêu năng lực:**
      - **AppGrid V2:** Tích hợp Summary Cards, Toolbar và Row Actions.
      - **AppButton V2:** Permission-aware, Popconfirm and Loading auto-sync.
      - **AppBadge & AppStatCard:** Chuẩn hóa hiển thị trạng thái và thống kê.

5. **Chất lượng Code (Quality Assurance):**
   - Xử lý sạch sẽ và nâng cấp tương thích cho 100% các dòng Build Warnings (Nullables, Constructors, tương thích `Pomelo.EntityFrameworkCore.MySql` với EF10).

> Để đóng góp hoặc tùy chỉnh, vui lòng tham khảo mã nguồn trực tiếp trong từng thư mục.

---

## 3. Cổng API Gateway (`/GatewayService`)

**GatewayService** là phân hệ API Gateway sử dụng **YARP (Yet Another Reverse Proxy)**. Next.js thay vì gọi API chéo trực tiếp sang AdministrationService, sẽ gọi qua Gateway này.

* **Cơ chế Reverse Proxy Core**: Được cấu hình để bắt các request như `/api/**` và `/connect/**` rồi chuyển mượt mà xuống AdministrationService (port 7027).
* **Quản lý CORS tập trung**: Giải quyết triệt để các rắc rối liên quan tới Cross-Origin cho Next.js khi đứng cùng mạng LAN hoặc Local.
* **Bảo mật & Chứng chỉ nội bộ**: Tự động bypass các lỗi SSL Certificate Self-signed khi Gateway đóng vai trò máy chủ trung gian gọi xuống API gốc (AdministrationService).
* Việc có thêm phân hệ này cũng là bước chuẩn bị (Foundation) nếu tương lai có bổ sung thêm các Microservices con khác (Ví dụ: `SignalRService`, `PaymentService`...).

### 🔄 Luồng kết nối API (Next.js -> Gateway -> Backend)
Để khắc phục triệt để các vấn đề CORS và đảm bảo khả năng mở rộng, luồng request đang được thiết lập như sau:
1. Giao diện (Client-side React Component) gọi vào Route Proxy nội bộ của Next.js thông qua biến `NEXT_PUBLIC_API_ADMIN_URL` (vd: `GET /api/proxy/api/Users`).
2. Next.js Proxy (`app/api/proxy/[...path]/route.ts`) nhận request và nối với `BACKEND_URL` được cấu hình trong `.env.local` (vd: `http://localhost:5000/api/Users`). Tại bước này Server Node.js của Next.js thực hiện gọi HTTP Request, bypass hoàn toàn giới hạn CORS của Trình duyệt.
3. YARP Gateway (`GatewayService` chạy ở port 5000) nhận được request tại `/api/*` và `/connect/*`, ánh xạ thông qua cấu hình tại `appsettings.json` và điều hướng mượt mà về đích cuối là Backend AdministrationService tại `https://localhost:7027/`.

---

## 4. Cổng Thông báo Real-time (`/SignalRService`)

**SignalRService** là microservice đảm nhiệm riêng chức năng duy trì các kết nối WebSockets (chủ yếu là thư viện SignalR).

### Cách chạy SignalR Service:
1. Mở terminal tại thư mục `SignalRService`.
2. Chạy: `dotnet run`
3. Xem tài liệu kỹ thuật chi tiết tại: [SignalR Service README](./SignalRService/README.md)

---

## 5. Dịch vụ lưu trữ tệp tin (`/FileService`)

**FileService** là microservice tập trung xử lý các tác vụ liên quan đến tệp tin (Avatars, Documents, Reports), tích hợp trực tiếp với **MinIO (S3 Compatible)**.

### Các tính năng nổi bật:
- **Multi-tenant Data Isolation:** Mỗi tenant được cấp một **Bucket** riêng biệt (`tenant-{id}`), đảm bảo an toàn và cô lập dữ liệu tuyệt đối.
- **Presigned URLs:** Cung cấp URL có thời hạn để download file an toàn mà không cần công khai Storage server.
- **Security & Validation:** Kiểm tra kích thước, định dạng tệp tin và xác thực Tenant qua Gateway.

### Các endpoint chính:
* `POST /api/files/{folder}/upload` - Tải lên tệp tin.
* `GET /api/files/{folder}/{fileName}/url` - Lấy URL tải về có thời hạn.
* `DELETE /api/files/{folder}/{fileName}` - Xóa tệp tin.

---

## 6. Hệ thống Quan sát & Logging (Observability) (Trước là 5)

Dự án triển khai mô hình **Centralized Logging** để giám sát toàn bộ các microservices tại một nơi duy nhất.

* **Structured Logging (Serilog)**: Tất cả các service .NET đều sử dụng Serilog để ghi log dưới dạng cấu trúc (JSON), giúp việc tìm kiếm và lọc lỗi cực kỳ chính xác.
* **Log Sink tập trung (Seq)**: Log từ tất cả containers được đẩy về **Seq** server. Bạn có thể truy cập giao diện Seq tại cổng `5341` để xem log real-time và thiết lập cảnh báo.
* **Log Correlation**: Mỗi request đi qua hệ thống đều được đính kèm các thông tin ngữ cảnh như `TenantId`, `TraceId`, và `UserId`, giúp trace được một lỗi xảy ra xuyên suốt từ Gateway tới Service cuối cùng.
* **Health Monitoring**: Mỗi service đều expose endpoint `/health` để Docker và Gateway có thể tự động kiểm tra trạng thái hoạt động ("sống" hay "chết") của dịch vụ.

---

## 🛠 Nguyên tắc Phát triển (Coding Rules & Guidelines)

Dưới đây là một số lưu ý và nguyên tắc (rule) quan trọng khi tiến hành viết code (gen source) mới cho hệ thống:

1. **Dùng chung và Quản lý Phụ thuộc (Dependency & Reuse):** Nếu các project khác nhau sử dụng chung các thành phần như Repository cơ sở, Base Service, thì cần nhóm chúng vào một project chung (ví dụ: `Common`) và để các project đó reference vào. Tuyệt đối tránh việc nhân bản mã nguồn (Copy-paste).
2. **Hàm dùng chung (DRY - Don't Repeat Yourself):** Những đoạn logic, block thuật toán hay thao tác lặp đi lặp lại ở nhiều luồng tính năng khác nhau phải được gom lại thành các hàm dùng chung (helper functions / extensions) rồi mới tái sử dụng.
3. **Gợi ý Thiết kế Động (Dynamic Implementation):** Đối với những phần mã nguồn bị lặp thiết kế theo cùng một pattern mệt mỏi, luôn ưu tiên đưa ra hướng đề xuất thiết kế dạng "động" (Dynamic), chẳng hạn như cấu hình config, reflection, mapping động,... để lược bỏ việc gen file thừa.
4. **Tái sử dụng Component Giao diện Frontend:** Ở phía giao diện Frontend, nếu bất kỳ một khối UI/Component nào được trình bày (render) giống nhau hoặc lặp lại nhiều tại các trang, bắt buộc nên tách riêng ra thành file component độc lập để tái sử dụng thống nhất và toàn vẹn giao diện.
5. **Cập nhật Tài liệu (Documentation):** Khi chỉnh sửa mã nguồn hoặc thêm tính năng ở bất kỳ thư mục nào, TẤT BUỘC phải kiểm tra lại file `README.md` (hoặc `README_PROJECT.md`) của thư mục đó và cập nhật lại thay đổi tương ứng.
6. **NGUYÊN TẮC CHO AI (AI ASSISTANT RULES):** AI luôn luôn phải đọc file `README.md` đầu tiên để hiểu rõ context dự án, luồng dữ liệu trước khi thực hiện viết/sửa code. Sau khi xử lý xong các tác vụ cũng cần tự đối chiếu để cập nhật lại những file README liên quan.
7. **Thiết kế Động thay vì Hard-code:** Hãy ưu tiên sử dụng Generic, Reflection hoặc Metadata Configuration thay vì viết code tĩnh (Hard-coded) cho từng thực thể.
8. **QUY TẮC CỰC KỲ QUAN TRỌNG KHI TÁCH SERVICE:** Khi tách source hoặc cấu trúc thành 1 service mới, **BẮT BUỘC phải build lại, debug và fix HẾT tất cả các lỗi (errors) + cảnh báo (warnings)** của những service bị ảnh hưởng / có liên quan trước khi hoàn tất công việc.
9. **CẤU TRÚC CHO FILE README CON:** Mọi file README (`README.md` hoặc `README_PROJECT.md`) được tạo ra để note thông tin một Project/Service cụ thể thì **tuyệt đối phải vẽ/lấy lại sơ đồ Tổng quan Kiến trúc** (dựa trên Sơ đồ ASCII gốc ở thư mục ngoài) để phản ánh rõ vị trí của Service đó trên bản đồ liên kết hệ thống.
10. **DỌN DẸP FILE TẠM:** Tuyệt đối phải tự động xóa các file log sinh ra trong quá trình chạy thử (ví dụ: các file *.txt chứa dữ liệu log, các file *.ps1 dùng để check/test) sau khi xong việc để đảm bảo thư mục dự án luôn sạch sẽ.
