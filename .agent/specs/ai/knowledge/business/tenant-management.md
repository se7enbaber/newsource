# Hướng dẫn Nghiệp vụ: Quản lý Tổ chức và Đa Khách hàng (Multi-tenancy)

## 1. Khái niệm Tenant
Hệ thống hoạt động theo mô hình Multi-tenant, trong đó mỗi "Tenant" là một khách hàng doanh nghiệp riêng biệt. Dữ liệu của các khách hàng được tách biệt hoàn toàn để đảm bảo tính an toàn và bảo mật cao nhất.

## 2. Quy trình Quản lý Tenant
- **Khai báo Tổ chức**: Host Admin thực hiện đăng ký thông tin tổ chức, bao gồm tên hiển thị và định danh duy nhất (Identifier).
- **Phân tách Dữ liệu**: Mỗi tổ chức có thể có một cơ sở dữ liệu (Database) riêng hoặc chia sẻ chung cơ sở dữ liệu nhưng được lọc bằng mã định danh TenantId. Người dùng của công ty này không bao giờ nhìn thấy dữ liệu của công ty khác.
- **Dừng hoạt động**: Khi một tổ chức ngừng sử dụng dịch vụ, Host Admin sẽ chuyển trạng thái sang "Ngừng hoạt động" (Inactive), hệ thống sẽ chặn tất cả các truy cập từ người dùng thuộc tổ chức đó nhưng vẫn giữ lại dữ liệu lịch sử (Soft Delete).

## 3. Vai trò của Quản trị viên Hệ thống (Host Admin)
- Là người có quyền cao nhất, quản lý danh sách các khách hàng đang sử dụng hệ thống.
- Cấp quyền truy cập và phân bổ tài nguyên cho từng tổ chức.
