'use client';

import React from 'react';
import { Input, Space, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/ThemeProvider';

/**
 * Hook cung cấp logic tìm kiếm (filter) cho các cột trong AppGrid
 * Giúp tái sử dụng UI filter chuẩn ERP (Title + Icon Filter sát nhau)
 */
export const useAppGridSearch = () => {
    const { t } = useTranslation();
    const { primaryColor } = useTheme();

    const getColumnSearchProps = <T,>(dataIndex: keyof T, label: string): ColumnType<T> => ({
        title: (
            <span>{label}</span>
        ),
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    placeholder={`${t('search')} ${label}`}
                    value={selectedKeys[0] !== undefined ? String(selectedKeys[0]) : ''}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90, backgroundColor: primaryColor }}
                    >
                        {t('search')}
                    </Button>
                    <Button
                        onClick={() => {
                            if (clearFilters) clearFilters();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        {t('reset')}
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <FilterOutlined style={{ color: filtered ? primaryColor : 'inherit', fontSize: '14px', opacity: filtered ? 1 : 0.4 }} />
        ),
        onFilter: (value, record) => {
            const recordValue = record[dataIndex];
            if (!recordValue) return false;
            return recordValue
                .toString()
                .toLowerCase()
                .includes((value as string).toLowerCase());
        },
    });

    return { getColumnSearchProps };
};
