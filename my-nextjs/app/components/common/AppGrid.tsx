'use client';

import React, { useState } from 'react';
import { Table, TableProps } from 'antd';
import { useTheme } from '@/lib/ThemeProvider';
import { AnyObject } from 'antd/es/_util/type';

/**
 * AppGridProps sử dụng Generic <T> để đảm bảo Type Safety cho dữ liệu
 * Tương đương với việc định nghĩa GridView<T> trong C#
 */
interface AppGridProps<T extends AnyObject> extends TableProps<T> {
    showCheckbox?: boolean; // Bật/tắt chọn nhiều dòng
    showNo?: boolean; // Bật/tắt cột đánh số thứ tự (mặc định true)
    onSelectionChange?: (selectedKeys: React.Key[], selectedRows: T[]) => void;
}

export const AppGrid = <T extends AnyObject>({
    columns,
    dataSource,
    showCheckbox = true,
    showNo = true,
    onSelectionChange,
    pagination,
    className,
    ...props
}: AppGridProps<T>) => {
    const { primaryColor } = useTheme(); // Lấy màu hiện tại từ FloatButton
    const [activeRowKey, setActiveRowKey] = useState<React.Key | null>(null);

    // Tính toán lại columns để chèn cột đánh số No. vào đầu nếu showNo = true
    const finalColumns = React.useMemo(() => {
        if (!showNo || !columns) return columns;

        const noColumn: any = {
            title: 'No.',
            key: 'app-grid-no',
            width: 70,
            align: 'center' as const,
            fixed: 'left',
            render: (_: any, __: any, index: number) => {
                const current = (pagination as any)?.current || 1;
                const pageSize = (pagination as any)?.pageSize || 10;
                return (current - 1) * pageSize + index + 1;
            },
        };

        // Nếu cột đầu tiên là checkbox (do antd tự chèn nếu dùng rowSelection)
        // antd sẽ tự quản lý thứ tự checkbox, ta chỉ cần chèn No. vào mảng columns của mình.
        return [noColumn, ...columns];
    }, [columns, showNo, pagination]);

    const getRowKey = (record: T): React.Key => {
        if (typeof props.rowKey === 'function') {
            return props.rowKey(record) as React.Key;
        }
        if (typeof props.rowKey === 'string') {
            return record[props.rowKey] as React.Key;
        }
        return record.id || record.key;
    };
    // Cấu hình chọn dòng (Checkbox)
    const rowSelection = showCheckbox ? {
        onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => {
            onSelectionChange?.(selectedRowKeys, selectedRows);
        },
    } : undefined;

    return (
        <Table
            {...props}
            columns={finalColumns}
            dataSource={dataSource}
            rowSelection={rowSelection}
            size="small" // Kích thước nhỏ gọn cho ERP
            bordered={false}
            onRow={(record, rowIndex) => {
                const rowKey = getRowKey(record);
                const originalOnRow = props.onRow ? props.onRow(record, rowIndex) : {};
                return {
                    ...originalOnRow,
                    onClick: (e) => {
                        setActiveRowKey(rowKey);
                        originalOnRow.onClick?.(e);
                    }
                };
            }}
            rowClassName={(record, index, indent) => {
                const rowKey = getRowKey(record);
                let originalClass = '';
                if (typeof props.rowClassName === 'function') {
                    originalClass = props.rowClassName(record, index, indent);
                } else if (props.rowClassName) {
                    originalClass = props.rowClassName;
                }
                const focusClass = activeRowKey === rowKey ? 'ant-table-row-selected' : '';
                return `${originalClass} ${focusClass}`.trim();
            }}
            className={`custom-app-grid ${className || ''}`}
            // Cấu hình phân trang mặc định
            pagination={pagination !== false ? {
                size: 'small',
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                defaultPageSize: 10,
                showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
                ...pagination
            } : false}
            // Style cho header bảng đồng bộ với màu Teal nếu cần
            style={{
                ['--primary-color' as any]: primaryColor,
                ...props.style
            }}
        />
    );
};