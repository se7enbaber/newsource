export interface NavItem {
    title: string;
    titleKey?: string;
    path: string;
    order: number;
    icon?: string;
    module: string;            // Ví dụ: 'product', 'order', 'user'
    requiredPermissions?: string[]; // Các quyền cần thiết để hiển thị menu này
    requiredFeature?: string;       // Tính năng (Tenant) cần thiết để hiển thị menu này
    requiredAdminTenant?: boolean;  // Bắt buộc Tenant hiện tại phải là Host/Admin Tenant (ví dụ: Menu Quản lý Tenant)
    children?: NavItem[];      // Menu cấp con (nếu có)
}