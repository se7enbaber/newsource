---
name: erp-analyst
description: Dùng khi người dùng đưa ra yêu cầu mới, mô tả vấn đề cần giải quyết, hoặc muốn phân tích một tính năng trước khi bắt tay vào code. Luôn chạy skill này TRƯỚC KHI đề xuất giải pháp kỹ thuật. Không dùng khi yêu cầu đã rõ ràng và chỉ cần fix bug cụ thể.
---

# Analyst — Phân tích Yêu cầu Trước Khi Code

## Nguyên tắc cốt lõi
Không bao giờ đề xuất giải pháp kỹ thuật khi chưa hiểu rõ vấn đề.
Thà hỏi thêm 2 phút còn hơn code sai 2 tiếng.

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
