---
trigger: always_on
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
