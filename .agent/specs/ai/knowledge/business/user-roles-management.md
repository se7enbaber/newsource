# Hướng dẫn Nghiệp vụ: Quản lý Người dùng và Vai trò (Identity & Access)

## 1. Quản lý Người dùng
Mỗi nhân viên trong hệ thống được cấp một tài khoản truy cập duy nhất. Thông tin người dùng bao gồm:
- **Tên đăng nhập & Thông tin cá nhân**: Định danh nhân viên.
- **Tình trạng hoạt động**: Tài khoản có thể bị khóa tạm thời nếu nhân viên nghỉ phép dài ngày hoặc vi phạm quy định.

## 2. Hệ thống Vai trò (Roles)
Hệ thống không phân quyền cho từng người dùng lẻ mà theo **Nhóm Vai trò (Roles)** (Ví dụ: Kế toán trưởng, Nhân viên bán hàng, Quản lý kho).
- **Gán vai trò**: Một người dùng có thể đảm nhận một hoặc nhiều vai trò cùng lúc.
- **Quyền hạn theo vai trò**: Mỗi vai trò sẽ có một danh sách các công việc được phép thực hiện (Ví dụ: Vai trò 'Kế toán' được phép 'Tạo hóa đơn' nhưng không được 'Xử lý xuất kho').

## 3. Quy trình Cấp quyền
- Admin của tổ chức (Tenant Admin) sẽ chọn nhân viên và gắn các vai trò tương ứng từ danh sách có sẵn.
- Sau khi gán, nhân viên chỉ cần đăng nhập lại để hệ thống cập nhật các menu và chức năng mới được cấp.

## 4. Bảo mật và Truy cập
- Mật khẩu người dùng được mã hóa hoàn toàn, quản trị viên cũng không thể nhìn thấy mật khẩu thực tế.
- Hệ thống hỗ trợ thay đổi mật khẩu định kỳ để nâng cao tính bảo mật.
