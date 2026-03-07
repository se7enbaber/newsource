/**
 * Giải mã payload của JWT mà không cần thư viện ngoài.
 * Kết quả được cache trong module-level variable để tránh decode lại nhiều lần.
 */
export function decodeJwt(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

/**
 * Lấy và decode JWT từ localStorage — kết quả decode được trả về ngay
 * để các hàm bên dưới không phải gọi lại localStorage nhiều lần.
 */
export function getDecodedToken(): any | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    return decodeJwt(token);
}

// ---------- Kiểm tra hợp lệ của Token ----------

/**
 * Kiểm tra token có hết hạn hay chưa (bao gồm cả trường hợp không parse được).
 * Return true nếu hết hạn, false nếu còn hạn.
 */
export function isTokenExpired(token?: string | null): boolean {
    const targetToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    if (!targetToken) return true;
    
    const decoded = decodeJwt(targetToken);
    if (!decoded || !decoded.exp) return true;

    // exp lưu dưới dạng seconds, chuyển về milliseconds
    // Trừ hao 5s buffer
    return (decoded.exp * 1000) < Date.now() + 5000;
}

// ---------- Helpers dùng chung decoded token ----------

/**
 * Lấy danh sách permissions từ token lưu trong localStorage
 */
export function getUserPermissions(): string[] {
    const decoded = getDecodedToken();
    if (!decoded) return [];

    // 1. Kiểm tra nếu là Admin (có role Admin hoặc username là admin)
    const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;
    const roleList: string[] = Array.isArray(roles) ? roles : roles ? [roles] : [];

    const userName = (
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        decoded.name ||
        decoded.unique_name ||
        decoded.preferred_username ||
        ''
    )?.toString().toLowerCase();

    if (userName === 'admin' || roleList.some((r) => r?.toString().toLowerCase() === 'admin')) {
        return ['*'];
    }

    // 2. Lấy danh sách Permission cụ thể từ claim 'Permission'
    const permissions = decoded.Permission;
    if (Array.isArray(permissions)) return permissions;
    if (typeof permissions === 'string') return [permissions];
    return [];
}

/**
 * Lấy danh sách features từ token lưu trong localStorage (Tenant-wide features)
 */
export function getUserFeatures(): string[] {
    const decoded = getDecodedToken();
    if (!decoded) return [];

    // Tenant Host hoặc Admin luôn có full bộ Features
    const tenantCode = decoded.tenant_code || '';
    if (['host', 'admin'].includes(tenantCode.toLowerCase())) {
        return ['*'];
    }

    const features = decoded.Feature || decoded.Features;
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') return [features];
    return [];
}

/**
 * Lấy tên Tenant từ token để hiển thị trên UI
 */
export function getTenantName(): string {
    return getDecodedToken()?.tenant_name || '';
}

/**
 * Lấy mã Tenant từ token
 */
export function getTenantCode(): string {
    return getDecodedToken()?.tenant_code || '';
}

/**
 * Láy logo Tenant từ token
 */
export function getTenantLogo(): string {
    return getDecodedToken()?.tenant_logo || '';
}

/**
 * Lấy tên User từ token
 */
export function getUserName(): string {
    const decoded = getDecodedToken();
    if (!decoded) return '';
    return (
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        decoded.name ||
        decoded.unique_name ||
        decoded.preferred_username ||
        ''
    );
}

/**
 * Lấy ID User từ token
 */
export function getUserId(): string {
    const decoded = getDecodedToken();
    if (!decoded) return '';
    return (
        decoded.sub ||
        decoded.nameidentifier ||
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        decoded.Id ||
        ''
    );
}

/**
 * Lấy ID Tenant từ token
 */
export function getTenantId(): string {
    return getDecodedToken()?.tenant_id || '';
}

/**
 * Lấy tất cả thông tin user từ token trong 1 lần decode duy nhất.
 * Dùng khi cần nhiều field cùng lúc (tránh decode nhiều lần).
 */
export function getAllUserInfo() {
    const decoded = getDecodedToken();
    if (!decoded) return null;

    const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role;
    const roleList: string[] = Array.isArray(roles) ? roles : roles ? [roles] : [];

    const userName = (
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        decoded.name ||
        decoded.unique_name ||
        decoded.preferred_username ||
        ''
    )?.toString();

    const isAdmin = userName.toLowerCase() === 'admin' || roleList.some((r) => r?.toString().toLowerCase() === 'admin');

    let permissions: string[];
    if (isAdmin) {
        permissions = ['*'];
    } else {
        const p = decoded.Permission;
        permissions = Array.isArray(p) ? p : typeof p === 'string' ? [p] : [];
    }

    const tenantCode = (decoded.tenant_code || '') as string;

    let features: string[];
    if (['host', 'admin'].includes(tenantCode.toLowerCase())) {
        features = ['*'];
    } else {
        const f = decoded.Feature || decoded.Features;
        features = Array.isArray(f) ? f : typeof f === 'string' ? [f] : [];
    }

    return {
        permissions,
        features,
        tenantName: (decoded.tenant_name || '') as string,
        tenantCode,
        tenantLogo: (decoded.tenant_logo || '') as string,
        userName,
        tenantId: (decoded.tenant_id || '') as string,
        userId: (decoded.sub || decoded.nameidentifier || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.Id || '') as string,
    };
}
