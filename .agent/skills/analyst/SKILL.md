---
name: erp-analyst
description: Dùng khi người dùng đưa ra yêu cầu mới, mô tả vấn đề cần giải quyết, hoặc muốn phân tích một tính năng trước khi bắt tay vào code. Luôn chạy skill này TRƯỚC KHI đề xuất giải pháp kỹ thuật. Không dùng khi yêu cầu đã rõ ràng và chỉ cần fix bug cụ thể.
---

<!--
Notion: https://www.notion.so/Agent-Workflow-Analysis-Process-32cf1e6a215c8131bf23d0bc01eddad3
Ngày tạo: 2026-03-23
Cập nhật lần cuối: 2026-03-25
-->

# ERP Analyst — Phân tích Yêu cầu & Tài liệu hóa

## Nguyên tắc cốt lõi

> Không bao giờ đề xuất giải pháp kỹ thuật khi chưa hiểu rõ vấn đề.  
> Thà hỏi thêm 2 phút còn hơn code sai 2 tiếng.  
> **LUÔN** đọc các tài liệu liên quan tại `.agent/specs/` TRƯỚC KHI thực hiện bất kỳ xử lý nào.

---

## Quy trình bắt buộc (theo đúng thứ tự)

```
[1. Phân loại & Phân tích]
        ↓
[2. Tóm tắt & Xác nhận với user]
        ↓
[3. Tạo trang Notion (theo template chuẩn)]
        ↓  (nếu có UI)
[4. Vẽ wireframe Stitch → cập nhật Notion]
        ↓
[5. Tạo file .spec.md local (theo template chuẩn)]
        ↓
[6. Cập nhật INDEX.md]
        ↓
[7. Chờ user Confirm → mới bắt đầu code]
        ↓
[8. Hoàn tất: update .md + Notion + INDEX.md]
```

---

## Bước 1 — Phân loại yêu cầu

| Loại | Prefix | Ký hiệu trong tên file |
|------|--------|------------------------|
| Feature mới | `[feature]` | `{ten-tinh-nang}.spec.md` |
| Enhancement | `[enhance]` | `{ten-tinh-nang}.spec.md` |
| Bug fix | `[fix_bug]` | `bug-{ten-van-de}.spec.md` |
| Refactor | `[refactor]` | `refactor-{ten}.spec.md` |

---

## Bước 2 — Phân tích 5W + Scope

Tự hỏi 5 câu sau. Nếu KHÔNG trả lời được → hỏi lại user **từng câu một**:

1. **WHO** — Ai dùng? (User / Admin / Tenant Admin / System)
2. **WHAT** — Đầu vào và đầu ra mong đợi là gì?
3. **WHEN** — Trigger khi nào? (Click / Schedule / Event / API)
4. **CONSTRAINT** — Có giới hạn nào? (Permission, Feature toggle, Tenant scope)
5. **EDGE CASE** — Điều gì xảy ra khi rỗng / lỗi / không có quyền?

### Xác định scope ảnh hưởng

- [ ] Model / Database thay đổi?
- [ ] API endpoint mới hoặc sửa?
- [ ] Permission / Feature mới?
- [ ] Frontend page / component thay đổi? *(→ bắt buộc dùng Stitch)*
- [ ] Background job / SignalR liên quan?
- [ ] Ảnh hưởng multi-tenant không?

### Tóm tắt xác nhận (format bắt buộc)

```
Tôi hiểu yêu cầu như sau:
- Loại: [feature / fix_bug / enhance / refactor]
- Mục tiêu: {1 câu}
- Actor: {ai thực hiện}
- Flow: {mô tả ngắn}
- Scope: {các layer liên quan}
- Có UI: Có / Không
- Chưa rõ: {câu hỏi nếu còn}

Đúng không? Nếu đúng tôi sẽ bắt đầu tạo tài liệu.
```

---

## Bước 3 — Tạo trang Notion

> Tạo page trong database **Issues Tracker** — tra cứu Database ID tại `INDEX.md`.

### Properties bắt buộc

| Property | Giá trị |
|----------|---------|
| **Title** | `[prefix] Tên ngắn gọn` |
| **Type** | `fix_bug` / `enhance` / `feature` |
| **Module** | Tên module (vd: `Administration > AI`) |
| **Status** | `Todo` |
| **Priority** | `Low` / `Medium` / `High` / `Critical` |
| **Date** | YYYY-MM-DD |
| **Assignee** | `Antigravity` |

### Body Notion — Template chuẩn (BẮT BUỘC đủ 6 section)

```markdown
## 📋 Mô tả
[Mô tả rõ vấn đề / yêu cầu. Ghi rõ: Snapshot ngày YYYY-MM-DD]

## 🎯 Mục tiêu & Actor
- **Actor:** [User / Admin / System]
- **Mục tiêu:** [1-2 câu rõ ràng]

## 🖼 Wireframe / UI Design
> Stitch Screen ID: `{id}` | Project: Mint ERP (12239721184189784077)
[Mô tả layout: Header / Sidebar / Main / Footer]
[Liệt kê component chính]
*(N/A nếu không có UI)*

## 🔍 Phân tích
### Flow
[Mermaid diagram hoặc danh sách bước có thứ tự]

### Scope ảnh hưởng
- Backend: ...
- Frontend: ...
- DB / Migration: ...
- Permission: ...

## ✅ Danh sách Tasks
- [ ] Task 1: ...
- [ ] Task 2: ...
*(Ước tính: X giờ)*

## 📝 Ghi chú hoàn thành
*(Điền sau khi done: commit hash, side effect, breaking change)*
```

---

## Bước 4 — Vẽ wireframe Stitch (CHỈ khi có UI)

```
Project: Mint ERP - Next.js System
Project ID: 12239721184189784077
Tool: mcp_StitchMCP_generate_screen_from_text
```

**Format prompt Stitch (bắt buộc):**

```
[Tên màn hình] — {mô tả chức năng}

Layout:
- Header: [nội dung, action buttons]
- Sidebar: [nav items]
- Main content: [mô tả vùng chính]
- Footer / Actions: [pagination, save/cancel]

Component chính:
- [ComponentName]: [mục đích]

Style: Design system "The Observational Lume" — Dark mode, font Manrope/Inter,
primary #c0c1ff, background #0b1326, no-border rule, Lume Dot status indicators.
```

**Sau khi Stitch tạo xong:**
1. Ghi lại **Screen ID**.
2. Cập nhật section `🖼 Wireframe` trong Notion (thêm ảnh + mô tả layout chi tiết).
3. Cập nhật `erp-frontend-ui/SKILL.md` — thêm màn hình vào danh sách đã đồng bộ.

---

## Bước 5 — Tạo file `.spec.md` local

**Vị trí:** `.agent/specs/{module}/{tên-file}.spec.md`

### Template `.spec.md` chuẩn (BẮT BUỘC)

```markdown
# [prefix] Tên tính năng

> **Notion:** https://www.notion.so/{page-id}
> **Stitch Screen ID:** `{id}` *(bỏ nếu không có UI)*
> **Ngày tạo:** YYYY-MM-DD
> **Cập nhật lần cuối:** YYYY-MM-DD
> **Status:** draft | in-progress | done
> **Module:** {service liên quan}

---

## 📋 Mô tả

{1–3 câu mô tả ngắn gọn mục đích của tính năng/bug}

## 🎯 Mục tiêu & Actor

- **Actor:** {User / Admin / System}
- **Mục tiêu:** {1 câu rõ ràng}

## 🖼 UI Design *(bỏ nếu không có UI)*

> Stitch Screen ID: `{id}`

### Bố cục tổng thể
{Mô tả layout — Header / Sidebar / Main / Actions}

### Danh sách Component
| Component | Mục đích | Server/Client |
|-----------|----------|---------------|
| `XxxPage` | Trang chính, fetch data | Server |
| `XxxTable` | Hiển thị danh sách | Server |
| `XxxModal` | Form tạo/sửa | Client |

## 🔀 Flow

```mermaid
sequenceDiagram
    ...
```

*(Hoặc danh sách bước có đánh số)*

## 📐 Scope ảnh hưởng

- [ ] Model / DB: ...
- [ ] API endpoint: ...
- [ ] Permission: ...
- [ ] Frontend: ...
- [ ] Background job / SignalR: ...

## ✅ Checklist

### Backend
- [ ] ...

### Frontend
- [ ] ...

## ⚠️ Rủi ro / Lưu ý

- {Điều có thể sai nếu không cẩn thận}

## 📝 Ghi chú hoàn thành

*(Điền sau khi done: commit hash, side effect, breaking change)*
```

---

## Bước 6 — Cập nhật INDEX.md

Thêm dòng vào bảng tương ứng trong `.agent/specs/INDEX.md`:

```markdown
| Tên tính năng | [file.spec.md](./{module}/file.spec.md) | [Link](notion-url) | Module | draft |
```

---

## Bước 7 — Xác nhận và chờ user approve

```
✅ Đã tạo tài liệu phân tích:

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
> **TIẾP THEO:** Sau khi được confirm, hãy dùng skill `erp-tech-designer` để lập kế hoạch thiết kế kỹ thuật chi tiết (.tech.md) trước khi bắt đầu code.

---

## Bước 8 — Hoàn tất sau khi code xong

1. **File `.spec.md`**: Điền `📝 Ghi chú hoàn thành`, đổi `Status: done`, cập nhật ngày.
2. **Notion**: Cập nhật body, chuyển Status → `Done`, ghi commit hash.
3. **INDEX.md**: Đổi status `draft` → `done` / `fixed`.
4. **Cleanup**: Xóa file `.log`, `.txt` tạm.

---

## Quy tắc hỏi lại

**Hỏi lại khi:**
- Yêu cầu mâu thuẫn với logic hiện tại
- Scope quá lớn, cần xác nhận trước
- Có nhiều cách giải quyết với trade-off khác nhau
- Yêu cầu có thể hiểu theo 2+ nghĩa

**Không hỏi khi:**
- Câu trả lời tự suy ra được từ codebase
- Yêu cầu đã rõ qua context cuộc trò chuyện
- Bug fix nhỏ với nguyên nhân hiển nhiên

**Format hỏi lại (từng câu một):**

```
Trước khi tiến hành, tôi cần xác nhận điểm quan trọng nhất:
{Câu hỏi duy nhất}
(Câu trả lời sẽ quyết định {điều gì})
```

---

## Đặc biệt — Yêu cầu mở rộng Roadmap

Khi được yêu cầu mở rộng Roadmap hoặc bổ sung tính năng mới:
- BẮT BUỘC dùng `search_web` + skill `erp-product-advisor`
- Tìm hiểu xu hướng ERP thị trường trước
- Sau đó mới tạo tài liệu theo 8 bước trên
