'use client';

import React from 'react';
import { Tag, TagProps, Tooltip } from 'antd';
import { 
    CheckCircleOutlined, 
    CloseCircleOutlined, 
    SyncOutlined, 
    LockOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { theme } from 'antd';
import { useContrastColor } from '@/hooks/useContrastColor';

/**
 * Các trạng thái mặc định được hệ thống hỗ trợ
 */
export type DefaultStatusType = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING' | boolean;

export interface BadgeConfig {
    label: string;
    color: string;
    icon?: React.ReactNode;
}

export interface AppBadgeProps extends Omit<TagProps, 'color'> {
    /**
     * Giá trị trạng thái (có thể là string constant hoặc boolean)
     */
    value: DefaultStatusType | string;
    /**
     * Bản đồ cấu hình đè (override) mapping mặc định
     */
    statusMap?: Record<string, BadgeConfig>;
    /**
     * Text hiển thị khi hover
     */
    tooltip?: string;
}

/**
 * Mapping mặc định cho các trạng thái phổ biến trong hệ thống Mint ERP
 */
const DEFAULT_MAP: Record<string, BadgeConfig> = {
    'ACTIVE': { label: 'Hoạt động', color: 'success', icon: <CheckCircleOutlined /> },
    'true': { label: 'Hoạt động', color: 'success', icon: <CheckCircleOutlined /> },
    'INACTIVE': { label: 'Vô hiệu hóa', color: 'default', icon: <CloseCircleOutlined /> },
    'false': { label: 'Vô hiệu hóa', color: 'default', icon: <CloseCircleOutlined /> },
    'LOCKED': { label: 'Đã khóa', color: 'error', icon: <LockOutlined /> },
    'PENDING': { label: 'Chờ xử lý', color: 'warning', icon: <ClockCircleOutlined /> },
};

/**
 * AppBadge - Component hiển thị nhãn trạng thái đồng bộ
 * Tự động chuyển đổi giá trị từ database sang label tiếng Việt và màu sắc tương ứng
 */
export const AppBadge: React.FC<AppBadgeProps> = ({ 
    value, 
    statusMap, 
    tooltip,
    className,
    ...props 
}) => {
    const { token } = theme.useToken();
    const { getTextColor } = useContrastColor();

    // Chuyển value về string để tra cứu trong map
    const key = String(value).toUpperCase();
    
    // Ưu tiên map truyền vào từ prop, sau đó đến map mặc định
    const config = statusMap?.[value as string] || statusMap?.[key] || DEFAULT_MAP[key] || {
        label: String(value),
        color: 'default'
    };

    const tagElement = (
        <Tag 
            color={config.color} 
            icon={config.icon}
            className={`rounded-full px-3 py-0.5 font-medium border-0 flex items-center w-fit ${className || ''}`}
            style={{ 
                color: config.color.startsWith('#') ? getTextColor(config.color) : undefined,
                ...props.style 
            }}
            {...props}
        >
            {config.label}
        </Tag>
    );

    return tooltip ? (
        <Tooltip title={tooltip}>
            {tagElement}
        </Tooltip>
    ) : tagElement;
};

export default AppBadge;
