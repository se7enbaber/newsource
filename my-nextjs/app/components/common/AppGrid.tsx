import React, { useState, useEffect, useRef } from 'react';
import { Table, TableProps, Empty, Skeleton, theme, Dropdown, MenuProps, Space, Tooltip, Popconfirm, Button } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { AppStatCardProps } from './AppStatCard';
import { AppStatCards, AppStatCardsItem } from './AppStatCards';
import { AppButton, AppButtonProps } from './AppButton';
import { useContrastColor } from '@/hooks/useContrastColor';
import { SettingOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { useToken } = theme;

/**
 * Cấu hình cho mỗi hành động trên dòng (Edit, Delete, ...)
 */
export interface RowAction<T> extends Omit<AppButtonProps<T>, 'onClick'> {
    key: string;
    label?: string;
    onClick: (record: T) => void;
    danger?: boolean;
    confirm?: string;
    icon?: React.ReactNode;
}

export interface AppGridProps<T extends AnyObject> extends Omit<TableProps<T>, 'pagination'> {
    /**
     * Bật cột đánh số thứ tự (mặc định true)
     */
    showNo?: boolean;
    /**
     * Danh sách các card thống kê hiển thị phía trên bảng (bí danh cũ)
     */
    summaryCards?: AppStatCardProps[];
    /**
     * Danh sách các card thống kê hiển thị phía trên bảng (bí danh mới)
     */
    statCards?: AppStatCardsItem[];
    /**
     * Các nút chức năng hoặc công cụ tìm kiếm phía trên bên phải
     */
    toolbar?: React.ReactNode;
    /**
     * Danh sách hành động thực hiện trên từng dòng (hiện khi hover)
     */
    rowActions?: RowAction<T>[];
    /**
     * Cấu hình phân trang mở rộng
     */
    pagination?: {
        total?: number;
        pageSize?: number;
        current?: number;
        onChange?: (page: number, pageSize: number) => void;
    } | false;
    /**
     * Sự kiện khi chọn dòng (hỗ trợ nhanh cho rowSelection)
     */
    onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    /**
     * Hành động khi click vào nút "Thêm mới" trong Empty state
     */
    onEmptyClick?: () => void;
}

/**
 * AppGrid - Thành phần hiển thị dữ liệu mạnh mẽ của Mint ERP
 * Tích hợp sẵn Header thông minh theo Theme, Phân trang, Thống kê và Xử lý quyền hạn
 */
export const AppGrid = <T extends AnyObject>({
    columns,
    dataSource,
    loading,
    showNo = true,
    summaryCards,
    statCards,
    toolbar,
    rowActions,
    pagination,
    className,
    onSelectionChange,
    onEmptyClick,
    ...props
}: AppGridProps<T>) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { getTextColor } = useContrastColor();
    const [hoveredRowKey, setHoveredRowKey] = useState<React.Key | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Xử lý phím tắt Focus Search (Ctrl+F hoặc '/')
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                const searchInput = document.querySelector('.ant-input-search input') as HTMLInputElement;
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getRowKey = (record: T): React.Key => {
        if (typeof props.rowKey === 'function') return props.rowKey(record) as React.Key;
        if (typeof props.rowKey === 'string') return record[props.rowKey] as React.Key;
        return record.id || record.key || record.uid || (record as any).uid;
    };

    // 1. Tự động tính toán Columns (Thêm No. và Actions)
    const finalColumns = React.useMemo(() => {
        if (!columns) return [];

        let cols = [...columns];

        // Thêm cột STT vào đầu
        if (showNo) {
            const noColumn = {
                title: t('no', 'No.'),
                key: 'app-grid-no',
                width: 60,
                align: 'center' as const,
                fixed: 'left' as const,
                render: (_: any, __: any, index: number) => {
                    if (pagination === false) return index + 1;
                    const current = pagination?.current || 1;
                    const pageSize = pagination?.pageSize || 10;
                    return (current - 1) * pageSize + index + 1;
                },
            };
            cols = [noColumn, ...cols];
        }

        // Thêm cột Actions vào cuối nếu có rowActions
        if (rowActions && rowActions.length > 0) {
            cols.push({
                title: <SettingOutlined className="text-sm opacity-60" />,
                key: 'app-grid-actions',
                width: rowActions.length < 3 ? rowActions.length * 44 + 20 : 64,
                align: 'right' as const,
                fixed: 'right' as const,
                render: (_: any, record: T) => {
                    const rowKey = getRowKey(record);
                    const isHovered = hoveredRowKey === rowKey;

                    // Nếu <= 2 actions: hiển thị trực tiếp
                    if (rowActions.length < 3) {
                        return (
                            <div className={`flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150`}>
                                {rowActions.map(action => {
                                    const { key, onClick, label, icon, confirm, danger, ...actionProps } = action;

                                    const button = (
                                        <AppButton
                                            key={key}
                                            size="small"
                                            variant="ghost"
                                            danger={danger}
                                            {...actionProps}
                                            icon={icon}
                                            onClick={(e) => {
                                                if (confirm) return; // Popconfirm xử lý
                                                e.stopPropagation();
                                                onClick(record);
                                            }}
                                        />
                                    );

                                    const wrappedButton = label ? <Tooltip title={label}>{button}</Tooltip> : button;

                                    if (confirm) {
                                        return (
                                            <Popconfirm
                                                key={key}
                                                title={confirm}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    onClick(record);
                                                }}
                                                onCancel={(e) => e?.stopPropagation()}
                                                okText={t('yes', 'Có')}
                                                cancelText={t('cancel', 'Hủy')}
                                            >
                                                <div onClick={(e) => e.stopPropagation()}>{wrappedButton}</div>
                                            </Popconfirm>
                                        );
                                    }

                                    return wrappedButton;
                                })}
                            </div>
                        );
                    }

                    // Nếu >= 3 actions: dùng Dropdown
                    const menuItems: MenuProps['items'] = rowActions.map(action => ({
                        key: action.key,
                        label: action.label || action.key,
                        icon: action.icon,
                        danger: action.danger,
                        onClick: (info) => {
                            info.domEvent.stopPropagation();
                            action.onClick(record);
                        }
                    }));

                    return (
                        <div className={`flex justify-end opacity-0 group-hover/row:opacity-100 transition-opacity duration-150`}>
                            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<MoreOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:scale-110 active:scale-90 transition-transform"
                                />
                            </Dropdown>
                        </div>
                    );
                }
            });
        }

        return cols;
    }, [columns, showNo, rowActions, pagination, hoveredRowKey]);

    // 2. Render Header (toolbar + summary)
    const renderHeader = () => {
        const stats = statCards || summaryCards;
        if (!stats && !toolbar) return null;
        return (
            <div className="mb-6 space-y-6">
                {stats && <AppStatCards items={stats} />}
                {toolbar && (
                    <div
                        className="flex justify-between items-center p-4 rounded-xl shadow-sm border"
                        style={{
                            backgroundColor: token.colorBgContainer,
                            borderColor: token.colorBorderSecondary
                        }}
                    >
                        <div className="flex-1" /> {/* Placeholder cho bên trái nếu cần */}
                        <div className="flex items-center gap-2">
                            {toolbar}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // 3. Render Skeleton Table
    const renderSkeleton = () => {
        const rowCount = pagination === false ? 5 : (pagination?.pageSize || 5);
        return (
            <div className="p-0 border rounded-2xl overflow-hidden" style={{ borderColor: token.colorBorderSecondary }}>
                <div className="h-10 border-b flex items-center px-4" style={{ backgroundColor: token.colorPrimaryBg }}>
                    <Skeleton.Button active block size="small" />
                </div>
                {Array.from({ length: rowCount }).map((_, idx) => (
                    <div key={idx} className="h-14 border-b flex items-center px-4 gap-4" style={{ borderBottomColor: token.colorBorderSecondary }}>
                        <Skeleton.Avatar active size="small" shape="square" />
                        <Skeleton.Input active block size="small" />
                        <Skeleton.Input active block size="small" />
                        <Skeleton.Input active block size="small" />
                    </div>
                ))}
            </div>
        );
    };

    // 4. Render Table
    return (
        <div className={`app-grid-container ${className || ''}`} ref={containerRef}>
            {renderHeader()}

            <div
                className="rounded-2xl shadow-sm border overflow-hidden"
                style={{
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary
                }}
            >
                {loading && (!dataSource || dataSource.length === 0) ? (
                    renderSkeleton()
                ) : (
                    <Table
                        {...props}
                        rowSelection={onSelectionChange ? {
                            onChange: onSelectionChange,
                            ...props.rowSelection
                        } : props.rowSelection}
                        columns={finalColumns}
                        dataSource={dataSource}
                        loading={loading}
                        size="middle"
                        className="mint-erp-table"
                        onRow={(record) => ({
                            onMouseEnter: () => setHoveredRowKey(getRowKey(record)),
                            onMouseLeave: () => setHoveredRowKey(null),
                            className: 'group/row'
                        })}
                        components={{
                            header: {
                                cell: (headerProps: any) => (
                                    <th
                                        {...headerProps}
                                        style={{
                                            ...headerProps.style,
                                            backgroundColor: token.colorPrimaryBg,
                                            color: token.colorPrimary,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            fontSize: '11px',
                                            letterSpacing: '0.05em',
                                            borderBottom: `2px solid ${token.colorPrimaryBorder}`,
                                            padding: '14px 16px',
                                        }}
                                    />
                                )
                            },
                            body: {
                                cell: (cellProps: any) => (
                                    <td
                                        {...cellProps}
                                        style={{
                                            ...cellProps.style,
                                            padding: '14px 16px',
                                            color: token.colorTextSecondary,
                                            fontWeight: 500,
                                        }}
                                    />
                                )
                            }
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <Space orientation="vertical" size={12}>
                                            <span style={{ color: token.colorTextDescription }}>{t('no_data', 'Chưa có dữ liệu')}</span>
                                            {onEmptyClick && (
                                                <AppButton
                                                    size="small"
                                                    icon={<PlusOutlined />}
                                                    onClick={onEmptyClick}
                                                    variant="secondary"
                                                >
                                                    {t('start_by_adding_new', 'Bắt đầu bằng cách thêm mới →')}
                                                </AppButton>
                                            )}
                                        </Space>
                                    }
                                />
                            )
                        }}
                        pagination={pagination !== false ? {
                            showSizeChanger: true,
                            locale: { items_per_page: t('per_page', '/ trang') },
                            showTotal: (total: number) => t('total_records', { total, defaultValue: `Tổng cộng ${total} bản ghi` }),
                            ...pagination
                        } : false}
                        style={{
                            ...props.style
                        }}
                    />
                )}
            </div>

            <style jsx global>{`
                /* Action buttons hover transition */
                .mint-erp-table .ant-table-row:hover .opacity-0 {
                    /* opacity-100 logic handled by tailwind group-hover */
                }
                
                /* Row Striping */
                .mint-erp-table .ant-table-row:nth-child(even) {
                    background-color: ${token.colorFillAlter};
                }

                .mint-erp-table .ant-table-thead > tr > th {
                    background-color: ${token.colorPrimaryBg} !important;
                    color: ${token.colorPrimary} !important;
                }
                
                .mint-erp-table .ant-table-row:hover > td {
                    background-color: ${token.colorPrimaryBg} !important;
                    color: ${token.colorPrimary} !important;
                }
                
                .mint-erp-table .ant-table-pagination {
                    padding: 16px 24px;
                    margin: 0 !important;
                    border-top: 1px solid ${token.colorBorderSecondary} !important;
                }
                .mint-erp-table .ant-table-container {
                    border-radius: ${token.borderRadiusLG}px;
                }
            `}</style>
        </div>
    );
};

export default AppGrid;