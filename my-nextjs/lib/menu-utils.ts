// src/lib/menu-utils.ts
import { NavItem } from "@/types/nav";

/**
 * Hàm lọc menu dựa trên quyền (Permissions) và tính năng (Features) của Tenant.
 * 
 * Logic:
 * 1. Nếu User có dấu '*' (Admin) -> Show All.
 * 2. Item sẽ bị ẨN nếu yêu cầu Feature mà Tenant không có.
 * 3. Nếu là Terminal (Link): Hiện nếu có quyền (hoặc không yêu cầu quyền).
 * 4. Nếu là Folder (path="#"): Chỉ hiện nếu có ít nhất 1 con hợp lệ.
 * 
 * @param menuItems Danh sách menu gốc
 * @param userPermissions Danh sách quyền user
 * @param userFeatures Danh sách tính năng của Tenant
 */
export function filterMenuByPermission(
    menuItems: NavItem[],
    userPermissions: string[] = [],
    userFeatures: string[] = [],
    isHostTenant: boolean = false
): NavItem[] {
    const hasAllPermissions = userPermissions.includes('*');
    const hasAllFeatures = userFeatures.includes('*');

    const filtered = menuItems
        .map((item): NavItem | null => {
            // 0. Kiểm tra yêu cầu Admin Tenant
            if (item.requiredAdminTenant && !isHostTenant) {
                return null;
            }

            // A. Kiểm tra Feature trước (Cấp Tenant)
            if (item.requiredFeature && !hasAllFeatures) {
                // Feature hợp lệ nếu:
                // 1. Array userFeatures chứa chính xác bằng requiredFeature
                // 2. HOẶC chứa một con của requiredFeature (VD required là 'Feature.MDM' và user có 'Feature.MDM.Products')
                const hasValidFeature = userFeatures.some(f =>
                    f === item.requiredFeature || f.startsWith(item.requiredFeature + '.')
                );

                if (!hasValidFeature) {
                    return null; // Tenant không mua tính năng này -> Ẩn luôn
                }
            }

            // B. Đệ quy xử lý các con
            const filteredChildren = item.children
                ? filterMenuByPermission(item.children, userPermissions, userFeatures, isHostTenant)
                : undefined;

            // C. Kiểm tra Quyền (Cấp User)
            const hasOwnPermission = hasAllPermissions || !item.requiredPermissions ||
                item.requiredPermissions.length === 0 ||
                item.requiredPermissions.some((p) => userPermissions.includes(p));

            // D. Quyết định hiển thị:
            const isFolder = item.path === "#";
            let isVisible = false;

            if (isFolder) {
                // Folder hiện nếu có ít nhất 1 con hợp lệ
                isVisible = !!(filteredChildren && filteredChildren.length > 0);
            } else {
                // Link thực tế hiện nếu có quyền
                isVisible = hasOwnPermission;
            }

            if (isVisible) {
                return {
                    ...item,
                    children: filteredChildren,
                };
            }

            return null;
        })
        .filter((item): item is NavItem => item !== null);

    return filtered.sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title));
}
