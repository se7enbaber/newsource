'use client';

import React from 'react';
import { AppStatCard, AppStatCardProps } from './AppStatCard';

/**
 * Interface cho trend badge
 */
interface StatTrend {
    value: number | string;
    direction: 'up' | 'down';
}

/**
 * Mở rộng AppStatCardProps cho container
 */
export interface AppStatCardsItem extends AppStatCardProps {
    trend?: StatTrend | any; // Chấp nhận cả kiểu cũ nếu có
}

export interface AppStatCardsProps {
    /**
     * Danh sách các thông số cần hiển thị
     */
    items: AppStatCardsItem[];
    /**
     * Class CSS bổ sung cho container
     */
    className?: string;
}

/**
 * AppStatCards - Container hiển thị nhóm các thẻ thống kê
 * Hỗ trợ layout responsive tự động (2 cột mobile, 4 cột desktop)
 */
export const AppStatCards: React.FC<AppStatCardsProps> = ({ items, className }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${className || ''}`}>
            {items.map((item, index) => {
                // Chuyển đổi trend sang format text cho AppStatCard cũ nếu cần
                // Hoặc AppStatCard có thể được cập nhật để hiểu format mới
                let displayTrend = item.trend;
                if (item.trend && typeof item.trend === 'object' && item.trend.value) {
                    const sign = item.trend.direction === 'up' ? '+' : '-';
                    displayTrend = `${sign}${item.trend.value}%`;
                }

                return (
                    <AppStatCard 
                        key={index} 
                        {...item} 
                        trend={displayTrend}
                    />
                );
            })}
        </div>
    );
};

export default AppStatCards;
