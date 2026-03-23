---
description: PM Assistant - Quy trình tiếp nhận và quản lý yêu cầu
---

<!--
Notion: https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3
Ngày tạo: 2026-03-23
Cập nhật lần cuối: 2026-03-23
-->

# PM Assistant Workflow

Bất cứ khi nào người dùng mô tả một yêu cầu mới (bug, tính năng, hoặc cải tiến), tuân thủ đúng quy trình sau. **KHÔNG bỏ qua bước nào.**

---

## Tổng quan quy trình

```
1. Phân loại yêu cầu
        ↓
2. Phân tích (5W + scope)
        ↓
3. Tạo trang Notion (Issues Tracker)
        ↓  (nếu có UI)
4. Vẽ wireframe Stitch → ghi chú layout & component
        ↓
5. Tạo file .md local (đính kèm Notion ID + Stitch ID)
        ↓
6. Cập nhật INDEX.md
        ↓
7. Chờ user confirm → bắt đầu thực thi
        ↓
8. Cập nhật Notion + .md sau khi hoàn thành
```

---

## Bước 1 — Phân loại yêu cầu

Xác định loại yêu cầu:

| Loại | Ký hiệu | Dấu hiệu |
|------|---------|----------|
| Bug fix | `[fix_bug]` | Lỗi hệ thống, hành vi không mong muốn |
| Enhancement | `[enhance]` | Cải tiến tính năng hiện có, tối ưu hóa |
| Feature mới | `[feature]` | Tính năng mới hoàn toàn |

---

## Bước 2 — Phân tích yêu cầu

Áp dụng đầy đủ skill `erp-analyst`:

- Trả lời 5 câu hỏi: WHO / WHAT / WHEN / CONSTRAINT / EDGE CASE
- Xác định scope: Backend / Frontend / DB / Permission / Job
- Tóm tắt và xác nhận với user trước khi tiến hành tạo tài liệu

> Nếu yêu cầu chưa rõ → hỏi lại **từng câu một** (không hỏi nhiều cùng lúc).

---

## Bước 3 — Tạo trang Notion

> Tạo page trong database **Issues Tracker** (tra cứu database ID tại `INDEX.md`).

### Thuộc tính (Properties)

| Property | Giá trị |
|----------|---------|
| **Title** | `[loại_yêu_cầu] {Tiêu đề ngắn gọn}` |
| **Type** | `fix_bug` / `enhance` / `feature` |
| **Module** | `{Tên module}` (ví dụ: `Administration > Users`) |
| **Status** | `Todo` |
| **Priority** | `Low` / `Medium` / `High` / `Critical` |
| **Date** | Ngày hôm nay (YYYY-MM-DD) |
| **Reporter** | Người yêu cầu (mặc định `User`) |
| **Assignee** | `Antigravity` |

### Body content

```markdown
## 📋 Mô tả
[Mô tả rõ vấn đề / yêu cầu là gì]
Snapshot ngày: YYYY-MM-DD

## 🎯 Mục tiêu & Actor
- **Actor:** [User / Admin / System]
- **Mục tiêu:** [1 câu]

## 🖼 Wireframe / Hình chụp
[Điền sau Bước 4 — Stitch Screen URL + mô tả layout]
[Nếu không có UI: N/A]

## 🔍 Phân tích
### Flow
[Diagram hoặc danh sách bước]

### Scope ảnh hưởng
- Backend: ...
- Frontend: ...
- DB / Migration: ...

## ✅ Danh sách Tasks
- [ ] Task 1: ...
- [ ] Task 2: ...
(Ước tính: X giờ)

## 📝 Ghi chú sau khi hoàn thành
*(Điền sau khi done)*
```

**→ Lưu lại Notion Page ID để dùng ở Bước 5.**

---

## Bước 4 — Vẽ wireframe Stitch (CHỈ khi có UI)

> Bỏ qua bước này nếu yêu cầu không có thay đổi giao diện.

### Thực hiện

```
Project: Mint ERP - Next.js System
Project ID: 12239721184189784077
Tool: mcp_StitchMCP_generate_screen_from_text
```

**Format prompt Stitch (bắt buộc đầy đủ):**

```
[Tên màn hình] — {mô tả chức năng màn hình}

Bố cục (Layout):
- Header: [nội dung, action buttons]
- Navigation/Breadcrumb: [...]
- Main content area: [mô tả vùng chính]
- Footer / Action bar: [...]

Các component chính:
- ComponentA: [mô tả]
- ComponentB: [mô tả]
- ...

Style: Ant Design, màu chủ đạo #1677ff, dark sidebar
```

### Sau khi Stitch tạo xong

1. Ghi lại **Screen ID** từ kết quả.
2. Ghi chú bố cục:

```markdown
### Ghi chú Wireframe
- **Screen ID:** `{stitch-screen-id}`
- **Layout:** Header (title + btn) | Table (columns: ...) | Modal (form fields: ...)
- **Components sẽ tạo:**
  | Component | Loại | Mục đích |
  |-----------|------|----------|
  | `XxxPage` | Server Component | Trang chính, fetch data |
  | `XxxTable` | Server Component | Hiển thị danh sách |
  | `XxxModal` | Client Component | Form tạo/sửa |
```

3. **Cập nhật mục `🖼 Wireframe`** trong Notion page (Bước 3).
4. **Cập nhật danh sách màn hình** trong `erp-frontend-ui/SKILL.md`.

---

## Bước 5 — Tạo file `.md` local

**Tên file & thư mục:**

| Loại | Tên file | Thư mục |
|------|----------|---------|
| Feature / Enhancement | `{tên-tính-năng}.spec.md` | `.agent/specs/{module}/` |
| Bug fix | `bug-{tên-vấn-đề}.spec.md` | `.agent/specs/{module}/` |

**Template bắt buộc:**

```markdown
# [Loại] {Tên tính năng}

> **Notion:** https://www.notion.so/{notion-page-id}
> **Stitch Screen ID:** `{screen-id}` *(bỏ dòng này nếu không có UI)*
> **Ngày tạo:** YYYY-MM-DD
> **Cập nhật lần cuối:** YYYY-MM-DD
> **Status:** draft
> **Module:** {tên service}

---

## 📋 Mô tả

{1-3 câu mô tả ngắn gọn}

## 🎯 Mục tiêu & Actor

- **Actor:** ...
- **Mục tiêu:** ...

## 🖼 UI Design *(bỏ mục này nếu không có UI)*

> Stitch Screen ID: `{id}`

### Bố cục
{Mô tả layout}

### Component sẽ tạo
| Component | Server/Client | Mục đích |
|-----------|--------------|----------|
| `XxxPage` | Server | ... |
| `XxxTable` | Server | ... |
| `XxxModal` | Client | ... |

## 🔀 Flow

{Mermaid diagram hoặc danh sách bước}

## 📐 Scope ảnh hưởng

- [ ] Model / DB
- [ ] API endpoint
- [ ] Permission
- [ ] Frontend
- [ ] Background job / SignalR

## ✅ Checklist

### Backend
- [ ] ...

### Frontend
- [ ] ...

## ⚠️ Rủi ro / Lưu ý

- ...

## 📝 Ghi chú hoàn thành

*(Điền sau khi done)*
```

---

## Bước 6 — Cập nhật INDEX.md

Thêm dòng mới vào bảng tương ứng trong `.agent/specs/INDEX.md`:

```markdown
| {Tên tính năng} | [{file}.spec.md](./{module}/{file}.spec.md) | [Link]({notion-url}) | {Module} | draft |
```

---

## Bước 7 — Trình bày và chờ user confirm

Báo cáo tóm tắt:

```
✅ Đã hoàn thành tài liệu phân tích:

📄 File local:   .agent/specs/{module}/{file}.spec.md
🌐 Notion:       {notion-url}
🎨 Stitch:       Screen ID {id} (nếu có UI)

📋 Kế hoạch thực hiện:
1. ...
2. ...
(Ước tính: X giờ)

⚠️ Rủi ro:
- ...

👉 Xác nhận để tôi bắt đầu code?
```

> **🔴 HARD-GATE: KHÔNG viết bất kỳ dòng code nào trước khi user gõ "confirm" / "ok" / tương đương.**

---

## Bước 8 — Cập nhật sau khi hoàn thành

Sau khi code xong và verify:

1. **File `.md`**:
   - Điền `## 📝 Ghi chú hoàn thành` (đã làm gì, commit nào, side effect).
   - Đổi `Status: done` và cập nhật `Cập nhật lần cuối`.

2. **Notion**:
   - Cập nhật `## 📝 Ghi chú sau khi hoàn thành`.
   - Chuyển **Status → Done**.
   - Đính kèm commit hash hoặc link PR nếu có.

3. **INDEX.md**: Đổi status từ `draft` → `done` / `fixed`.

4. **Cleanup**: Xóa các file `.log`, `.txt` tạm thời nếu có.

---

## Quy tắc bổ sung

- **Title Format**: Luôn bắt đầu bằng `[loại_yêu_cầu]`.
- **Tasks**: Chia nhỏ ≤ 2 giờ mỗi task.
- **Không báo "Done"** nếu chưa cập nhật Notion và file `.md`.
- **Stitch bắt buộc** cho mọi tính năng có thay đổi giao diện.
- **Thứ tự không đổi**: Notion → Stitch → `.md` → code.
