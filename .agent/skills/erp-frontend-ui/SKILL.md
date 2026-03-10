---
name: mint-erp-frontend-ui
description: Dùng Wrapper Components như AppGrid, AppButton và Ant Design Token Theme. Dành riêng cho Next.js Frontend. KHÔNG dùng Native Ant Design Table/Button.
---

# Frontend UI Components

Hệ thống cung cấp một loạt các "Siêu Năng Lực" Components (wrapper cho Ant Design) như `AppGrid`, `AppButton` trong `app/components/common`.

## Các Pattern thực tế (Code Example)

### 1. Nút bấm thông minh (AppButton)
Tích hợp tự Check quyền (`permission`), chống spam click (`useDebounce`), auto popconfirm an toàn và xử lý UI Style Token.

```tsx
// my-nextjs/app/components/common/AppButton.tsx
export const AppButton = <T,>({
    title, icon, variant, btnType, onClick, data, permission, confirm, useDebounce = false, ...props
}: AppButtonProps<T>) => {
    // 1. Kiểm tra Permission - Nếu không có quyền, return null ngay lập tức
    const canAccess = !permission || hasPermission(permission);
    if (!canAccess) return null;
    
    // Config Style qua Ant Design Token Container
}
```

**Cách dùng:**
```tsx
<AppButton
  btnType="add"
  icon={<PlusOutlined />}
  onClick={() => handleCreate()}
  permission="AdministrationService.Users.Create"
>
  Thêm Mới
</AppButton>
```

### 2. Lưới dữ liệu và Thanh tác vụ (AppGrid)
Dùng React Table tích hợp header thông minh, Toolbar, Action row và State.

```tsx
// my-nextjs/app/components/common/AppGrid.tsx
export const AppGrid = <T extends AnyObject>({
    columns, dataSource, loading, statCards, toolbar, rowActions, pagination, ...
}) => { ... }
```

**Cách dùng:**
→ Chi tiết xem: appgrid-rowactions-flow.md

### 3. Đa ngôn ngữ (i18next)
Khi viết text phải đưa vào hàm dịch, default lang truyền tham số 2.
```tsx
const { t } = useTranslation();
t('addNew', 'Thêm mới')
```

---

## ✅ Checklist Frontend UI
1. **Import Component**: Luôn import từ `components/common/` thay vì từ `antd`.
2. **Permission Guarding**: Cố gắng pass `permission='ModuleName.Action'` cho tất cả các nút sửa xóa để đảm bảo độ an toàn UI.
3. **Responsive Flow**: Table tự động render responsive, dùng `statCards` array và `toolbar` component cho UI consistent.

---

## 🚫 Sai vs Đúng (Anti-Patterns)

| Sai (Anti-pattern) | Đúng |
|---|---|
| Dùng màu HEX hardcode (vd: `#1677ff`) trong style property. | Dùng `theme.useToken().token.colorPrimary`. |
| Render raw components `import { Button }` và tự tạo logic ẩn/hiện, show popup. | Sử dụng `<AppButton permission=".." confirm="Bạn chắc chắn không?">`. |
| Handle table rows logic, menu dropdown Actions thủ công. | Truyền mảng cấu hình hành động qua `rowActions` -> Xem: appgrid-rowactions-flow.md |
