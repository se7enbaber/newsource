'use client';

import React from 'react';
import { Card, Typography, Space, Tooltip, theme } from 'antd';
import { 
    InfoCircleOutlined, 
    ArrowUpOutlined, 
    ArrowDownOutlined 
} from '@ant-design/icons';

const { Title } = Typography;
const { useToken } = theme;
import { useContrastColor } from '@/hooks/useContrastColor';

export interface AppStatCardProps {
    /**
     * Nhãn hiển thị cho card (ví dụ: "Tổng người dùng")
     */
    label: string;
    /**
     * Giá trị thống kê (số lượng hoặc text)
     */
    value: string | number;
    /**
     * Icon hiển thị phía trước label
     */
    icon?: React.ReactNode;
    /**
     * Tỉ lệ tăng/giảm (trend) nếu có (ví dụ: "+12%")
     */
    trend?: string | number;
    /**
     * Màu sắc của card hoặc giá trị (theo Ant Design preset hoặc hex)
     * Ưu tiên dùng các token màu có sẵn
     */
    color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | string;
    /**
     * Mô tả chi tiết khi hover vào icon info
     */
    tooltip?: string;
    /**
     * Class CSS bổ sung
     */
    className?: string;
}

/**
 * AppStatCard - Component hiển thị thông số tóm tắt
 * Thường xuất hiện trên Grid hoặc Dashboard để cung cấp cái nhìn tổng quan nhanh
 */
export const AppStatCard: React.FC<AppStatCardProps> = ({
    label,
    value,
    icon,
    trend,
    color = 'primary',
    tooltip,
    className
}) => {
    const { token } = useToken();
    const { getTextColor } = useContrastColor();
    
    // Mapping màu sắc dựa trên token để hỗ trợ đổi theme
    const getColor = () => {
        switch (color) {
            case 'primary': return token.colorPrimary;
            case 'success': return token.colorSuccess;
            case 'error': return token.colorError;
            case 'warning': return token.colorWarning;
            case 'info': return token.colorInfo;
            default: return color; // Nếu là hex code cụ thể
        }
    };

    const mainColor = getColor();
    const isPositive = typeof trend === 'string' ? trend.startsWith('+') : Number(trend) > 0;

    return (
        <Card 
            className={`border-0 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden ${className || ''}`}
            styles={{ body: { padding: '20px 24px' } }}
            style={{ backgroundColor: token.colorBgContainer }}
        >
            <Space orientation="vertical" size={4} className="w-full">
                <div className="flex items-center justify-between">
                    <Space size={8} className="font-semibold uppercase text-xs tracking-wider">
                        {icon && <span style={{ color: mainColor }}>{icon}</span>}
                        <span style={{ color: token.colorTextSecondary }}>{label}</span>
                        {tooltip && (
                            <Tooltip title={tooltip}>
                                <InfoCircleOutlined 
                                    className="cursor-help" 
                                    style={{ color: token.colorTextQuaternary }} 
                                />
                            </Tooltip>
                        )}
                    </Space>
                </div>

                <div className="flex items-end justify-between mt-1">
                    <Title 
                        level={2} 
                        className="!mb-0 !font-black !text-3xl"
                        style={{ color: token.colorText }}
                    >
                        {value}
                    </Title>
                    
                    {trend && (
                        <div 
                            className="flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full"
                            style={{ 
                                backgroundColor: isPositive ? token.colorSuccessBg : token.colorErrorBg,
                                color: isPositive ? getTextColor(token.colorSuccessBg) : getTextColor(token.colorErrorBg)
                            }}
                        >
                            {isPositive ? <ArrowUpOutlined className="text-xs" /> : <ArrowDownOutlined className="text-xs" />}
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
            </Space>
            
            {/* Thanh trang trí đồng bộ với màu Primary của theme */}
            <div 
                className="absolute bottom-0 left-0 h-1 w-full opacity-60" 
                style={{ backgroundColor: mainColor }} 
            />
        </Card>
    );
};

export default AppStatCard;
