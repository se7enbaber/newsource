'use client';

import React, { useCallback } from 'react';
import { Button, Tooltip, ButtonProps } from 'antd';
import {
    PlusOutlined,
    FileExcelOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { debounce } from 'lodash';
import { useTheme } from '@/lib/ThemeProvider';
import { usePermission } from '@/lib/PermissionProvider';

interface AppButtonProps<T = any> extends Omit<ButtonProps, 'onClick'> {
    title?: string;
    btnType?: 'add' | 'export' | 'filter' | 'edit' | 'delete' | 'view' | 'help' | 'vibe' | 'quest';
    data?: T;
    permission?: string | string[];
    useDebounce?: boolean;
    onClick?: (e: React.MouseEvent<HTMLElement>, data?: T) => void;
}

export const AppButton = <T,>({
    title,
    icon,
    style,
    btnType,
    className,
    children,
    onClick,
    data,
    permission,
    useDebounce = false,
    ...props
}: AppButtonProps<T>) => {
    const { primaryColor } = useTheme();
    const { hasPermission } = usePermission();

    const canAccess = !permission || hasPermission(permission);

    if (!canAccess) return null;

    const getConfigs = () => {
        const themeBackground = { backgroundColor: primaryColor, color: 'white', ...style };
        const roundedClass = 'rounded-md flex items-center justify-center';

        switch (btnType) {
            case 'add':
                return {
                    type: 'primary' as const,
                    style: themeBackground,
                    className: `${roundedClass}`,
                    icon: icon || <PlusOutlined />
                };
            case 'export':
                return {
                    style: themeBackground,
                    className: `${roundedClass}`,
                    icon: icon || <FileExcelOutlined />
                };
            case 'help':
                return {
                    type: 'default' as const,
                    className: `${roundedClass} bg-gray-50 text-gray-600 border-gray-300`,
                    icon: icon || <QuestionCircleOutlined />
                };
            case 'delete':
                return {
                    danger: true,
                    type: 'text' as const,
                    className: `${roundedClass} hover:bg-red-50`,
                    icon: icon || <DeleteOutlined />
                };
            case 'edit':
                return {
                    type: 'text' as const,
                    className: `${roundedClass} hover:bg-orange-50`,
                    icon: icon || <EditOutlined />
                };
            case 'view':
                return {
                    type: 'default' as const,
                    className: `${roundedClass} border-primary`,
                    style: {
                        borderColor: props.disabled ? undefined : primaryColor,
                        color: props.disabled ? undefined : primaryColor,
                        ...style
                    },
                    icon: icon || <EyeOutlined />
                };
            case 'vibe':
                return {
                    className: `${roundedClass} btn-primary-vibe`,
                    icon: icon || children === 'Add' ? <PlusOutlined /> : icon,
                };
            case 'quest':
                return {
                    className: `${roundedClass} btn-side-quest`,
                    icon: icon || <QuestionCircleOutlined />
                };
            default:
                return {
                    className: `${roundedClass} border-gray-300`,
                    style: themeBackground,
                    icon: icon
                };
        }
    };

    const config = getConfigs();

    const debouncedClick = useCallback(
        debounce((e: React.MouseEvent<HTMLElement>, d?: T) => {
            onClick?.(e, d);
        }, 300),
        [onClick]
    );

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();

        if (useDebounce) {
            debouncedClick(e, data);
        } else {
            onClick?.(e, data);
        }
    };

    const buttonElement = (
        <Button
            {...config}
            {...props}
            onClick={handleClick}
            className={`${config.className} ${btnType ? `tour-${btnType}` : ''} ${className || ''}`}
        >
            {children}
        </Button>
    );

    return title ? (
        <Tooltip title={title} mouseEnterDelay={0.5}>
            {buttonElement}
        </Tooltip>
    ) : (
        buttonElement
    );
};
