'use client';

import React, { useRef, useState } from 'react';
import { Table, Button, Input, Space, Breadcrumb, Card, Tooltip, Tag } from 'antd';
import type { InputRef } from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import {
    PlusOutlined,
    SearchOutlined,
    FilterOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    GlobalOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { AppButton } from '@/app/components/common/AppButton';
import { AppGrid } from '@/app/components/common/AppGrid';
import { AppToolbar } from '@/app/components/common/AppToolbar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/ThemeProvider';
import { useAppGridSearch } from '@/app/components/common/AppGridSearch';
import { AccessGuard } from '@/lib/AccessGuard';
import { AppTour } from '@/app/components/common/AppTour';

interface ProductDataType {
    key: string;
    code: string;
    name: string;
    foreignName: string;
    attributes: string;
}

const data: ProductDataType[] = [
    {
        key: '1',
        code: 'PROD001',
        name: 'Sản phẩm A',
        foreignName: 'Product Alpha',
        attributes: 'Màu đỏ, Size L',
    },
    {
        key: '2',
        code: 'PROD002',
        name: 'Sản phẩm B',
        foreignName: 'Product Beta',
        attributes: 'Màu xanh, Size M',
    },
];

type DataIndex = keyof ProductDataType;

export default function ProductListPage() {
    const { t } = useTranslation();
    const { getColumnSearchProps } = useAppGridSearch();
    const [mounted, setMounted] = React.useState(false);

    // State cho tìm kiếm toàn cục
    const [searchText, setSearchText] = useState('');

    // Tour state & refs
    const [tourOpen, setTourOpen] = useState(false);
    const searchRef = useRef(null);
    const addBtnRef = useRef(null);
    const gridRef = useRef(null);
    const helpBtnRef = useRef(null);
    const exportBtnRef = useRef(null);

    const tourSteps = [
        {
            title: t('tour_search_title'),
            description: t('tour_search_desc'),
            target: () => searchRef.current,
        },
        {
            title: t('tour_help_title'),
            description: t('tour_help_desc'),
            target: () => helpBtnRef.current,
        },
        {
            title: t('tour_add_title'),
            description: t('tour_add_desc'),
            target: () => addBtnRef.current,
        },
        {
            title: t('tour_export_title'),
            description: t('tour_export_desc'),
            target: () => exportBtnRef.current,
        },
        {
            title: t('tour_grid_title'),
            description: t('tour_grid_desc'),
            target: () => gridRef.current,
        },
        {
            title: t('tour_edit_title'),
            description: t('tour_edit_desc'),
            target: () => document.querySelector('.tour-edit') as HTMLElement,
        },
    ];

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Logic lọc dữ liệu toàn cục (Global search)
    const filteredData = React.useMemo(() => {
        return data.filter((item) => {
            if (!searchText) return true;
            return Object.values(item).some(
                val => val.toString().toLowerCase().includes(searchText.toLowerCase())
            );
        });
    }, [searchText]);

    const columns: ColumnsType<ProductDataType> = [
        {
            title: t('product_actions'),
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title={t('view_detail')}>
                        <AppButton
                            btnType="view"
                            onClick={() => console.log('View', record)}
                        />
                    </Tooltip>
                    <Tooltip title={t('edit')}>
                        <AppButton
                            btnType="edit"
                            onClick={() => console.log('Edit', record)}
                        />
                    </Tooltip>
                    <Tooltip title={t('delete')}>
                        <AppButton
                            btnType="delete"
                            className="tour-delete"
                            onClick={() => console.log('Delete', record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
        {
            ...getColumnSearchProps('code', t('product_code')),
            dataIndex: 'code',
            key: 'code',
            width: 140,
            align: 'center',
            render: (text) => <span className="font-medium text-gray-700">{text}</span>
        },
        {
            ...getColumnSearchProps('name', t('product_name')),
            dataIndex: 'name',
            key: 'name',
            width: 250,
            align: 'center',
        },
        {
            ...getColumnSearchProps('foreignName', t('product_foreign_name')),
            dataIndex: 'foreignName',
            key: 'foreignName',
            width: 200,
            align: 'center',
            render: (text) => <span className="text-gray-400 italic">{text}</span>
        },
        {
            title: <span className="text-white font-semibold">{t('product_attributes')}</span>,
            dataIndex: 'attributes',
            key: 'attributes',
            align: 'center',
            render: (attr) => (
                <Tag color="blue" className="rounded-full">{attr}</Tag>
            )
        },
    ];

    if (!mounted) return null;

    return (
        <AccessGuard feature="Feature.MDM.Products" permission="AdministrationService.Products.View">
            <div className="flex flex-col gap-4">
                <Breadcrumb items={[{ title: t('menu_mdm') }, { title: t('menu_products') }]} />

                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800 m-0">{t('product_list_title')}</h1>
                </div>

                <Card className="shadow-sm border-none overflow-hidden" style={{ borderRadius: 6 }}>
                    <AppToolbar
                        searchId="product-search-input"
                        searchValue={searchText}
                        onSearchChange={setSearchText}
                        searchRef={searchRef}
                        buttons={[
                            {
                                key: 'add',
                                onClick: () => console.log('Add Product'),
                                title: `${t('add')} ${t('product')}`,
                                ref: addBtnRef
                            },
                            {
                                key: 'export',
                                onClick: () => console.log('Exporting...'),
                                title: t('export'),
                                ref: exportBtnRef
                            },
                            {
                                key: 'help',
                                onClick: () => setTourOpen(true),
                                title: t('help') || 'Hướng dẫn',
                                ref: helpBtnRef
                            },
                            {
                                key: 'filter',
                                onClick: () => console.log('Filter clicked'),
                                title: t('filter')
                            }
                        ]}
                    />

                    <div ref={gridRef}>
                        <AppGrid
                            columns={columns}
                            dataSource={filteredData}
                            rowKey="key"
                            className="tour-grid"
                            onSelectionChange={(keys: any) => console.log('Đã chọn:', keys)}
                        />
                    </div>
                </Card>

                <AppTour
                    open={tourOpen}
                    onClose={() => setTourOpen(false)}
                    steps={tourSteps}
                />
            </div>
        </AccessGuard >
    );
}
