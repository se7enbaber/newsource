'use client';

import React, { useCallback } from 'react';
import { Button, Tooltip, ButtonProps, Popconfirm, Spin, theme } from 'antd';
import {
    LoadingOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { debounce } from 'lodash';
import { usePermission } from '@/lib/PermissionProvider';
import { useContrastColor } from '@/hooks/useContrastColor';

const { useToken } = theme;

/**
 * Mở rộng thuộc tính của Antd Button
 */
export interface AppButtonProps<T = any> extends Omit<ButtonProps, 'onClick' | 'variant'> {
    /**
     * Tiêu đề Tooltip khi hover (nếu có)
     */
    title?: string;
    /**
     * Biến thể thiết kế (đồng nhất toàn hệ thống)
     */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
    /**
     * Quyền cần thiết để hiển thị nút (ví dụ: "AdministrationService.Users.Create")
     */
    permission?: string | string[];
    /**
     * Dữ liệu kèm theo khi click (truyền ngược lại cho callback)
     */
    data?: T;
    /**
     * Bật cơ chế chống spam click (mặc định 300ms)
     */
    useDebounce?: boolean;
    /**
     * Nội dung xác nhận trước khi thực hiện hành động
     */
    confirm?: string | React.ReactNode;
    /**
     * Callback khi nút được nhấn
     */
    onClick?: (e: React.MouseEvent<HTMLElement>, data?: T) => void;
    /**
     * Nút được định nghĩa cho component AppGrid (như add, edit, delete, ...)
     */
    btnType?: 'add' | 'export' | 'filter' | 'edit' | 'delete' | 'view' | 'help' | 'vibe' | 'quest';
}

/**
 * AppButton - Thành phần nút bấm trung tâm của Mint ERP
 * Tự động ẩn nếu không có quyền, hỗ trợ confirm nhanh và đảm bảo UX (loading/debounce)
 */
export const AppButton = <T,>({
    title,
    icon,
    style,
    variant,
    btnType,
    className,
    children,
    onClick,
    data,
    permission,
    loading,
    confirm,
    useDebounce = false,
    ...props
}: AppButtonProps<T>) => {
    const { token } = useToken();
    const { getTextColor, primaryTextColor } = useContrastColor();
    const { hasPermission } = usePermission();

    // 1. Kiểm tra Permission - Nếu không có quyền, return null ngay lập tức
    const canAccess = !permission || hasPermission(permission);
    if (!canAccess) return null;

    // 2. Định nghĩa cấu hình style dựa trên variant/btnType
    const getConfigs = () => {
        const baseClass = 'rounded-lg flex items-center justify-center font-semibold transition-all duration-200';
        
        let targetVariant = variant;
        // Mặc định mapping btnType (tương thích ngược)
        if (btnType === 'add') targetVariant = 'primary';
        if (btnType === 'delete') targetVariant = 'danger';
        if (btnType === 'edit') targetVariant = 'ghost';

        switch (targetVariant) {
            case 'primary':
                return {
                    type: 'primary' as const,
                    style: { backgroundColor: token.colorPrimary, color: primaryTextColor, ...style },
                    className: `${baseClass} shadow-md`,
                };
            case 'secondary':
                return {
                    className: `${baseClass} border-0`,
                    style: { backgroundColor: token.colorFillAlter, color: token.colorText, ...style }
                };
            case 'danger':
                return {
                    danger: true,
                    type: 'primary' as const,
                    style: { color: getTextColor(token.colorError), ...style },
                    className: `${baseClass} shadow-md`,
                };
            case 'ghost':
                return {
                    type: 'default' as const,
                    className: `${baseClass}`,
                    style: { 
                        borderColor: token.colorBorder, 
                        color: token.colorTextSecondary,
                        ...style 
                    }
                };
            case 'link':
                return {
                    type: 'link' as const,
                    className: `${baseClass}`,
                    style: { color: token.colorPrimary, ...style }
                };
            default:
                return {
                    style: { ...style },
                    className: `${baseClass}`,
                };
        }
    };

    const config = getConfigs();

    // 3. Xử lý debounce click
    const debouncedClick = useCallback(
        debounce((e: React.MouseEvent<HTMLElement>, d?: T) => {
            onClick?.(e, d);
        }, 300),
        [onClick]
    );

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        if (loading) return;
        e.stopPropagation();

        if (useDebounce) {
            debouncedClick(e, data);
        } else {
            onClick?.(e, data);
        }
    };

    // 4. Render nội dung (nếu đang loading thì hiện Spin)
    const renderContent = () => (
        <div className="flex items-center gap-2">
            {loading && (
                <Spin 
                    indicator={
                        <LoadingOutlined 
                            style={{ 
                                fontSize: 16, 
                                color: (variant === 'primary' || variant === 'danger' || btnType === 'add' || btnType === 'delete') 
                                    ? getTextColor(variant === 'danger' || btnType === 'delete' ? token.colorError : token.colorPrimary) 
                                    : token.colorPrimary 
                            }} 
                            spin 
                        />
                    } 
                />
            )}
            {icon && !loading && icon}
            {children}
        </div>
    );

    // 5. Wrap các lớp tương tác (Popconfirm -> Tooltip -> Button)
    const buttonElement = (
        <Button
            {...props}
            {...config}
            loading={false} // Force false to use custom spin
            disabled={!!loading || props.disabled}
            onClick={confirm ? undefined : handleClick} // Nếu có confirm, onClick sẽ được handle bởi Popconfirm
            className={`${config.className} ${className || ''}`}
        >
            {renderContent()}
        </Button>
    );

    const withConfirm = confirm ? (
        <Popconfirm
            title={confirm}
            onConfirm={(e) => handleClick(e as any)}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ style: { backgroundColor: token.colorPrimary, color: primaryTextColor } }}
            icon={<QuestionCircleOutlined style={{ color: token.colorWarning }} />}
        >
            {buttonElement}
        </Popconfirm>
    ) : buttonElement;

    return title ? (
        <Tooltip title={title} mouseEnterDelay={0.5}>
            {withConfirm}
        </Tooltip>
    ) : (
        withConfirm
    );
};

export default AppButton;
