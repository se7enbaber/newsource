'use client';

import React from 'react';
import { Popover, Space, theme } from 'antd';
import AppBadge from './AppBadge';

export interface AppTagListProps {
    /**
     * Danh sách các nhãn (tags)
     */
    tags: string[];
    /**
     * Số lượng tag tối đa hiển thị trực tiếp
     * @default 3
     */
    maxVisible?: number;
    /**
     * Class CSS bổ sung
     */
    className?: string;
}

/**
 * AppTagList - Component hiển thị danh sách nhãn với cơ chế "+N more"
 * Giúp bảng dữ liệu luôn gọn gàng và đồng nhất về chiều cao dòng
 */
export const AppTagList: React.FC<AppTagListProps> = ({ 
    tags = [], 
    maxVisible = 3,
    className 
}) => {
    const { token } = theme.useToken();
    
    if (!tags || tags.length === 0) return null;

    const visibleTags = tags.slice(0, maxVisible);
    const hiddenTags = tags.slice(maxVisible);
    const hasMore = hiddenTags.length > 0;

    return (
        <div className={`flex items-center gap-1 flex-nowrap overflow-hidden ${className || ''}`}>
            <Space size={4} wrap={false}>
                {visibleTags.map((tag, index) => (
                    <AppBadge 
                        key={index} 
                        value={tag} 
                        style={{ margin: 0 }}
                    />
                ))}
                
                {hasMore && (
                    <Popover
                        content={
                            <div className="flex flex-wrap gap-2 max-w-[300px] p-1">
                                {hiddenTags.map((tag, index) => (
                                    <AppBadge key={index} value={tag} />
                                ))}
                            </div>
                        }
                        title="Tính năng bổ sung"
                        trigger="click"
                        placement="top"
                    >
                        <div 
                            className="cursor-pointer transition-all hover:scale-105 active:scale-95"
                            style={{ 
                                backgroundColor: token.colorFillSecondary,
                                color: token.colorTextSecondary,
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: `1px border ${token.colorBorderSecondary}`
                            }}
                        >
                            +{hiddenTags.length} more
                        </div>
                    </Popover>
                )}
            </Space>
        </div>
    );
};

export default AppTagList;
