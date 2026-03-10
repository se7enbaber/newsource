# Cấu hình AppGrid Row Actions

## Khi nào đọc file này
Chỉ đọc khi: Tích hợp thiết lập cột thao tác tác vụ (Sửa, Xóa, Chi tiết) vào thành phần lưới (AppGrid Component) trên giao diện Frontend.

## Tại sao phức tạp
Tránh anti-pattern là tự render `Button`, dropdown cho từng hàng (row) trong Table. Hệ thống có cơ chế Component Wrapper giúp gói gọn logic Row Action qua Array bảo mật.

## Khai báo Row Actions Array
`<AppGrid>` có tính năng ẩn nhận cấu trúc `rowActions`, tự động xử lý Attribute Permission, Spinner Load trên dòng, gắn Popconfirm (xóa n dòng) và thu gọn Dropdown Menu nếu màn list có quá > 3 hành động.

```tsx
const appRowActions = [
    { 
        key: 'edit', 
        icon: <EditOutlined />, 
        onClick: (record) => handleEditClick(record),
        permission: 'AdministrationService.Users.Edit' // Tự động check, nếu fail sẽ ẩn nút
    },
    { 
        key: 'delete', 
        icon: <DeleteOutlined />, 
        danger: true, 
        confirm: "Bạn có chắc chắn muốn xóa bản ghi này?", // Tự động generate Popconfirm
        onClick: (record) => handleDeleteAPI(record), 
        permission: 'AdministrationService.Users.Delete'
    }
];

// Hàm Render:
<AppGrid
    dataSource={dataSource}
    columns={tableColumns}
    loading={isLoadingState}
    rowActions={appRowActions} /* Truyền thuộc tính vào Wrapper */
/>
```

## Bảng Sai/Đúng
| Sai lầm phổ biến | Cách làm chuẩn |
|---|---|
| Khai báo Action column thủ công bằng thuộc tính `render: (text, record) => <Button...>` trong file cấu hình `columns`. Việc này làm sót logic check quyền, phải bao bọc tự viết popconfirm thủ công. | Chỉ pass duy nhất mảng cấu hình `rowActions={[]}` truyền trực tiếp cho `<AppGrid>`. Framework sẽ đảm nhiệm vẽ Auto Skeleton và UI chuẩn. |

## Liên quan
- Xem thêm: `mint-erp-frontend-ui`
