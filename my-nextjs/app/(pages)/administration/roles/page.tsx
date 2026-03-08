'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Space, Breadcrumb, Card, Badge, App } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, FileExcelOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { AppButton } from '@/app/components/common/AppButton';
import { AppGrid } from '@/app/components/common/AppGrid';
import { AppToolbar } from '@/app/components/common/AppToolbar';
import { useTranslation } from 'react-i18next';
import { getRolesApi, RoleData } from '@/services/roleService';
import type { ColumnsType } from 'antd/es/table';
import { useAppGridSearch } from '@/app/components/common/AppGridSearch';
import { FormModal } from './FormModal';
import { AccessGuard } from '@/lib/AccessGuard';
import { AppTour } from '@/app/components/common/AppTour';

export default function RoleListPage() {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const { getColumnSearchProps } = useAppGridSearch();

    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [currentPagination, setCurrentPagination] = useState({ current: 1, pageSize: 10 });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);

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
            target: () => document.querySelector('.tour-grid') as HTMLElement,
        },
        {
            title: t('tour_edit_title'),
            description: t('tour_edit_desc'),
            target: () => document.querySelector('.tour-edit') as HTMLElement,
        },
    ];

    // ── Fetch danh sách role ──────────────────────────────────────────────────
    const fetchData = async (page: number, size: number) => {
        setLoading(true);
        try {
            const data = await getRolesApi(page, size);
            if (data?.items) {
                setRoles(data.items);
                setTotal(data.totalCount || 0);
            } else if (Array.isArray(data)) {
                setRoles(data);
                setTotal(data.length);
            }
        } catch (error: any) {
            message.error(error.message || t('error_load_data') || 'Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(currentPagination.current, currentPagination.pageSize);
    }, [currentPagination]);

    // ── Global search ─────────────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        return roles.filter((item) => {
            if (!searchText) return true;
            return Object.values(item).some(
                (val) => val?.toString().toLowerCase().includes(searchText.toLowerCase())
            );
        });
    }, [roles, searchText]);

    // ── Modal handlers ────────────────────────────────────────────────────────
    const handleOpenAdd = () => {
        setEditingRole(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (role: RoleData) => {
        setEditingRole(role);
        setModalOpen(true);
    };

    const handleModalClose = () => setModalOpen(false);

    const handleModalSuccess = () => {
        fetchData(currentPagination.current, currentPagination.pageSize);
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<RoleData> = [
        {
            title: t('actions'),
            key: 'action',
            width: 140,
            align: 'center',
            fixed: 'left',
            render: (_, record) => (
                <Space size="small">
                    <AppButton btnType="edit" icon={<EditOutlined />} data={record} onClick={() => handleOpenEdit(record)} />
                </Space>
            ),
        },
        {
            ...getColumnSearchProps('name', t('role_name')),
            dataIndex: 'name',
            key: 'name',
            width: 200,
            align: 'center',
            render: (text) => <span className="font-medium text-[#00b5ad]">{text}</span>,
        },
        {
            ...getColumnSearchProps('description', t('description')),
            dataIndex: 'description',
            key: 'description',
            align: 'left',
            render: (text) => text || <span className="text-gray-300 italic">—</span>,
        },
        {
            title: t('status'),
            dataIndex: 'isActive',
            key: 'isActive',
            width: 130,
            align: 'center',
            filters: [
                { text: t('status_active'), value: true },
                { text: t('status_inactive'), value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
            render: (isActive: boolean) => (
                <Badge
                    status={isActive ? 'success' : 'default'}
                    text={
                        <span className={isActive ? 'text-green-600 font-medium' : 'text-gray-400'}>
                            {isActive ? t('status_active') : t('status_inactive')}
                        </span>
                    }
                />
            ),
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AccessGuard feature="Feature.Administration.Roles" permission="AdministrationService.Roles.View">
            <div className="flex flex-col gap-4">
                <Breadcrumb items={[{ title: t('system_admin') }, { title: t('role_management') }]} />

                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800 m-0">{t('role_list_title')}</h1>
                </div>

                <Card className="shadow-sm border-none overflow-hidden" style={{ borderRadius: 6 }}>
                    <AppToolbar
                        searchId="role-search-input"
                        searchValue={searchText}
                        onSearchChange={setSearchText}
                        searchRef={searchRef}
                        buttons={[
                            {
                                key: 'add',
                                onClick: handleOpenAdd,
                                title: `${t('add')} ${t('role')}`,
                                ref: addBtnRef
                            },
                            {
                                key: 'export',
                                onClick: () => message.info('Exporting...'),
                                title: t('export'),
                                ref: exportBtnRef
                            },
                            {
                                key: 'help',
                                onClick: () => setTourOpen(true),
                                title: t('help') || 'Hướng dẫn',
                                ref: helpBtnRef
                            }
                        ]}
                    />

                    <div ref={gridRef}>
                        <AppGrid
                            loading={loading}
                            columns={columns}
                            dataSource={filteredData}
                            rowKey="id"
                            className="tour-grid"
                            pagination={{
                                current: currentPagination.current,
                                pageSize: currentPagination.pageSize,
                                total: total,
                                onChange: (page, pageSize) => {
                                    setCurrentPagination({ current: page, pageSize });
                                },
                            }}
                        />
                    </div>
                </Card>

                <FormModal
                    open={modalOpen}
                    editingRole={editingRole}
                    onSuccess={handleModalSuccess}
                    onClose={handleModalClose}
                />

                <AppTour
                    open={tourOpen}
                    onClose={() => setTourOpen(false)}
                    steps={tourSteps}
                />
            </div>
        </AccessGuard>
    );
}
