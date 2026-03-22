# Hướng dẫn Nghiệp vụ: Quy trình Quản lý Kho và Tồn kho

## 1. Tổng quan
Hệ thống quản lý kho giúp theo dõi lượng hàng tồn, vị trí lưu kho và các biến động nhập/xuất để đảm bảo chuỗi cung ứng.

## 2. Quy trình Nhập kho (Point of Receipt)
- **Nhập hàng từ nhà cung cấp**: Kiểm tra số lượng thực tế so với Đơn mua hàng (PO).
- **Ghi nhận phiếu nhập**: Nhập số Serial/Lot nếu sản phẩm có quản lý theo vết.
- **Xác nhận nhập kho**: Sau khi xác nhận, số lượng tồn kho sẽ tăng lên ngay lập tức.

## 3. Quy trình Kiểm kê (Inventory Count)
- Thực hiện kiểm kê định kỳ hàng tháng hoặc hàng quý.
- **Khởi tạo bảng kiểm kê**: Hệ thống khóa các giao dịch kho liên quan đến sản phẩm đang kiểm kê.
- **Nhập số lượng thực tế**: Ghi nhận chênh lệch giữa thực tế và sổ sách.
- **Xử lý chênh lệch**: Phê duyệt điều chỉnh để cập nhật lại giá trị tồn kho.

## 4. Các quy tắc đặc biệt
- **Hàng sắp hết (Low Stock)**: Hệ thống tự động gửi cảnh báo khi số lượng xuống dưới mức tồn kho tối thiểu.
- **Vị trí kho (Locations)**: Mỗi sản phẩm phải được gán vào một vị trí cụ thể trong kho để dễ dàng tìm kiếm.
