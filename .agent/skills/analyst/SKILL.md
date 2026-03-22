---
name: erp-analyst
description: Dùng khi người dùng đưa ra yêu cầu mới, mô tả vấn đề cần giải quyết, hoặc muốn phân tích một tính năng trước khi bắt tay vào code. Luôn chạy skill này TRƯỚC KHI đề xuất giải pháp kỹ thuật. Không dùng khi yêu cầu đã rõ ràng và chỉ cần fix bug cụ thể.
---

# Analyst — Phân tích Yêu cầu Trước Khi Code

## Nguyên tắc cốt lõi
Không bao giờ đề xuất giải pháp kỹ thuật khi chưa hiểu rõ vấn đề.
Thà hỏi thêm 2 phút còn hơn code sai 2 tiếng.
LUÔN đọc các tài liệu liên quan tới tính năng tại thư mục `.agent/specs` TRƯỚC KHI thực hiện bất kỳ xử lý hoặc đề xuất giải pháp nào.

## Quy trình làm việc (BẮT BUỘC)
Khi nhận được yêu cầu, hãy tuân thủ quy trình sau:
1. **Đọc tài liệu tổng & cấu trúc**: Xem `INDEX.md`, `STRUCTURE.md` và các spec liên quan.
2. **Tìm tính năng**: Xác định yêu cầu đã có trong spec chưa.
3. **Phân tích (Nếu chưa có)**:
    - Tạo tài liệu `.md` mới trong thư mục chức năng tương ứng tại `.agent/specs/` (ví dụ: `.agent/specs/auth/`, `.agent/specs/users/`).
    - Quy tắc đặt tên file:
        - Nếu là Bug fix: `bug-{tên-vấn-đề}.md`
        - Nếu là Feature/Change Request: `{tên-tính-năng}.md`
    - **Đặc biệt với Roadmap**: Khi được yêu cầu mở rộng Roadmap hoặc bổ sung tính năng mới, BẮT BUỘC sử dụng công cụ tìm kiếm (`search_web`) kết hợp với skill `erp-product-advisor` để tìm hiểu các tính năng mà người dùng ERP (End-users) đang quan tâm và sử dụng nhiều nhất trên thị trường hiện nay (VD: dashboard cá nhân hóa, automation, collaboration tools...).
    - Thiết kế Flow: Vẽ sơ đồ (Mermaid) và đính kèm hình ảnh giao diện mock-up nếu cần.
    - Lập Checklist thực hiện chi tiết.
4. **Xác nhận**: Đợi người dùng kiểm tra, chỉnh sửa và **Confirm**.
5. **Thực thi**: Chỉ bắt đầu code sau khi nhận được sự xác nhận.
6. **Hoàn tất (CỰC KỲ QUAN TRỌNG)**: Sau khi hoàn thành code và verify, BẮT BUỘC cập nhật lại **TẤT CẢ** tài liệu liên quan bao gồm: spec chính, file `INDEX.md`, `STRUCTURE.md`, và bất kỳ specs nào khác bị ảnh hưởng bởi thay đổi này để đảm bảo tài liệu luôn khớp với codebase. Sau đó, **ĐỒNG BỘ** nội dung này lên Notion tương ứng (tra cứu link tại `INDEX.md`). Đối với các Bug fix hoặc tài liệu kỹ thuật, LUÔN cập nhật ngày phát hiện và ngày xử lý để theo dõi.

---

## Quy trình phân tích (theo thứ tự)

### Bước 1 — Đọc và phân loại yêu cầu

Xác định yêu cầu thuộc loại nào:

| Loại | Dấu hiệu | Ví dụ |
|------|----------|-------|
| Feature mới | "Thêm", "Tạo", "Cần có" | "Thêm chức năng export Excel" |
| Thay đổi logic | "Sửa", "Đổi", "Thay" | "Sửa logic phân quyền tenant" |
| Bug fix | "Lỗi", "Không hoạt động", "Bị" | "Bị lỗi 403 khi gán role" |
| Refactor | "Tối ưu", "Dọn dẹp", "Tách" | "Tách component FormModal" |
| Câu hỏi | "Tại sao", "Như thế nào", "Giải thích" | "Tại sao dùng IgnoreQueryFilters" |

### Bước 2 — Kiểm tra độ rõ ràng

Với mỗi yêu cầu, tự hỏi 5 câu sau. Nếu KHÔNG trả lời được → hỏi lại người dùng:

1. **WHO** — Ai dùng tính năng này? (User thường / Admin / Tenant Admin / System)
2. **WHAT** — Đầu vào là gì, đầu ra mong đợi là gì?
3. **WHEN** — Trigger khi nào? (User click / Schedule / Event / API call)
4. **CONSTRAINT** — Có giới hạn nào không? (Permission, Feature toggle, Tenant scope)
5. **EDGE CASE** — Điều gì xảy ra khi dữ liệu rỗng / lỗi / không có quyền?

### Bước 3 — Xác định scope ảnh hưởng

Sau khi hiểu yêu cầu, map ra các layer bị ảnh hưởng:
[ ] Model / Database thay đổi?
[ ] API endpoint mới hoặc sửa?
[ ] Permission / Feature mới?
[ ] Frontend page / component thay đổi?
[ ] Background job / SignalR liên quan?
[ ] Ảnh hưởng multi-tenant không?
[ ] Cần migration DB không?

### Bước 4 — Tóm tắt hiểu biết và xác nhận

Trước khi đề xuất giải pháp, LUÔN tóm tắt lại theo format:

---
**Tôi hiểu yêu cầu như sau:**
- Mục tiêu: {1 câu}
- Actor: {ai thực hiện}
- Flow: {mô tả ngắn}
- Scope ảnh hưởng: {các layer liên quan}
- Chưa rõ: {câu hỏi nếu còn thắc mắc}

**Đúng không? Nếu đúng tôi sẽ tiếp tục phân tích giải pháp.**

---

## Khi nào được phép hỏi lại

Hỏi lại khi:
- Yêu cầu mâu thuẫn với logic hiện tại của hệ thống
- Scope ảnh hưởng quá lớn, cần xác nhận trước khi tiến hành
- Có nhiều cách giải quyết với trade-off khác nhau
- Yêu cầu có thể hiểu theo 2+ nghĩa khác nhau

Không hỏi khi:
- Câu trả lời có thể tự suy ra từ codebase
- Yêu cầu đã đủ rõ qua context cuộc trò chuyện
- Là bug fix nhỏ với nguyên nhân rõ ràng

## Cách hỏi lại hiệu quả

Không hỏi nhiều câu một lúc. Ưu tiên câu hỏi quan trọng nhất trước:

❌ Tệ:
"Bạn muốn export theo định dạng nào? 
Ai được phép export? 
Export toàn bộ hay theo trang? 
Có cần lọc theo ngày không?"

✅ Tốt:
"Trước khi tiến hành, tôi cần xác nhận điểm quan trọng nhất:
Export này dành cho tất cả user hay chỉ Admin?
(Câu trả lời sẽ quyết định tôi đặt permission ở đâu)"

## Output sau khi phân tích xong

Khi đã đủ thông tin, đưa ra phân tích theo format:

### Phân tích: {Tên tính năng}

**Tóm tắt:** {1-2 câu}

**Các bước thực hiện đề xuất:**
1. {Bước cụ thể — layer nào, file nào}
2. ...

**Rủi ro / Cần lưu ý:**
- {Điều gì có thể sai nếu không cẩn thận}

**Câu hỏi còn lại (nếu có):**
- {Chỉ hỏi nếu thực sự cần để tiếp tục}

**Tiếp theo:** Bạn muốn tôi bắt đầu từ bước nào?
