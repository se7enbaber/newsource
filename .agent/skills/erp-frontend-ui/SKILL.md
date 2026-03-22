---
name: mint-erp-frontend
description: Dùng khi viết code Frontend cho project này — gọi API qua proxy, xử lý token/session, tổ chức thư mục App Router, phân biệt Server Component vs Client Component. KHÔNG dùng cho logic Backend (.NET).
---

# Frontend — Next.js 16 App Router

## Kiến trúc proxy bắt buộc

**Client Component không bao giờ gọi thẳng tới GatewayService.**  
Mọi request phải đi qua Next.js proxy route:

```text
Client Component (browser)
  → fetch("/api/proxy/[...path]")         ← relative URL, không có domain
  → Next.js Route Handler (Node server)   ← server-side, tránh CORS
  → GatewayService :5000                  ← BACKEND_URL env variable
  → AdministrationService :7027
```

**Lý do bắt buộc:** Browser → GatewayService trực tiếp sẽ gặp lỗi CORS và SSL certificate policy trên môi trường LAN local.

---

## Cách gọi API — fetch thuần, pattern chuẩn

### Helper function cơ bản

```typescript
// lib/api.ts
const BASE = "/api/proxy";

type FetchOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...init } = options;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}
```

### Gọi trong Server Component (RSC) — ưu tiên dùng

```typescript
// app/invoices/page.tsx
import { apiFetch } from "@/lib/api";
import { getServerToken } from "@/lib/auth"; // lấy token từ session/cookie

export default async function InvoicesPage() {
  const token = await getServerToken();
  const data = await apiFetch<InvoiceListDto>("/invoices", { token });

  return <InvoiceTable data={data} />;
}
```

### Gọi trong Client Component — chỉ khi cần interactivity

```typescript
"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function CreateInvoiceForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: CreateInvoiceDto) {
    setLoading(true);
    try {
      // Token lấy từ context/cookie — xem phần Auth bên dưới
      await apiFetch("/invoices", {
        method: "POST",
        body: JSON.stringify(formData),
        token: getTokenFromCookie(), // hoặc từ context
      });
    } finally {
      setLoading(false);
    }
  }

  return <form>...</form>;
}
```

---

## Tổ chức thư mục — App Router chuẩn

```
app/
├── (auth)/                   # Route group — không ảnh hưởng URL
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx            # Layout riêng cho auth pages
│
├── (dashboard)/              # Route group — các trang cần đăng nhập
│   ├── layout.tsx            # Layout có Sidebar, Header
│   ├── invoices/
│   │   ├── page.tsx          # /invoices — Server Component, fetch data
│   │   ├── [id]/
│   │   │   └── page.tsx      # /invoices/:id
│   │   └── _components/      # Component chỉ dùng trong invoices/
│   │       ├── InvoiceTable.tsx
│   │       └── CreateInvoiceForm.tsx
│   └── users/
│       └── page.tsx
│
├── api/
│   └── proxy/
│       └── [...path]/
│           └── route.ts      # ← Proxy handler — không sửa trừ khi có lý do
│
components/                   # Component dùng chung toàn app
│   ├── ui/                   # Primitive UI (Button, Input, Modal…)
│   └── shared/               # Business component dùng nhiều nơi
│
lib/
│   ├── api.ts                # apiFetch helper
│   └── auth.ts               # getServerToken, getTokenFromCookie
│
types/
│   └── dto/                  # TypeScript types map với DTO từ Backend
│       ├── invoice.dto.ts
│       └── user.dto.ts
```

---

## Server Component vs Client Component

| | Server Component (mặc định) | Client Component (`"use client"`) |
|---|---|---|
| **Dùng khi** | Fetch data, render tĩnh | onClick, useState, useEffect, form submit |
| **Có token** | Lấy từ cookie server-side | Lấy từ cookie client-side hoặc context |
| **Performance** | Tốt hơn — không gửi JS xuống browser | Tốn bundle size hơn |
| **Ví dụ** | `page.tsx`, layout, data display | Form, button, dropdown, modal |

**Quy tắc:** Mặc định viết Server Component. Chỉ thêm `"use client"` khi thực sự cần browser API hoặc React state.

---

## Types / DTO — mapping với Backend

Mỗi DTO từ Backend (`ShareService`) cần có file type tương ứng ở Frontend:

```typescript
// types/dto/invoice.dto.ts

export interface InvoiceDto {
  id: string;           // Guid → string
  invoiceNo: string;
  tenantId: string;     // Có nhưng thường không dùng trực tiếp ở UI
  createdAt: string;    // DateTime → string (ISO 8601)
  isDeleted: boolean;   // Từ IAuditDeleteEntity — thường filter ở Backend
}

export interface CreateInvoiceDto {
  invoiceNo: string;
  // Không truyền tenantId — Backend tự inject
  // Không truyền isDeleted — Backend tự quản lý
}

export interface InvoiceListDto {
  items: InvoiceDto[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}
```

> **Không bao giờ truyền `tenantId` hay `isDeleted` từ Frontend** — Backend tự xử lý qua `BaseService` và `IMultiTenant`.

---

## Xử lý lỗi API — pattern chuẩn

```typescript
// Trong Server Component
try {
  const data = await apiFetch<InvoiceListDto>("/invoices", { token });
  return <InvoiceTable data={data} />;
} catch (err) {
  if (err instanceof Error && err.message.includes("401")) {
    redirect("/login");
  }
  // Hiển thị error UI
  return <ErrorMessage message="Không tải được dữ liệu" />;
}
```

```typescript
// Trong Client Component — hiển thị toast/notification
try {
  await apiFetch("/invoices", { method: "POST", body: JSON.stringify(dto) });
  toast.success("Tạo thành công");
} catch (err) {
  toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
}
```

---

## Proxy Route Handler — cách hoạt động

```typescript
// app/api/proxy/[...path]/route.ts
// Handler này forward mọi request từ client → GatewayService

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const url = `${process.env.BACKEND_URL}/api/${path}`;

  // Forward headers gốc (bao gồm Authorization: Bearer <token>)
  const res = await fetch(url, {
    headers: req.headers,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
// Tương tự cho POST, PUT, DELETE
```

> **Không call `BACKEND_URL` trực tiếp từ Client Component** — biến này chỉ available ở server-side (không prefix `NEXT_PUBLIC_`).

---

## Sai vs Đúng (Anti-patterns)

| Sai | Đúng |
|-----|------|
| `fetch("http://localhost:5000/api/invoices")` từ Client Component | `apiFetch("/invoices")` → qua proxy |
| Dùng `NEXT_PUBLIC_BACKEND_URL` expose gateway ra browser | `BACKEND_URL` (server-only, không prefix NEXT_PUBLIC_) |
| Thêm `tenantId` vào body khi POST | Không truyền — Backend tự inject |
| Viết toàn bộ page là `"use client"` | Chỉ mark `"use client"` ở component nhỏ cần interactivity |
| Đặt component dùng chung vào thư mục `_components/` của 1 route | Đặt vào `components/shared/` nếu dùng nhiều nơi |
| Tạo type inline trong component | Khai báo tập trung trong `types/dto/` |

---

## Stitch UI Design Sync (StitchMCP)

**Mục tiêu:** Quản lý và đồng bộ hóa thiết kế UI của hệ thống lên nền tảng Stitch để phục vụ việc thiết kế mã nguồn, tài liệu hóa và phối hợp.

- **Stitch Project:** `Mint ERP - Next.js System` (Dự án chính cho codebase này)
- **Project ID:** `12239721184189784077`
- **Quy trình:** Khi tạo màn hình mới (`page.tsx`), BẮT BUỘC thực hiện "vẽ" lại màn hình đó lên Stitch bằng công cụ `mcp_StitchMCP_generate_screen_from_text`.

### Danh sách màn hình đã đồng bộ:
*(Chưa có - Sẽ cập nhật sau khi thực hiện Task 2)*

---

## Tham chiếu chéo (Cross-reference)
- Multi-tenant: `mint-erp-multi-tenant` — giải thích tại sao không truyền `tenantId` từ Frontend.
- Permission Frontend: Nếu cần ẩn/hiện UI theo Permission, cần đọc token claim để kiểm tra role — chưa có skill riêng, hỏi lại khi cần.
- SignalR / Notification: `mint-erp-signalr` — cách subscribe WebSocket notification từ Next.js Client.