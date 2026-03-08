# 🧩 Mint ERP - Design System Components

Tài liệu hướng dẫn sử dụng các component dùng chung (Common Components) được thiết kế riêng cho hệ thống SaaS Mint ERP.

## 🏗 Vị trí trong Hệ thống
```text
┌────────────────────────┐         ┌────────────────────────┐
│ Trình duyệt (Người dùng)│  HTTP   │ Next.js Server (Proxy) │
│ (Sử dụng Components)   │◄────────┤ [FRONTEND - my-nextjs] │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
┌───────────────────────────────────────────────────────────┐
│                   Gateway Service (YARP)                  │
└──────┬──────────────────────────┬──────────────┬──────────┘
```

## 📂 Cấu trúc thư mục
```text
my-nextjs/app/components/
├── common/
│   ├── AppButton.tsx     # Nút bấm tích hợp Permission & Confirm
│   ├── AppGrid.tsx       # Bảng dữ liệu thông minh (Data Grid)
│   ├── AppBadge.tsx      # Nhãn trạng thái (Status Tag)
│   └── AppStatCard.tsx    # Thẻ thống kê tóm tắt
├── layout/               # Các thành phần bố cục (Navbar, Sidebar)
└── README.md             # Tài liệu này
```

---

## 🔘 AppButton
Nút bấm thông minh bọc ngoài Ant Design Button.

### Props quan trọng
| Prop | Type | Mô tả |
| :--- | :--- | :--- |
| `variant` | `primary \| secondary \| danger \| ghost \| link` | Định kiểu nút theo theme hệ thống. |
| `permission` | `string \| string[]` | Ẩn nút nếu user không có quyền. |
| `confirm` | `string \| ReactNode` | Hiện Popconfirm trước khi thực hiện `onClick`. |
| `loading` | `boolean` | Tự động hiện spinner và disable nút. |

### Ví dụ
```tsx
<AppButton
  variant="primary"
  permission="AdministrationService.Users.Create"
  confirm="Bạn có chắc chắn muốn thêm người dùng này?"
  onClick={handleSave}
>
  Lưu thông tin
</AppButton>
```

---

## 📊 AppGrid
Bảng dữ liệu cao cấp tích hợp thống kê và thanh công cụ.

### Props quan trọng
| Prop | Type | Mô tả |
| :--- | :--- | :--- |
| `summaryCards` | `AppStatCardProps[]` | Hiển thị các card thống kê phía trên bảng. |
| `toolbar` | `ReactNode` | Vùng chứa nút action hoặc Search input phía trên. |
| `rowActions` | `RowAction[]` | Các nút hành động trên từng dòng (chỉ hiện khi hover). |
| `loading` | `boolean` | Hiển thị Skeleton loading khi dữ liệu đang tải. |

### Ví dụ
```tsx
<AppGrid
  columns={columns}
  dataSource={data}
  summaryCards={[{ label: 'Tổng số', value: 100 }]}
  rowActions={[
    { key: 'edit', label: 'Sửa', onClick: (rec) => openModal(rec) }
  ]}
  toolbar={<AppButton variant="primary">Thêm mới</AppButton>}
/>
```

---

## 🏷️ AppBadge
Nhãn trạng thái tự động ánh xạ dữ liệu.

### Props quan trọng
| Prop | Type | Mô tả |
| :--- | :--- | :--- |
| `value` | `string \| boolean` | Giá trị trạng thái (ACTIVE, PENDING, true, ...). |
| `statusMap` | `Record<string, BadgeConfig>` | Ghi đè mapping mặc định nếu cần. |

### Ví dụ
```tsx
<AppBadge value="ACTIVE" /> // Hiển thị "Hoạt động" (Màu xanh)
<AppBadge value={false} />    // Hiển thị "Vô hiệu hóa" (Màu xám)
```

---

## 📑 Nguyên tắc chung
1. **DRY (Don't Repeat Yourself)**: Không tạo component mới nếu các component hiện tại có thể mở rộng thông qua props.
2. **Permission First**: Mọi hành động thao tác dữ liệu (Add/Edit/Delete) **bắt buộc** phải sử dụng prop `permission` gắn trên `AppButton` hoặc `RowAction`.
3. **Type Safety**: Tất cả component phải có Interface đầy đủ và sử dụng Generic nếu làm việc với tập dữ liệu linh hoạt.
4. **Consistency**: Tuân thủ bảng màu hệ thống thông qua **Ant Design Tokens**. Tuyệt đối không hardcode mã màu hex để đảm bảo tính nhất quán khi đổi theme (Mint Teal, Dark Mode, v.v.).

---

## 🛡️ Tích hợp Quyền hạn (Permission)
Hệ thống sử dụng `PermissionProvider` để đọc các Claims từ JWT. 
- Component `AppButton` và `AppGrid` tự động gọi hàm `hasPermission(claim)` nội bộ.
- Nếu `hasPermission` trả về `false`, component sẽ trả về `null` (không render ra DOM), đảm bảo an toàn về mặt UI.

---

## 🎨 Nguyên tắc Theme Token (Bắt buộc)

Để đảm bảo hệ thống đổi màu theme (Primary Color) hoạt động chính xác và đồng bộ, mọi thành viên phát triển **BẮT BUỘC** tuân thủ nguyên tắc Token của Ant Design.

### 🔑 Hệ thống 3 tầng Token:
1.  **Seed Token**: `colorPrimary` (Màu gốc người dùng chọn).
2.  **Map Token**: `colorPrimaryBg`, `colorPrimaryBorder`, `colorPrimaryHover` (Tự động tính toán từ Seed Token).
3.  **Alias Token**: `colorBgContainer`, `colorBorderSecondary` (Dùng cho layout và container).

### 🚫 Quy tắc vàng:
**TUYỆT ĐỐI KHÔNG** hardcode mã màu hex (ví dụ: `#4ECDC4`) hoặc các class màu Tailwind cố định (ví dụ: `text-teal-600`, `bg-slate-50`) cho các thành phần liên quan đến màu thương hiệu hoặc trạng thái.

### 🛠 Cách sử dụng trong Code:
```tsx
import { theme } from 'antd';
const { useToken } = theme;

const MyComponent = () => {
  const { token } = useToken();
  return <div style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimary }}>...</div>
};
```

### 📋 Danh sách Token hay dùng:
| Token | Mục đích |
| :--- | :--- |
| `token.colorPrimary` | Màu chủ đạo chính (Nút bấm, highlight). |
| `token.colorPrimaryBg` | Nền nhạt đồng bộ (Header bảng, nền Card highlight). |
| `token.colorBgContainer` | Nền trắng của container/card (Tự đổi sang đen nếu ở Dark mode). |
| `token.colorText` | Màu chữ chính. |
| `token.colorTextSecondary` | Màu chữ phụ (Mô tả, label phụ). |
| `token.colorBorder` | Viền các thành phần Form. |
| `token.colorBorderSecondary` | Viền mờ cho chia tách layout/row bảng. |
| `token.borderRadius` | Bo góc đồng nhất toàn hệ thống. |

---

## 🌓 Color Contrast System (WCAG 2.1)

Để đảm bảo nội dung luôn dễ đọc trên mọi màu nền (đặc biệt khi người dùng chọn các màu Primary cực sáng hoặc cực tối), hệ thống tích hợp cơ chế tự động tính toán độ tương phản.

### 🛠 Công cụ hỗ trợ:
1.  **`lib/colorUtils.ts`**: Chứa các hàm lõi tính toán Luminance và Contrast Ratio.
2.  **`hooks/useContrastColor.ts`**: React Hook tiện lợi để sử dụng trong component.

### 💡 Cách sử dụng:
```tsx
import { useContrastColor } from '@/hooks/useContrastColor';

const { getTextColor, primaryTextColor } = useContrastColor();

// 1. Tự động lấy màu chữ cho một mã màu bất kỳ
<div style={{ backgroundColor: myBg, color: getTextColor(myBg) }}>...</div>

// 2. Dùng màu chữ đã tính sẵn cho Primary Color
<Button style={{ backgroundColor: token.colorPrimary, color: primaryTextColor }}>...</Button>
```

### 📏 Tiêu chuẩn tuân thủ:
- Tự động ưu tiên màu chữ có **Contrast Ratio** cao hơn so với nền.
---

## 🧭 Sidebar Design System (V4 - Dark Colored)

Hệ thống Sidebar của Mint ERP sử dụng phong cách **"Dark Colored Sidebar"** nhằm đảm bảo độ tương phản chuẩn (WCAG >= 4.5:1) hỗ trợ người dùng đọc chữ tốt nhất trong khi vẫn giữ được bản sắc màu thương hiệu (Teal, Purple, Blue...).

### 🎨 Quy tắc tính màu động (Dynamic Color Logic)
Tuyệt đối không sử dụng màu cố định cho Sidebar. Màu sắc được tính toán dựa trên `colorPrimary` (Seed Token):
- **Sidebar Main Background**: Sử dụng hàm `darkenColor(token.colorPrimary, 45)` để làm tối màu chủ đạo xuống mức ~25-30% Lightness.
- **Footer Background**: Sử dụng `rgba(0,0,0,0.15)` chồng lên màu nền chính để tạo cảm giác tách biệt khối.
- **Border**: Sử dụng `rgba(255,255,255,0.10)` để chia tách các vùng Brand/Menu/User.

### 📑 Phân cấp thị giác (Visual Hierarchy)
Hệ thống Menu được thiết kế 2 tầng rõ rệt để tối ưu hóa khả năng quét thông tin:
1.  **Menu Cha (Nhóm chức năng)**:
    -   Kiểu chữ: Semibold (600), 13px, Viết hoa (UPPERCASE).
    -   Màu sắc: `rgba(255,255,255,0.95)` (Độ tương phản cao).
    -   Khoảng cách: Letter-spacing 0.05em.
2.  **Menu Con (Trang chức năng)**:
    -   Kiểu chữ: Regular (400), 14px, Viết thường.
    -   Màu sắc: `rgba(255,255,255,0.75)` (Độ tương phản trung bình).
    -   Thụt lề (Indentation): `60px` padding-left để tạo dòng chảy thị giác.

### ⚡ Trạng thái Menu (Menu States)
- **Active (Đang chọn)**: Nền `rgba(255,255,255,0.15)`, chữ trắng 100%, có vạch trắng `3px` ở biên trái (border-left).
- **Hover (Di chuột)**: Nền `rgba(255,255,255,0.08)`, chuyển màu mịn (150ms transition).
- **Parent Active**: Khi có con đang được chọn, nhãn menu cha sẽ sáng lên màu trắng 100% để báo hiệu vị trí.

### 🚫 Quy tắc cấm kỵ (Anti-patterns)
- Không sử dụng Gradient cho nền Sidebar vì gây khó đọc chữ ở các vùng sáng/tối khác nhau.
- Không hardcode mã màu Hex trong file component.
- Không thay đổi cấu trúc Flex-col (Header - Scrollable Body - Footer/User Info).

---

## 📈 AppStatCards
Bộ thẻ thống kê tóm tắt, thường đặt phía trên bảng dữ liệu.

### Props quan trọng
| Prop | Type | Mô tả |
| :--- | :--- | :--- |
| `items` | `AppStatCardsItem[]` | Danh sách dữ liệu cho từng thẻ (label, value, icon, trend). |
| `columns` | `number` | Số cột (tự động 2 cột trên mobile, 4 trên desktop). |

### Ví dụ
```tsx
const stats = [
    { label: 'Người dùng mới', value: '1,234', icon: <TeamOutlined />, trend: { value: 12, isUp: true } },
    { label: 'Doanh thu', value: '$45,678', icon: <DollarOutlined />, trend: { value: 5, isUp: false } }
];

<AppStatCards items={stats} />
```

---

## 🏷️ AppTagList
Hiển thị danh sách tag (nhãn) thông minh, tự động thu gọn nếu quá dài.

### Props quan trọng
| Prop | Type | Mô tả |
| :--- | :--- | :--- |
| `tags` | `string[] \| { label: string, color?: string }[]` | Danh sách nhãn cần hiển thị. |
| `maxVisible` | `number` | Số lượng tag tối đa hiển thị trực tiếp (mặc định: 3). |

### Đặc điểm
- Nếu số tag vượt quá `maxVisible`, phần dư sẽ được gom vào nhãn `+N more`.
- Rê chuột vào `+N more` để xem toàn bộ danh sách trong Popover.
- Giúp bảo toàn chiều cao dòng (row height) đồng nhất cho bảng.

---

## ⚡ Tính năng nâng cao AppGrid (V2)

### 1. Row Hover Actions
Các nút chức năng trên dòng sẽ được ẩn mặc định (`opacity-0`) và chỉ hiện lên khi di chuột vào dòng (`group-hover`).
- **Gom nhóm**: Nếu có từ 3 hành động trở lên, hệ thống tự động chuyển sang nút `...` (More) và hiển thị Dropdown.
- **Xác nhận**: Tích hợp sẵn `confirm` prop để hiện Popconfirm trước khi thực thi.

### 2. Loading & Empty State
- **Skeleton Rows**: Khi `loading={true}` và chưa có dữ liệu, bảng hiển thị hàng giả lập thay vì spinner xoay, giúp giảm nhảy layout (Layout Shift).
- **Empty CTA**: Khi bảng trống, hiển thị nút "Thêm mới" (nếu truyền `onEmptyClick`) để dẫn dắt người dùng.

### 3. Trải nghiệm người dùng (UX)
- **Shortcut**: Nhấn `/` hoặc `Ctrl+F` để tự động focus vào ô tìm kiếm (Search bar).
- **Localization**: Phân trang mặc định tiếng Việt ("10 / trang", "Tổng cộng X bản ghi").
- **Row Striping**: Các dòng chẵn tự động có nền xám nhạt (`token.colorFillAlter`) để dễ theo dõi mắt.

---

## 📑 Quy trình checklist khi tạo trang danh sách mới
Khi viết một trang quản lý (List Page), hãy đảm bảo:
1. [ ] Có `AppStatCards` phía trên để tóm tắt dữ liệu.
2. [ ] Sử dụng `AppGrid` với `rowActions` thay vì cột chức năng thủ công.
3. [ ] Các cột dữ liệu dạng mảng (Roles, Tags, ...) phải dùng `AppTagList`.
4. [ ] Thanh công cụ `toolbar` luôn có nút "Thêm mới" và "Search".
5. [ ] Luôn có `loading` state và `onEmptyClick` cho trải nghiệm trôi chảy.
