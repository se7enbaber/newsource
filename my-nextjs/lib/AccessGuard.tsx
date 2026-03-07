'use client';

import React from 'react';
import { usePermission } from './PermissionProvider';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface AccessGuardProps {
    permission?: string | string[];
    feature?: string | string[];
    hostOnly?: boolean;
    children: React.ReactNode;
}

/**
 * HOC (High-Order Component) or Wrapper để bảo vệ trang cấp Page Level.
 * Hiển thị màn hình lỗi 403 (Unauthorized/Feature disabled) nếu không đủ quyền.
 */
export const AccessGuard: React.FC<AccessGuardProps> = ({ permission, feature, hostOnly, children }) => {
    const { hasPermission, hasFeature, isAdmin, isHostTenant } = usePermission();
    const router = useRouter();
    const { t } = useTranslation();

    // 0. Kiểm tra Host-only restriction
    if (hostOnly && !isHostTenant) {
        return (
            <Result
                status="403"
                title="403"
                subTitle={t('host_only_access', 'Trang này chỉ dành cho quản trị viên hệ thống (Host).')}
                extra={
                    <Button type="primary" onClick={() => router.push('/')}>
                        {t('back_home', 'Về trang chủ')}
                    </Button>
                }
            />
        );
    }

    // 1. Kiểm tra Feature (Cấp Tenant)
    if (feature) {
        const canAccessFeature = hasFeature(feature);
        if (!canAccessFeature) {
            return (
                <Result
                    status="403"
                    title="403"
                    subTitle={t('feature_not_enabled', 'Tính năng này chưa được kích hoạt cho Tenant của bạn.')}
                    extra={
                        <Button type="primary" onClick={() => router.push('/')}>
                            {t('back_home', 'Về trang chủ')}
                        </Button>
                    }
                />
            );
        }
    }

    // 2. Kiểm tra Quyền (Cấp User)
    if (permission) {
        const canAccessPermission = hasPermission(permission);
        if (!canAccessPermission) {
            return (
                <Result
                    status="403"
                    title="403"
                    subTitle={t('unauthorized_access', 'Bạn không có quyền truy cập vào trang này.')}
                    extra={
                        <Button type="primary" onClick={() => router.push('/')}>
                            {t('back_home', 'Về trang chủ')}
                        </Button>
                    }
                />
            );
        }
    }

    return <>{children}</>;
};
