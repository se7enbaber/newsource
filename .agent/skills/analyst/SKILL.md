---
name: erp-analyst
description: Dùng khi người dùng đưa ra yêu cầu mới, mô tả vấn đề cần giải quyết, hoặc muốn phân tích một tính năng trước khi bắt tay vào code. Luôn chạy skill này TRƯỚC KHI đề xuất giải pháp kỹ thuật. Không dùng khi yêu cầu đã rõ ràng và chỉ cần fix bug cụ thể.
---

<!--
Notion: https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3
Ngày tạo: 2026-03-23
Cập nhật lần cuối: 2026-03-23
-->

# Analyst — Phân tích Yêu cầu Trước Khi Code

## Nguyên tắc cốt lõi
Không bao giờ đề xuất giải pháp kỹ thuật khi chưa hiểu rõ vấn đề.
Thà hỏi thêm 2 phút còn hơn code sai 2 tiếng.
LUÔN đọc các tài liệu liên quan tới tính năng tại thư mục `.agent/specs` TRƯỚC KHI thực hiện bất kỳ xử lý hoặc đề xuất giải pháp nào.

---

## Quy trình làm việc BẮT BUỘC (theo đúng thứ tự)

```
[Phân tích yêu cầu]
        ↓
[Tạo trang Notion]
        ↓  (nếu có UI)
[Vẽ wireframe trên Stitch → ghi chú layout & component]
        ↓
[Tạo file .md local — đính kèm Notion ID & Stitch screen ID]
        ↓
[Chờ user Confirm → mới bắt đầu code]
```

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

Với mỗi yêu cầu, tự hỏi 5 câu sau. Nếu KHÔNG trả lời được → hỏi lại người dùng (từng câu một):

1. **WHO** — Ai dùng tính năng này? (User thường / Admin / Tenant Admin / System)
2. **WHAT** — Đầu vào là gì, đầu ra mong đợi là gì?
3. **WHEN** — Trigger khi nào? (User click / Schedule / Event / API call)
4. **CONSTRAINT** — Có giới hạn nào không? (Permission, Feature toggle, Tenant scope)
5. **EDGE CASE** — Điều gì xảy ra khi dữ liệu rỗng / lỗi / không có quyền?

### Bước 3 — Xác định scope ảnh hưởng

Sau khi hiểu yêu cầu, map ra các layer bị ảnh hưởng:

- [ ] Model / Database thay đổi?
- [ ] API endpoint mới hoặc sửa?
- [ ] Permission / Feature mới?
- [ ] Frontend page / component thay đổi? *(→ cần Stitch)*
- [ ] Background job / SignalR liên quan?
- [ ] Ảnh hưởng multi-tenant không?
- [ ] Cần migration DB không?

### Bước 4 — Tóm tắt và xác nhận hiểu biết

Trước khi tiến hành tạo tài liệu, LUÔN tóm tắt lại theo format:

---
**Tôi hiểu yêu cầu như sau:**
- Mục tiêu: {1 câu}
- Actor: {ai thực hiện}
- Flow: {mô tả ngắn}
- Scope ảnh hưởng: {các layer liên quan}
- Có UI không: {Có / Không}
- Chưa rõ: {câu hỏi nếu còn thắc mắc}

**Đúng không? Nếu đúng tôi sẽ bắt đầu tạo tài liệu.**

---

### Bước 5 — Tạo trang Notion

> **BẮT BUỘC** trước khi tạo file `.md` local.  
> Tham chiếu Issues Tracker database ID từ `INDEX.md`.

**5a. Tạo page trong Notion** (theo loại yêu cầu):

| Loại | Title Prefix | Database |
|------|-------------|---------|
| Feature | `[feature]` | Issues Tracker |
| Bug fix | `[fix_bug]` | Issues Tracker |
| Enhancement | `[enhance]` | Issues Tracker |

**5b. Nội dung body Notion** (bắt buộc có đủ các mục):

```markdown
## 📋 Mô tả
[Mô tả rõ vấn đề / yêu cầu là gì, version snapshot ngày tháng]

## 🎯 Mục tiêu & Actor
- **Actor:** [User thường / Admin / System]
- **Mục tiêu:** [1-2 câu]

## 🖼 Wireframe / Hình chụp
[Đính kèm Stitch screen ID / URL nếu có UI — xem Bước 6]
[Mô tả ngắn gọn layout và component sử dụng]

## 🔍 Phân tích
### Flow
[Mermaid diagram hoặc danh sách bước]

### Scope ảnh hưởng
- Backend: ...
- Frontend: ...
- DB: ...

## ✅ Danh sách Tasks
- [ ] Task 1: ...
- [ ] Task 2: ...
(Ước tính: X giờ)

## 📝 Ghi chú sau khi hoàn thành
[Điền sau khi done]
```

**5c. Lưu lại Notion Page ID** để đính kèm vào file `.md`.

### Bước 6 — Vẽ wireframe trên Stitch (CHỈ khi có UI)

> Chỉ thực hiện bước này nếu tính năng có **Frontend page / component mới hoặc thay đổi**.

**6a. Tạo màn hình trên Stitch:**

```
Stitch Project: Mint ERP - Next.js System
Project ID: 12239721184189784077
Tool: mcp_StitchMCP_generate_screen_from_text
```

**Prompt mẫu cho Stitch:**
```
[Tên màn hình] — {mô tả màn hình}

Layout bố cục:
- Header: [mô tả]
- Sidebar/Navigation: [mô tả]  
- Main content: [mô tả vùng nội dung chính]
- Footer/Actions: [mô tả]

Các component chính:
- [ComponentName]: [mô tả mục đích]
- ...

Style: Phong cách Ant Design, màu chủ đạo #1677ff, dark sidebar
```

**6b. Sau khi Stitch tạo xong:**
- Ghi chú lại **Screen ID** từ kết quả trả về.
- Mô tả ngắn gọn bố cục: vùng nào chứa component gì.
- Liệt kê tên component sẽ tạo: `PageLayout`, `DataTable`, `FormModal`, v.v.
- **Cập nhật link vào Notion** (phần `🖼 Wireframe / Hình chụp` trong body).
- **Cập nhật danh sách màn hình** trong `erp-frontend-ui/SKILL.md` section `Danh sách màn hình đã đồng bộ`.

### Bước 7 — Tạo file `.md` local

**Quy tắc đặt tên & vị trí:**

| Loại | Tên file | Thư mục |
|------|----------|---------|
| Feature | `{tên-tính-năng}.spec.md` | `.agent/specs/{module}/` |
| Bug fix | `bug-{tên-vấn-đề}.spec.md` | `.agent/specs/{module}/` |
| Enhancement | `{tên-tính-năng}.spec.md` | `.agent/specs/{module}/` |

**Template file `.md`:**

```markdown
# [Loại] {Tên tính năng}

> **Notion:** https://www.notion.so/{notion-page-id}  
> **Stitch Screen ID:** `{screen-id}` *(nếu có UI)*  
> **Ngày tạo:** YYYY-MM-DD  
> **Cập nhật lần cuối:** YYYY-MM-DD  
> **Status:** draft | in-progress | done  
> **Module:** {tên service liên quan}

---

## 📋 Mô tả

{Mô tả ngắn gọn 1-3 câu}

## 🎯 Mục tiêu & Actor

- **Actor:** {User / Admin / System}
- **Mục tiêu:** {1 câu rõ ràng}

## 🖼 UI Design (nếu có)

> Stitch Screen: [{tên màn hình}](https://stitch.withgoogle.com/...) — Screen ID: `{id}`

### Bố cục tổng thể
{Mô tả layout — Header / Sidebar / Main / Actions}

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `PageName` | Trang chính, fetch data | Server |
| `DataTable` | Hiển thị danh sách | Server |
| `FormModal` | Form tạo/sửa | Client |

## 🔀 Flow / Sequence

{Sơ đồ Mermaid hoặc danh sách bước}

## 📐 Scope ảnh hưởng

- [ ] Model / DB: ...
- [ ] API endpoint: ...
- [ ] Permission: ...
- [ ] Frontend: ...
- [ ] Background job: ...

## ✅ Implementation Checklist

### Backend
- [ ] ...

### Frontend
- [ ] ...

## ⚠️ Rủi ro / Lưu ý

- {Điều gì có thể sai nếu không cẩn thận}

## 📝 Ghi chú hoàn thành

*(Điền sau khi done: đã làm gì, commit nào, side effect không)*
```

**7b. Cập nhật `INDEX.md`** — Thêm dòng mới vào bảng tương ứng:

```markdown
| {Tên tính năng} | [{file}.spec.md](./{module}/{file}.spec.md) | [Link]({notion-url}) | {Module} | draft |
```

### Bước 8 — Xác nhận và chờ approve

Sau khi hoàn thành tài liệu, trình bày tóm tắt cho user:

```
✅ Đã tạo tài liệu:
- Notion: {link}
- Stitch: Screen ID {id} (nếu có UI)
- File local: .agent/specs/{module}/{file}.spec.md

📋 Các bước thực hiện đề xuất:
1. {Bước cụ thể}
2. ...

⚠️ Rủi ro cần lưu ý:
- ...

👉 Bạn xác nhận để tôi bắt đầu code?
```

> **🔴 HARD-GATE: KHÔNG viết bất kỳ dòng code nào cho đến khi user confirm.**

### Bước 9 — Hoàn tất (sau khi code xong)

Sau khi hoàn thành code và verify:

1. **Cập nhật file `.md`** — điền mục `Ghi chú hoàn thành`, đổi `Status: done`, ghi ngày.
2. **Đồng bộ Notion** — cập nhật body Notion, chuyển Status → `Done`.
3. **Cập nhật `INDEX.md`** — đổi status thành `done` / `fixed`.
4. **Cập nhật `erp-frontend-ui/SKILL.md`** nếu có màn hình Stitch mới.

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
Export toàn bộ hay theo trang?"

✅ Tốt:
"Trước khi tiến hành, tôi cần xác nhận điểm quan trọng nhất:
Export này dành cho tất cả user hay chỉ Admin?
(Câu trả lời sẽ quyết định tôi đặt permission ở đâu)"

---

## Đặc biệt — Yêu cầu mở rộng Roadmap

Khi được yêu cầu mở rộng Roadmap hoặc bổ sung tính năng mới:
- BẮT BUỘC dùng `search_web` kết hợp skill `erp-product-advisor`
- Tìm hiểu tính năng ERP End-users đang quan tâm trên thị trường
- Sau đó mới tạo tài liệu theo quy trình 9 bước ở trên
