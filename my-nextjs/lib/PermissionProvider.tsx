'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAllUserInfo } from './auth-utils';

interface PermissionContextType {
    permissions: string[];
    features: string[];
    hasPermission: (required: string | string[]) => boolean;
    hasFeature: (required: string | string[]) => boolean;
    isAdmin: boolean;
    tenantName: string;
    tenantCode: string;
    tenantLogo: string;
    userName: string;
    isHostTenant: boolean;
    refreshAccess: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermission must be used within a PermissionProvider');
    }
    return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const [permissions, setPermissions] = useState<string[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [tenantName, setTenantName] = useState<string>('');
    const [tenantCode, setTenantCode] = useState<string>('');
    const [tenantLogo, setTenantLogo] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [isHostTenant, setIsHostTenant] = useState<boolean>(false);

    const refreshAccess = useCallback(() => {
        const info = getAllUserInfo();
        if (info) {
            setPermissions(info.permissions);
            setFeatures(info.features);
            setTenantName(info.tenantName);
            setTenantCode(info.tenantCode);
            setTenantLogo(info.tenantLogo || '');
            setUserName(info.userName);
            setIsHostTenant(['host', 'admin'].includes(info.tenantCode.toLowerCase()));
        } else {
            // Không có token — reset về trạng thái chưa đăng nhập
            setPermissions([]);
            setFeatures([]);
            setTenantName('');
            setTenantCode('');
            setTenantLogo('');
            setUserName('');
            setIsHostTenant(false);
        }
    }, []);

    // Chạy lúc mount app
    useEffect(() => {
        refreshAccess();
        window.addEventListener('storage', refreshAccess);
        return () => window.removeEventListener('storage', refreshAccess);
    }, [refreshAccess]);

    // Refresh mỗi khi chuyển route (để nhận token mới sau khi login)
    useEffect(() => {
        refreshAccess();
    }, [pathname, refreshAccess]);

    const isAdmin = useMemo(() => permissions.includes('*'), [permissions]);

    const hasPermission = (required: string | string[]) => {
        if (permissions.includes('*')) return true;
        const requiredList = Array.isArray(required) ? required : [required];
        if (requiredList.length === 0) return true;
        return requiredList.some(p => permissions.includes(p));
    };

    const hasFeature = (required: string | string[]) => {
        if (features.includes('*')) return true;
        const requiredList = Array.isArray(required) ? required : [required];
        if (requiredList.length === 0) return true;
        // Tenant hợp lệ nếu có chứa Feature yêu cầu, HOẶC chứa bất kỳ Feature con nào của Feature yêu cầu đó.
        return requiredList.some(req =>
            features.some(f => f === req || f.startsWith(req + '.'))
        );
    };

    return (
        <PermissionContext.Provider value={{
            permissions,
            features,
            hasPermission,
            hasFeature,
            isAdmin,
            tenantName,
            tenantCode,
            tenantLogo,
            userName,
            isHostTenant,
            refreshAccess
        }}>
            {children}
        </PermissionContext.Provider>
    );
};

/**
 * Component bọc để kiểm tra Quyền (I) HOẶC Tính năng (F)
 */
export const Can: React.FC<{
    I?: string | string[];
    F?: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}> = ({ I, F, children, fallback = null }) => {
    const { hasPermission, hasFeature } = usePermission();

    const canPermission = I ? hasPermission(I) : true;
    const canFeature = F ? hasFeature(F) : true;

    if (canPermission && canFeature) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
