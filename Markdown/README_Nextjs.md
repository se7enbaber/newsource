# 🚀 MyNextjs Admin Portal

> **Ghi chú:** Đây là file chứa thông tin kỹ thuật chuyên sâu dành riêng cho Frontend (Web). Đối với thông tin tổng quan về cách kết nối hệ thống, vui lòng tham khảo [README.md chính ở thư mục gốc](../README.md).

A modern, enterprise-grade ERP Admin Panel built with **Next.js 16**, **Ant Design 6**, and **TypeScript**.  
Designed for developers coming from a **C# / .NET background** transitioning to modern web development.

> **Ngày cập nhật:** 2026-03-07 (Cập nhật Gen Z Vibe Theme)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.1+](https://nextjs.org/) (App Router, Turbopack) |
| **UI Library** | [Ant Design 6](https://ant.design/) |
| **Styling** | Vanilla CSS + Ant Design Tokens (**Gen Z Vibe Theme**: #7f13ec, #2bd4bd) |
| **State** | React Hooks + Context API |
| **Language** | TypeScript (Strict) |
| **i18n** | `react-i18next` (vi/en) |
| **Backend** | C# / ASP.NET Core (port 7027, OpenIddict auth) |

---

## 🏗 Project Structure (Kiến trúc Frontend)

```text
┌────────────────────────────────────────────────────────┐
│               Trình duyệt (Người dùng)                 │
│         (React UI / Components / Pages render)         │
└───────────────────────────┬────────────────────────────┘
                            │ Thao tác UI, gọi API Service
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Frontend Next.js App                   │
│   ┌────────────────┐       ┌───────────────────────┐   │
│   │ AppLayout      │   →   │ AuthWrapper (Check)   │   │
│   └───────┬────────┘       └──────────┬────────────┘   │
│           │                           │                │
│           ▼                           ▼                │
│   ┌────────────────┐       ┌───────────────────────┐   │
│   │ Pages          │   →   │ UI Components (Grid)  │   │
│   │ (Users, Roles) │       │ FormModal, Controls   │   │
│   └───────┬────────┘       └───────────────────────┘   │
│           │                                            │
│           ▼                                            │
│   ┌────────────────┐                                   │
│   │ API Services   │                                   │
│   │ (auth, user)   │                                   │
│   └───────┬────────┘                                   │
└───────────┼────────────────────────────────────────────┘
            │ Gọi API về đích nội bộ /api/proxy
            ▼
┌────────────────────────────────────────────────────────┐
│               Máy chủ Next.js (Node.js)                │
│    API Proxy (Bypass CORS & Lỗi Chứng chỉ SSL)         │
└───────────────────────────┬────────────────────────────┘
                            │ Forward Request
                            ▼
┌────────────────────────────────────────────────────────┐
│             Backend (YARP Gateway / API)               │
└────────────────────────────────────────────────────────┘
```

### Chi tiết Thư mục

```
my-nextjs/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── (pages)/
│   │   ├── (administrator)/
│   │   │   └── Users/
│   │   │       ├── page.tsx          # Danh sách user (table + search + pagination)
│   │   │       └── FormModal.tsx     # Popup Add / Edit user (tách riêng)
│   │   │   └── Roles/
│   │   │       ├── page.tsx          # Danh sách vai trò
│   │   │       └── FormModal.tsx     # Popup Add / Edit vai trò
│   │   └── products/             # Trang quản lý sản phẩm
│   ├── api/
│   │   ├── proxy/[...path]/      # Custom Proxy — giải quyết CORS & SSL
│   │   └── health/               # Health check endpoint
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppFloatButton.tsx
│   │   │   ├── AppGrid.tsx
│   │   │   ├── AppGridSearch.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppPopup.tsx       # Base modal — isDirty guard + submitting lock
│   │   │   └── AppTour.tsx        # Guided Tours (Ant Design Tour wrapper)
│   │   ├── AuthWrapper.tsx
│   │   └── Navbar.tsx
│   ├── login/
│   └── layout.tsx
├── services/
│   ├── authService.ts
│   ├── roleService.ts     # Role APIs
│   └── userService.ts
├── lib/
│   ├── ThemeProvider.tsx
│   └── I18nProvider.tsx
├── locales/
│   ├── vi/common.json
│   └── en/common.json
├── next.config.ts
└── .env.local
```

---

## 📁 Mô tả chi tiết từng file

---

### 🔧 Cấu hình & Môi trường

---

#### `next.config.ts`
Cấu hình chính của Next.js.

```ts
experimental: {
    serverActions: {
        allowedOrigins: ['192.168.x.x:3000', 'localhost:3000', 'localhost:3001']
    }
}
```

- **`allowedOrigins`**: Cho phép trình duyệt từ IP mạng nội bộ kết nối tới Next.js Dev Server qua WebSocket (HMR) và thực hiện Server Actions an toàn. Nếu thiếu, bạn sẽ thấy cảnh báo `Cross origin request detected`.

---

#### `.env.local`
Biến môi trường cục bộ — **không commit lên Git**.

```env
# URL proxy — trình duyệt gọi vào đây
NEXT_PUBLIC_API_ADMIN_URL=/api/proxy

# URL thực của backend — chỉ Next.js Server đọc
BACKEND_URL=https://localhost:7027

# Bỏ qua lỗi self-signed SSL (chỉ dùng trong dev)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

- **`NEXT_PUBLIC_`** prefix: biến có thể đọc được ở phía Client (trình duyệt).
- **`BACKEND_URL`** (không có prefix): chỉ Node.js server đọc được — an toàn để chứa URL nội bộ.
- **`NODE_TLS_REJECT_UNAUTHORIZED=0`**: tắt kiểm tra SSL, cho phép kết nối tới backend dùng chứng chỉ tự ký (self-signed cert) khi debug local.

---

### 🌐 API Proxy

---

#### `app/api/proxy/[...path]/route.ts`
**Custom Proxy Route Handler** — giải pháp thay thế cho `rewrites` trong `next.config.ts`.

**Lý do không dùng `rewrites`**: `rewrites` của Next.js không cho phép bỏ qua kiểm tra SSL (`NODE_TLS_REJECT_UNAUTHORIZED`), dẫn đến lỗi `DEPTH_ZERO_SELF_SIGNED_CERT`.

**Luồng hoạt động:**
```
Browser   →  POST /api/proxy/connect/token
Next.js Server  →  POST https://localhost:7027/connect/token  (bỏ qua SSL)
Backend   →  { access_token: "..." }
```

**Tính năng:**
- Hỗ trợ đầy đủ: `GET`, `POST`, `PUT`, `DELETE`.
- Tự động forward `Authorization` header từ client sang backend.
- Tự động forward `body` (JSON hoặc `application/x-www-form-urlencoded`).
- Tự động forward `Content-Type` header.
- Log mỗi request: `Proxying POST to: connect/token`.
- Trả về lỗi rõ ràng nếu backend lỗi (kèm HTTP status code).

```ts
// Mọi HTTP method đều dùng chung 1 handler
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
```

---

#### `app/api/health/route.ts`
Endpoint kiểm tra server Next.js đang chạy bình thường.

```
GET /api/health
→ { "status": "ok", "time": "2026-02-26T..." }
```

---

### 🔐 Authentication

---

#### `app/components/AuthWrapper.tsx`
**Higher-Order Component** bảo vệ toàn bộ ứng dụng khỏi truy cập trái phép.

Được bọc ngay trong `AppLayout`, áp dụng cho **mọi route** ngoại trừ `/login`.

**Logic:**
| Tình huống | Hành động |
|---|---|
| Không có token + không ở `/login` | Redirect → `/login` |
| Có token + đang ở `/login` | Redirect → `/products` |
| Hợp lệ | Hiển thị trang bình thường |

**Tối ưu (2026-03-04):** Đọc `localStorage` đồng bộ lúc init bằng `useRef` thay vì chờ `useEffect` → loại bỏ **flash spinner** không cần thiết khi user đã có token hợp lệ. Dùng `router.replace()` thay vì `router.push()` để không lưu history entry thừa.

```tsx
// Kiểm tra token đồng bộ ngay khi init (trước paint)
const initialToken = useRef<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
);
```

---

#### `services/authService.ts`
Xử lý đăng nhập / đăng xuất với Backend theo chuẩn **OpenIddict / OAuth2 Password Flow**.

**`loginApi(values)`**
- Gửi `POST /api/proxy/connect/token`
- Body dạng `application/x-www-form-urlencoded`:
  ```
  grant_type=password
  username=admin
  password=Password123!
  client_id=swagger
  tenant=Admin
  ```
- Trả về `{ access_token }` → lưu vào `localStorage`.

**`logoutApi()`** *(Mới — 2026-02-28)*
- Gửi `POST /api/proxy/connect/logout` (kèm Bearer token).
- Dùng `finally` — dù API thành công hay lỗi: **luôn** xóa token và redirect `/login`.
- Tránh trường hợp backend lỗi khiến user bị kẹt không đăng xuất được.

**`handleUnauthorized()`** *(Mới — 2026-02-28)*
- Gọi khi API trả về `401 Unauthorized`.
- Xóa `access_token` khỏi `localStorage` TRƯỚC rồi mới redirect `/login`.
- Tránh vòng lặp: `AuthWrapper` có token + ở `/login` → redirect `/products` → 401 lại.

---

### 👤 Quản lý người dùng

---

#### `services/userService.ts`

**`getUsersApi(pageNumber, pageSize)`**
- Gửi `GET /api/proxy/api/users?PageNumber=1&PageSize=10`
- Đính kèm `Authorization: Bearer <token>` tự động.
- Nếu 401 → gọi `handleUnauthorized()` (xóa token + redirect `/login`).
- Trả về `{ items: [], totalCount: n }` (server pagination).

**`createUserApi(payload)`**
- Gửi `POST /api/proxy/api/Users`
- Body JSON:
  ```json
  {
    "userName": "...",
    "fullName": "...",
    "email": "...",
    "password": "...",
    "phoneNumber": "...",
    "dateOfBirth": "2000-01-01T00:00:00.000Z",
    "roles": ["RoleName"],
    "isActive": true,
    "avatarUrl": null
  }
  ```
- Nếu 401 → gọi `handleUnauthorized()`.
- Xử lý lỗi từ server, parse message lỗi để hiển thị cho người dùng.

**`updateUserApi(id, payload)`** *(Mới — 2026-02-28)*
- Gửi `PUT /api/proxy/api/Users/{id}`
- `password` là optional — không gửi nếu để trống (form xóa khỏi payload trước khi gọi).
- Nếu 401 → gọi `handleUnauthorized()`.
- Xử lý lỗi từ server, parse message lỗi để hiển thị cho người dùng.

---

#### `services/roleService.ts` *(Mới — 2026-02-28)*

**`getRoleDropdownApi()`**
- Gửi `GET /api/proxy/api/roles/get_role_dropdown`
- Đính kèm `Authorization: Bearer <token>` tự động.
- Nếu 401 → gọi `handleUnauthorized()`.
- Trả về `RoleDropdownItem[]`:
  ```ts
  interface RoleDropdownItem {
      name: string; // Tên vai trò — vừa là hiển thị vừa là giá trị gửi lên API
  }
  ```
- Dùng để populate **Checkable Tags** trong modal tạo/sửa user.

**`updateRoleApi(id, payload)`** *(Mới — 2026-02-28)*
- Gửi `PUT /api/proxy/api/roles/{id}`
- Nếu 401 → gọi `handleUnauthorized()`.

---

### 🛡 Quản lý Vai trò (Roles) *(Mới — 2026-02-28)*

---

#### `app/(pages)/(administrator)/Roles/page.tsx`
Trang **Danh sách Vai trò** — quản lý toàn bộ các vai trò trong Tenant.

- **Hiển thị bảng**: Tên vai trò, Mô tả, và **Trạng thái (Status)**.
- Cột Trạng thái sử dụng màu sắc (Xanh: Hoạt động / Đỏ: Vô hiệu) để nhận diện nhanh.
- Hỗ trợ tìm kiếm nhanh và phân trang server-side.

#### `app/(pages)/(administrator)/Roles/FormModal.tsx`
Component popup quản lý thêm/sửa vai trò, tích hợp quản lý quyền hạng.

- **Dữ liệu hệ thống**: Trường `IsSystemRole` được ẩn khỏi UI nhưng được sử dụng để:
    - Khóa trường **Tên vai trò** và **Trạng thái** đối với các vai trò hệ thống hoặc Admin.
- **Quản lý Quyền hạng**:
    - Popup "Quản lý Quyền hạng" cho phép chọn quyền theo từng module (Users, Roles, Tenants...).
    - **Logic chọn quyền**: Đã được tối ưu để hỗ trợ chọn nhiều module cùng lúc mà không bị mất dữ liệu khi chuyển nhóm. Hỗ trợ "Chọn tất cả" nhanh cho từng module.
    - Đối với vai trò **Admin**, toàn bộ quyền được tự động check và khóa (Read-only).

---

#### `app/(pages)/(administrator)/Users/page.tsx`
Trang **Danh sách Người dùng** — chỉ chịu trách nhiệm về list, search, pagination.

- Mở modal Add: `handleOpenAdd()` → `editingUser = null`
- Mở modal Edit: `handleOpenEdit(record)` → `editingUser = UserDataType`
- Sau submit thành công: `handleModalSuccess()` → re-fetch danh sách

#### `app/(pages)/(administrator)/Users/UserFormModal.tsx` *(Cập nhật — 2026-02-28)*
Component **popup tự quản lý** toàn bộ state, form, roles, submit. Dùng chung cho cả Add và Edit.
Sử dụng `AppPopup` làm base modal (thay thế `Modal` trực tiếp) và tách giao diện form thành `UserForm` riêng.

**Kiến trúc phân lớp:**
```
AppPopup (base)          ← generic, tái sử dụng mọi nghiệp vụ
    ↑ dùng
UserFormModal            ← quản lý state + logic (fetch, submit, validation)
    ↓ truyền qua content={}
UserForm                 ← pure UI component, chỉ render các field
```

**Props:**
| Prop | Type | Mô tả |
|---|---|---|
| `open` | `boolean` | Trạng thái mở/đóng modal |
| `editingUser` | `UserDataType \| null` | `null` = Add mode; có data = Edit mode |
| `onSuccess` | `() => void` | Callback sau khi submit thành công |
| `onClose` | `() => void` | Callback đóng modal |

**Cơ chế Add / Edit:**
- `editingUser = null` → title "➕ Thêm", giao diện Add, gọi `createUserApi`
- `editingUser = {...}` → title "✏️ Cập nhật", pre-fill form, gọi `updateUserApi`
- `userName` luôn bị **disable** ở Edit mode (không cho đổi tên đăng nhập)

**Tính năng popup:**
| Field | Bắt buộc | Ghi chú |
|---|---|---|
| Tên đăng nhập | ✅ | Disabled ở Edit mode |
| Họ và tên | ❌ | Inline cạnh Tên đăng nhập |
| Mật khẩu | ✅ Add / ❌ Edit | Add: bắt buộc, min 6 ký tự. Edit: tùy chọn — để rỗng thì gửi `""` (backend giữ nguyên MK) |
| Email | ✅ | Validate format. Inline cạnh Mật khẩu |
| Số điện thoại | ❌ | Inline cạnh Ngày sinh |
| Ngày sinh | ❌ | DatePicker DD/MM/YYYY, tắt ngày tương lai |
| Trạng thái | ❌ | Switch Hoạt động / Vô hiệu, mặc định: bật |
| Vai trò | ✅ | **Checkable Tags** — load từ API, chọn nhiều |

**Lock form khi đang lưu:**
- `submitting=true` → truyền vào `AppPopup` → lock nút Cancel, X, Escape, click-ngoài
- `<Form disabled={submitting}>` → lock tất cả Input, DatePicker, Switch tự động
- `CheckableTag` dùng guard `!submitting &&` + `cursor: not-allowed` riêng (không phải Form control)

**isDirty guard khi đóng popup:**
- `isDirty` được set bởi `Form.onValuesChange` và `handleTagChange`
- Khi user bấm Cancel / X trong khi đang có thay đổi → `AppPopup` hiện dialog xác nhận
- Reset `isDirty = false` khi mở modal mới hoặc submit thành công

**State quan trọng:**
```ts
const [submitting, ...]    // Đang gọi API → lock toàn bộ popup
const [isDirty, ...]       // Form đã bị thay đổi → hỏi xác nhận khi Cancel
const [roles, ...]         // Danh sách vai trò từ API
const [rolesLoading, ...]  // Loading khi fetch vai trò
const [selectedRoles, ...] // Các role đang được chọn (track riêng, không qua Form store)
```

**Lý do dùng nested Form.Item + RolesHiddenField:**
| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| `key` prop warning | Ant Design Field dùng `React.cloneElement` trên children | Tách tags ra **ngoài** scope của Field |
| Uncontrolled → Controlled warning | `<input type="hidden" />` nhận `value={undefined}` ban đầu | Dùng `RolesHiddenField` — render `null`, absorb props mà không chạm DOM |

```tsx
// ⚠️ roles không lấy từ form.validateFields() mà từ selectedRoles state
await createUserApi({ ...values, roles: selectedRoles }); // ✔️ đúng
await createUserApi(values);                               // ❌ sai
```

---

### 🎨 UI Components

---

#### 🧩 Tiêu chuẩn phát triển phân tách & tái sử dụng (Coding Standards)

Để đảm bảo source code dễ bảo trì và duy trì sự nhất quán của giao diện (nhất là khi phát triền hoặc clone giao diện mới), tất cả các Developer cần tuân thủ **Tiêu chí xài chung template**:

1. **Sử dụng Template & Wrapper chuẩn**:
   - Tất cả các thao tác CRUD cơ bản phải tái sử dụng Component đã chuẩn hoá trong `app/components/common/` (cụ thể: dùng `AppGrid` thay vì `Table` thuần của Ant Design, `AppButton` thay vì `Button`, `AppPopup` thay vì `Modal`).
   - Tuyệt đối **không tự định nghĩa lại** các cấu trúc cơ bản đã được bọc lại (wrapped) để đảm bảo đồng bộ về giao diện (Loading, Padding, Margin, Màu sắc, Phân quyền).

2. **Nguyên tắc tách file (DRY - Don't Repeat Yourself)**:
   - **Bất cứ khối giao diện (Component) hoặc logic (Hook) nào được sử dụng lặp lại từ 2 nơi trở lên** đều BẮT BUỘC phải được tách ra thành một file độc lập.
   - Component dùng chung cho toàn bộ dự án: Đặt tại `app/components/common/`.
   - Component dùng chung nội bộ trong một phân hệ (Domain-driven): Đặt tại thư mục `components/` riêng của phân hệ đó, ví dụ `app/(pages)/(administrator)/Users/components/`.

---

#### `app/components/common/AppGrid.tsx`
**Wrapper** bọc Ant Design `<Table>`, là component bảng chuẩn dùng trong toàn ứng dụng.

| Props | Mô tả |
|---|---|
| `showCheckbox` (default: `true`) | Bật/tắt checkbox chọn nhiều dòng |
| `onSelectionChange` | Callback khi người dùng chọn dòng |
| `pagination` | Cấu hình phân trang; truyền `false` để tắt |
| `...TableProps` | Toàn bộ props của Ant Design Table |

**Tính năng tích hợp sẵn:**
- Phân trang nhỏ (`size: 'small'`) với các tùy chọn `[10, 20, 50, 100]`.
- Hiển thị tổng số dòng: `"Tổng cộng 120 dòng"`.
- Tự động áp dụng `primaryColor` từ `ThemeProvider`.
- Bo góc `6px` đồng bộ với toàn bộ layout.

---

#### `app/components/common/AppGridSearch.tsx`
**Custom Hook** cung cấp tính năng filter theo từng cột cho `AppGrid`.

**Export:** `useAppGridSearch()` → trả về `{ getColumnSearchProps }`.

**Cách dùng:**
```tsx
const { getColumnSearchProps } = useAppGridSearch();

// Trong định nghĩa columns:
{
    ...getColumnSearchProps('userName', 'Tên đăng nhập'),
    dataIndex: 'userName',
    align: 'center',
}
```

**Tính năng:**
- Dropdown filter xuất hiện khi click icon `FilterOutlined`.
- Ô input tìm kiếm với nút **Search** và **Reset**.
- Nút Search dùng màu `primaryColor` đồng bộ theme.
- Icon filter đổi màu (sáng hơn) khi cột đang được filter.
- Type-safe với Generic `<T>`: `getColumnSearchProps<UserDataType>('userName', ...)`.

---

#### `app/components/common/AppButton.tsx`
**Button đa năng** với thiết kế nhất quán, hỗ trợ phân quyền và debounce.

| `btnType` | Style | Dùng cho |
|---|---|---|
| `add` | Primary, màu theme | Thêm mới record |
| `export` | Màu theme, viền | Xuất Excel / PDF |
| `edit` | Text, hover cam nhạt | Sửa record trong bảng |
| `delete` | Text, màu đỏ, hover đỏ nhạt | Xóa record trong bảng |
| `view` | Border xám | Xem chi tiết |

**Props đặc biệt:**
- `data?: T` — dữ liệu đính kèm, sẽ được truyền vào callback `onClick(e, data)`.
- `permission?: string` — nếu user không có quyền, nút **ẩn hoàn toàn** (return `null`).
- `useDebounce?: boolean` — bật debounce 300ms, ngăn click liên tục gọi API dư thừa.
- `title?: string` — text hiển thị trong Tooltip khi hover.

---

#### `app/components/common/AppPopup.tsx` *(Mới — 2026-02-28)*
**Base Modal Component** — wrapper chuẩn dùng cho mọi popup nghiệp vụ trong ứng dụng.

**Props:**
| Prop | Type | Default | Mô tả |
|---|---|---|---|
| `isDirty` | `boolean` | `false` | Form đã bị thay đổi — Cancel sẽ hỏi xác nhận bỏ thay đổi |
| `submitting` | `boolean` | `false` | Đang gọi API lưu — lock toàn bộ popup |
| `content` | `ReactNode` | — | Nội dung truyền vào (ưu tiên hơn `children`) |
| `...ModalProps` | — | — | Toàn bộ props của Ant Design `Modal` |

**Tính năng tích hợp sẵn:**
- **`centered` mặc định**: Popup luôn hiển thị căn giữa (`centered`) thay vì rơi từ trên xuống, tạo trải nghiệm UX thân thiện và hiện đại.
- **`isDirty` guard**: khi user bấm Cancel / X / Escape mà form có thay đổi chưa lưu → hiện `Modal.confirm` hỏi xác nhận. Nếu xác nhận → gọi `onCancel`.
- **`submitting` lock**: khi đang gọi API → disable nút Cancel, ẩn nút X, tắt click-ngoài (`maskClosable=false`), tắt Escape (`keyboard=false`).
- **`confirmLoading`** tự động binding với `submitting` → nút OK hiện spinner.
- **`title` styling**: áp dụng `primaryColor` và `fontWeight: 600` tự động.
- **`okButtonProps`** tự động dùng `primaryColor` cho nút Lưu.
- `maskClosable` mặc định là `false` (an toàn hơn `Modal` gốc).
- **Tour/Help Button**: Tự động hiển thị nút Help (?) kế bên tiêu đề của popup (sử dụng Flex layout để không bị che khuất trong bản build Production) khi truyền prop `tourSteps`, hỗ trợ mở Tour hướng dẫn chi tiết các thành phần bên trong Modal.

**Cách dùng cho nghiệp vụ mới:**
```tsx
// 1. Định nghĩa UI form riêng biệt
function ProductForm({ onDirty }: { onDirty: () => void }) {
    return (
        <Form layout="vertical" onValuesChange={onDirty}>
            <Form.Item label="Tên sản phẩm" name="name"><Input /></Form.Item>
        </Form>
    );
}

// 2. Dùng AppPopup trong trang, truyền form vào qua content={}
const [isDirty, setIsDirty] = useState(false);
const [submitting, setSubmitting] = useState(false);

<AppPopup
    title={t('add_product')}
    open={isOpen}
    onOk={handleSubmit}
    onCancel={() => setIsOpen(false)}
    isDirty={isDirty}
    submitting={submitting}
    content={<ProductForm onDirty={() => setIsDirty(true)} />}
/>
```

**i18n keys cần có:**
| Key | Nội dung gợi ý |
|---|---|
| `confirm_discard_title` | "Bỏ thay đổi?" |
| `confirm_discard_message` | "Dữ liệu chưa được lưu sẽ bị mất." |
| `discard` | "Bỏ" |
| `stay` | "Ở lại" |

---

#### `app/components/common/AppFloatButton.tsx`
**Nút cài đặt nổi** (góc dưới phải màn hình) cho phép tùy chỉnh giao diện real-time và đăng xuất.

**Các tính năng:**
| Action | Mô tả |
|---|---|
| 🎨 Theme | 6 màu: Teal, Blue, Purple, Green, Orange, Red — lưu vào `localStorage` |
| ☀️ Dark Mode | (Placeholder, chưa implement) |
| 🔤 Font Size | (Placeholder, chưa implement) |
| ▦ Compact | (Placeholder, chưa implement) |
| 🌐 Language | Chuyển ngôn ngữ: VI / EN / JP — lưu vào `localStorage` |
| 🔴 Logout | Hiện `Modal.confirm` xác nhận → gọi `logoutApi()` → xóa token + về `/login` |
| ⬆ Back to Top | Hiện khi scroll xuống quá 400px, click để cuộn về đầu |

---

#### `app/components/common/AppLayout.tsx`
Layout chính của toàn ứng dụng. Bọc tất cả các trang.

- Ẩn `<Navbar />` và thu nhỏ padding khi đang ở trang `/login`.
- Bọc toàn bộ nội dung trong `<AuthWrapper>` để kiểm tra auth.

---

### 🎨 Providers & Utilities

---

#### `lib/ThemeProvider.tsx`
**Context Provider** quản lý màu sắc chủ đạo của toàn bộ ứng dụng.

- Màu mặc định: **`#00b5ad`** (Teal).
- Khi đổi màu → lưu vào `localStorage` → khởi động lại vẫn giữ màu.
- Bọc `<ConfigProvider>` của Ant Design để áp dụng token màu toàn cục.
- Bọc `<App>` của Ant Design để `message`, `modal`, `notification` hoạt động đúng.

**Hook sử dụng:**
```ts
const { primaryColor, setPrimaryColor } = useTheme();
```

---

## ⚙️ Configuration

### `.env.local`
```env
NEXT_PUBLIC_API_ADMIN_URL=/api/proxy
BACKEND_URL=https://localhost:7027
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 🚀 Getting Started

```bash
# 1. Cài đặt
npm install

# 2. Chạy dev
npm run dev
# Local:   http://localhost:3000
# Network: http://192.168.x.x:3000

# 3. Build production
npm run build && npm start
```

### 📦 Tự động Build & Deploy Toàn hệ thống
Dự án có sẵn script tự động build cả Frontend & Backend chung phần lõi nằm ở thư mục gốc. 
Bạn chỉ cần chạy file **`Build\AppPublish.bat`** tại thư mục gốc của dự án, mọi code nội bộ Next.js sẽ tự động được thu thập, đóng gói chung vào thư mục `Build\Release\` cùng với Backend.

---

## 📋 API Endpoints (qua Proxy)

| Method | Proxy URL | Backend URL | Mô tả |
|---|---|---|---|
| `POST` | `/api/proxy/connect/token` | `/connect/token` | Đăng nhập, lấy JWT |
| `POST` | `/api/proxy/connect/logout` | `/connect/logout` | Đăng xuất, hủy phiên |
| `GET` | `/api/proxy/api/users?PageNumber=1&PageSize=10` | `/api/users` | Lấy danh sách user (server pagination) |
| `POST` | `/api/proxy/api/Users` | `/api/Users` | Tạo người dùng mới |
| `PUT` | `/api/proxy/api/Users/{id}` | `/api/Users/{id}` | Cập nhật người dùng |
| `GET` | `/api/proxy/api/roles/get_role_dropdown` | `/api/roles/get_role_dropdown` | Lấy danh sách vai trò cho dropdown/tags |
| `GET` | `/api/health` | *(nội bộ)* | Kiểm tra Next.js server |

### 🔑 Quản lý Phân quyền & Menu (Dynamic Permissions & Features) *(Cập nhật — 2026-03-04)*

Hệ thống hiện sử dụng cơ chế bảo mật 2 lớp: **Feature Toggle** (Cấp Tenant) và **Permissions** (Cấp User), đảm bảo đồng bộ hoàn toàn với Backend.

**Cấu trúc kỹ thuật:**
- **Bảo mật 2 lớp**: 
  - **Feature**: Kiểm soát gói dịch vụ của Tenant (VD: Tenant mua gói MDM mới hiện menu Sản phẩm).
  - **Permission**: Kiểm soát hành động của User trong module đó (VD: Xem, Thêm, Sửa).
- **Giải mã Token (`lib/auth-utils.ts`) — Tối ưu 2026-03-04**:
  - Thêm `getAllUserInfo()`: decode JWT **1 lần duy nhất**, trả về toàn bộ thông tin (permissions, features, tenantName, tenantCode, userName, tenantId, userId).
  - Giảm từ 7 lần `localStorage.getItem()` + `atob` xuống còn 1 lần mỗi lần cần cập nhật permissions.
  - Các hàm riêng lẻ (`getUserPermissions`, `getTenantName`, ...) vẫn giữ nguyên để tương thích ngược.
- **`PermissionProvider.tsx` — Tối ưu 2026-03-04**:
  - Dùng `getAllUserInfo()` thay vì 5 hàm riêng lẻ → decode JWT **1 lần** cho cả 5 state.
  - `refreshAccess` được `useCallback` móc để stable reference, tránh re-render không cần thiết.
  - Reset về trạng thái rỗng an toàn khi không có token (logout, hết hạn).
- **Bảo vệ cấp Trang (`lib/AccessGuard.tsx`)**:
  - Component `AccessGuard` bọc ngoài các trang để kiểm tra điều kiện truy cập.
  - Trả về giao diện **403 Forbidden** kèm thông báo chi tiết nếu Tenant chưa kích hoạt tính năng hoặc User thiếu quyền.
- **Logic Menu thông minh (`lib/menu-utils.ts`)**:
  - Menu Folder (Cha) sẽ **tự động ẩn** nếu không chứa bất kỳ menu con nào hợp lệ.
  - Loại bỏ các khai báo quyền dư thừa ở cấp cha trong `menu-config.json`.
- **Vai trò Admin (Wildcard)**: Tự động bypass toàn bộ kiểm tra Permission và Feature.

### 🧭 Nguyên tắc cấu hình Menu (`menu-config.json`)

Hệ thống quản lý thanh điều hướng (Sidebar Menu) thông qua cấu hình JSON tập trung (`constants/data/menu-config.json`). Các thuộc tính sẽ được đọc và lọc tự động bởi `menu-utils.ts` dựa trên các nguyên tắc bắt buộc sau:

| Thuộc tính | Mô tả và Quy tắc áp dụng |
|---|---|
| **`titleKey`** | Khóa thông dịch (i18n key) dùng để dịch sang tên hiển thị trên Menu (ví dụ: `menu_users` sẽ dịch thành "Quản lý người dùng" hoặc "User Management" tùy ngôn ngữ). |
| **`path`** | Đường dẫn URL trang truy cập khi người dùng click vào Menu (ví dụ: `/users`). Nếu đây chỉ là thư mục cha chứa Menu con (không click được chuyển trang), sử dụng `path: "#"`. |
| **`order`** | Thứ tự ưu tiên hiển thị của Menu từ trên xuống dưới (số càng nhỏ càng ở trên). **Lưu ý**: Nếu cấu hình sai (có 2 menu trùng số `order`), hệ thống sẽ tự động sắp xếp theo bảng chữ cái (alphabet) của tiêu đề Menu. |
| **`icon`** | Tên Icon đại diện cho Menu (Sử dụng tên component lấy từ thư viện `@ant-design/icons`, ví dụ: `UserOutlined`). |
| **`requiredPermissions`** | **(Quyền User)** Danh sách các chuỗi quyền bắt buộc (VD: `AdministrationService.Users.View`) để user nhìn thấy Menu này. <br/> 👉 **Ngoại lệ (Bypass)**: Đối với người dùng có `username` là `admin`, hệ thống sẽ tự động cấp quyền tối đa `['*']` và bypass kiểm tra này. Tài khoản admin sẽ thấy tất cả. |
| **`requiredFeature`** | **(Gói Tính năng)** Menu này sẽ bị vô hiệu hóa nếu Tenant (Công ty) không sở hữu Feature được chỉ định (VD: `Feature.MDM`). <br/> 👉 **Ngoại lệ (Bypass)**: Đối với các Tenant hệ thống (Tenant có mã là `Admin` hoặc `Host`), hệ thống tự coi như họ có toàn bộ Features, do đó Tenant Admin sẽ thấy hết. |
| **`requiredAdminTenant`** | **(Khóa cấp hệ thống)** Nếu đặt thành `true`, Menu này (VD: "Quản lý Tenants") **CHỈ** giới hạn cho Tenant của máy chủ (`Host`/`Admin`). Toàn bộ các Tenant khách hàng bình thường sẽ bị ẩn hoàn toàn, bất kể họ phân quyền cho nhau ra sao. |

### 🚀 Feature Toggle & Tenant Control *(Mới — 2026-03-01)*

Hệ thống hỗ trợ đóng/mở tính năng chi tiết tới từng màn hình, giúp quản lý gói sản phẩm linh hoạt.

**Cấu trúc Feature (Backend & Frontend):**
- **Sử dụng chuỗi phân cấp**: `Feature.{Module}.{SubModule}`
  - `Feature.Administration`: Toàn bộ phân hệ quản trị.
  - `Feature.Administration.Users`: Chỉ module Quản lý người dùng.
  - `Feature.MDM.Products`: Chỉ module Sản phẩm.
- **Backend (ASP.NET Core)**:
  - Dùng `[RequiredFeature(Features.Administration.Users)]` trên Controller.
  - `FeatureAuthorizationHandler` kiểm tra claim `Feature` trong token.
- **Frontend (Next.js)**:
  - Dùng thuộc tính `requiredFeature` trong `menu-config.json`.
  - Dùng `<AccessGuard feature="..." />` để bảo vệ route.

### 🎨 Tùy chỉnh Giao diện (Theming & UI Settings) *(Mới — 2026-03-01)*

Hệ thống tích hợp công cụ tùy biến giao diện nhanh thông qua `AppFloatButton` (nút Setting nổi góc dưới phải).

**Các tính năng hỗ trợ:**
- **Dark Mode**: Chuyển đổi linh hoạt giữa giao diện Sáng (Default) và Tối (Dark Algorithm) thông qua Ant Design Theme.
- **Font Size**: Cho phép người dùng tăng/giảm cỡ chữ toàn bộ hệ thống (12px - 20px).
- **Compact Mode**: Kích hoạt chế độ thu gọn của Ant Design giúp hiển thị được nhiều dữ liệu hơn trên một màn hình.
- **Màu sắc chủ đạo (Theme Color)**: Thay đổi `colorPrimary` của toàn bộ ứng dụng sang các màu Teal, Blue, Purple, Green, Orange, Red.
- **Lưu trữ cấu hình**: Toàn bộ cài đặt của người dùng được lưu vào `localStorage` và tự động áp dụng lại khi tải trang.

### ✨ UX & Tương tác thông minh (UX Interactions) *(Mới — 2026-03-02)*

Hệ thống được thiết kế với các chuẩn mực trải nghiệm người dùng (UX) hiện đại dành riêng cho ERP:

1. **AppGrid Highlight Toàn Cục (Row Focus)**
   - Mọi thao tác người dùng nhấp (Click) vào bất kỳ vị trí nào trên phần thân dữ liệu của lưới (`<AppGrid>`), hệ thống sẽ tự động gán bóng màu (Highlight) riêng cho dòng đó. 
   - Giúp cho người dùng không bị "lạc mắt" hay nhầm lẫn thao tác khi đọc dữ liệu có quá nhiều cột ngang hàng.

2. **User Profile Modal Tích hợp Sidebar**
   - Vùng thẻ **User Avatar** ở dưới cùng góc trái thanh `Navbar` giờ đây không chỉ là vật trang trí. Nó còn đóng vai trò là một "vùng cảm ứng" (Interactive Zone) để truy cập nhanh Profile.
   - Khi di chuột (Hover), Banner sẽ tự động phản quang tạo cảm giác bấm. Khi click vào, Avatar tự động đảo màu viền Focus và gọi API chạy ngầm mang về dữ liệu 100% cập nhật nhất của User đó (`/api/Users/{id}`) rồi ném thẳng lên dạng Popup (`FormModal`) chỉnh sửa mượt mà. Đóng Popup là hiệu ứng lại trả về bình thường.
   - Trong lúc gọi API lấy Data lên Modal màn hình sẽ bị Lock (bằng hiệu ứng Loading Toàn Trang - `<Spin fullscreen>`) ngầm hiểu cản User không được cố tình Spam click bấm quá nhanh.

3. **Performance Optimization & Animations (Tiêu chuẩn Bắt buộc)**
   - **Performance Up:** Sau khi hoàn thành code chức năng của bất kỳ một Form/Module nào, BẮT BUỘC phải thực hiện một đợt kiểm tra và tinh chỉnh "Performance Up" để đảm bảo giao diện luôn mượt mà.
   - **Tối ưu Network & Prefetch:** Bỏ hẳn các hàm `router.push` hoặc hàm render tải lại toàn trang để nhường chỗ cho `<Link prefetch={true}>` (Đọc trước dữ liệu) nhằm phản hồi người dùng ở mức 0 độ trễ (Zero-latency).
   - **Hiệu ứng chuyển cảnh (Animations):** Được phép và khuyến khích bổ sung Animations (VD: Fade-in, Slide-up, TopLoader...) để che đi thời gian chờ tải và tăng độ chuyên nghiệp. **TUY NHIÊN**, thời lượng Animation bắt buộc phải set ở mức siêu nhanh (vd: `0.2s` - `0.35s`), không được kéo dài rề rà làm tốn thời gian thao tác của User.

4. **Hệ thống Tour hướng dẫn thông minh (Guided Tours)** *(Mới — 2026-03-06)*
   - **Tự động hóa i18n**: Toàn bộ tiêu đề và nội dung hướng dẫn được quản lý tập trung trong file `locales/*.json`. Hỗ trợ đa ngôn ngữ hoàn toàn (VI/EN).
   - **AppTour Component**: Wrapper bọc Ant Design `Tour`, giúp khai báo các bước hướng dẫn (Steps) một cách khai báo (declarative).
   - **Targeting thông qua Class định danh**:
     - `AppButton` đã được nâng cấp để tự động gán class `tour-${btnType}` (VD: `tour-edit`, `tour-delete`).
     - Cho phép Tour có thể "tìm thấy" chính xác các nút chức năng bên trong lưới (`AppGrid`) để highlight mà không cần dùng `ref` thủ công cho từng dòng.
   - **Phối hợp Nút Help**: Mọi màn hình nghiệp vụ đều trang bị nút **Help** (icon `?`) nằm kế bên nút Add. Khi click sẽ kích hoạt Tour hướng dẫn cho riêng trang đó.
   - **Danh sách các trang/component đã hỗ trợ Tour**:
     - **Trang Danh sách (Page-level)**: Tenants, Users, Roles, Products.
     - **Popup biểu mẫu (Modal-level)**: 
       - `UserFormModal`: Hướng dẫn chi tiết các trường nhập liệu (Username, Password, Roles).
       - *Các modal khác đang tiếp tục được cập nhật.*

5. **Tính năng Xuất Excel (Export Excel)** *(Mới — 2026-03-06)*
   - Cung cấp nút **Xuất Excel** (màu xanh thương hiệu, icon `FileExcelOutlined`) trên các màn hình Danh sách (Tenants, Users, Roles, Products).
   - Tích hợp Tooltip và Debounce để tối ưu trải nghiệm khi xuất tập tin lớn.

6. **Giao diện Lưới & Thanh công cụ (Grid & Toolbar) Tinh giản** *(Mới — 2026-03-07)*
   - Chuyển toàn bộ các nút chức năng dư thừa chữ (như Advanced Filter, Sort By, Export CSV) sang dạng **nút bo góc vuông Minimalist với Biểu tượng (Icon)**.
   - Ô tìm kiếm cũng được thay đổi viền để phù hợp với định hướng thiết kế mới: sạch sẽ hơn, nhẹ nhàng hơn và tối đa hoá không gian làm việc.
   - Di chuyển cột tính năng thao tác (Actions) ra thay vì nằm sau cùng, để người dùng dễ thao tác hơn với các mành hình rộng.

---

## 📘 Dành cho Developer C#

| .NET Concept | Next.js Equivalent |
|---|---|
| `appsettings.json` | `.env.local` |
| `_Layout.cshtml` | `app/layout.tsx` |
| `Partial View / ViewComponent` | `app/components/*.tsx` |
| `Repository / Service` | `services/*.ts` |
| `IHttpClientFactory + HttpClient` | `app/api/proxy/[...path]/route.ts` |
| `DataAnnotations` | Ant Design `Form.Item rules={[...]}` |
| `ActionResult / IActionResult` | `NextResponse.json()` |
| `[Authorize]` attribute | `AuthWrapper.tsx` |
| `[Authorize(Policy="...")]` | `[HasPermission]` / `[RequiredFeature]` |
| `IOptions<T>` (Config injection) | `process.env.NEXT_PUBLIC_*` |
| `Generic Repository<T>` | `AppGrid<T>`, `useAppGridSearch<T>()` |
| `Middleware / Filter` | `AccessGuard.tsx` (Page-level protection) |
| `Enum / Constants` | `Permissions.cs` / `Features.cs` |
