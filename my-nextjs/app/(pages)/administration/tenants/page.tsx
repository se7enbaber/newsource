'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Input, Space, Breadcrumb, Card, Tag, Tooltip, App, Badge } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    DatabaseOutlined,
    SyncOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import { AppButton } from '@/app/components/common/AppButton';
import { AppGrid } from '@/app/components/common/AppGrid';
import { AppToolbar } from '@/app/components/common/AppToolbar';
import { useTranslation } from 'react-i18next';
import { useAppGridSearch } from '@/app/components/common/AppGridSearch';
import { Can } from '@/lib/PermissionProvider';
import { AccessGuard } from '@/lib/AccessGuard';
import tenantService, { TenantDto } from '@/services/tenantService';
import { FormModal } from './FormModal';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { AppTour } from '@/app/components/common/AppTour';

export default function TenantsPage() {
    const { t } = useTranslation();
    const { message, modal } = App.useApp();
    const { getColumnSearchProps } = useAppGridSearch();

    // ─── State ──────────────────────────────────────────────────────────────────
    const [data, setData] = useState<TenantDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [currentPagination, setCurrentPagination] = useState({ current: 1, pageSize: 10 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<TenantDto | null>(null);
    const [migratingId, setMigratingId] = useState<string | null>(null);

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
        {
            title: t('tour_delete_title'),
            description: t('tour_delete_desc'),
            target: () => document.querySelector('.tour-delete') as HTMLElement,
        },
    ];

    // ─── Data Fetching ──────────────────────────────────────────────────────────
    const fetchData = useCallback(async (page: number, size: number) => {
        setLoading(true);
        try {
            const response = await tenantService.getPaged(page, size, "");
            if (response?.items) {
                setData(response.items);
                setTotal(response.totalCount || 0);
            } else if (Array.isArray(response)) {
                setData(response);
                setTotal(response.length);
            }
        } catch (error: any) {
            message.error(error.message || t('msg_fail', { action: t('view'), feature: t('tenant') }));
        } finally {
            setLoading(false);
        }
    }, [t, message]);

    useEffect(() => {
        fetchData(currentPagination.current, currentPagination.pageSize);
    }, [currentPagination, fetchData]);

    // ── Global search (Local filter like users/page) ──────────────────────────
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            if (!searchText) return true;
            return (
                item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                item.code.toLowerCase().includes(searchText.toLowerCase()) ||
                item.dbProvider?.toLowerCase().includes(searchText.toLowerCase())
            );
        });
    }, [data, searchText]);

    // ─── Event Handlers ─────────────────────────────────────────────────────────
    const handleAdd = () => {
        setEditingTenant(null);
        setIsModalOpen(true);
    };

    const handleEdit = (record: TenantDto) => {
        setEditingTenant(record);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchData(currentPagination.current, currentPagination.pageSize);
    };

    const handleDelete = (record: TenantDto) => {
        modal.confirm({
            title: `❌ ${t('delete')} ${t('tenant')}`,
            content: t('confirm_delete_tenant', { name: record.name }),
            okText: t('delete'),
            okType: 'danger',
            cancelText: t('cancel'),
            onOk: async () => {
                try {
                    await tenantService.delete(record.id);
                    message.success(t('msg_success', { action: t('delete'), feature: t('tenant') }));
                    fetchData(currentPagination.current, currentPagination.pageSize);
                } catch (error: any) {
                    message.error(error.message || t('msg_fail', { action: t('delete'), feature: t('tenant') }));
                }
            }
        });
    };

    const handleMigrate = (record: TenantDto) => {
        if (!record.connectionString) {
            message.warning(t('msg_host_tenant_no_migration'));
            return;
        }

        modal.confirm({
            title: `⚙️ ${t('confirm_migration_title')}`,
            content: t('confirm_migration_content'),
            okText: t('run_migration'),
            onOk: async () => {
                setMigratingId(record.id);
                try {
                    await tenantService.migrate(record.id);
                    message.success(t('msg_migration_success', { name: record.name }));
                } catch (error: any) {
                    message.error(error.message || t('msg_migration_fail', { name: record.name }));
                } finally {
                    setMigratingId(null);
                }
            }
        });
    };

    // ─── Table Columns ──────────────────────────────────────────────────────────
    const columns: ColumnsType<TenantDto> = [
        {
            title: t('actions'),
            key: 'action',
            width: 140,
            align: 'center',
            fixed: 'left',
            render: (_, record) => (
                <Space size="small">
                    <Can I="AdministrationService.Tenants.Update">
                        <AppButton
                            btnType="edit"
                            icon={<EditOutlined />}
                            data={record}
                            onClick={() => handleEdit(record)}
                        />
                    </Can>
                    <Can I="AdministrationService.Tenants.Delete">
                        {record.code?.toLowerCase() !== 'admin' && (
                            <AppButton
                                btnType="delete"
                                icon={<DeleteOutlined />}
                                data={record}
                                onClick={() => handleDelete(record)}
                            />
                        )}
                    </Can>

                    {(record.connectionString && record.code?.toLowerCase() !== 'admin') && (
                        <Tooltip title={t('run_migration')}>
                            <AppButton
                                btnType="view" // Sẽ dùng kiểu outline từ AppButton.tsx
                                icon={<DatabaseOutlined />}
                                disabled={migratingId !== null}
                                onClick={() => handleMigrate(record)}
                            />
                        </Tooltip>
                    )}

                </Space>
            )
        },
        {
            ...getColumnSearchProps('name', t('tenant_name')),
            dataIndex: 'name',
            key: 'name',
            width: 220,
            align: 'center',
            render: (text: string, record: TenantDto) => (
                <div className="flex flex-col items-center">
                    <span className="font-medium text-[#00b5ad]">{text}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{record.code}</span>
                </div>
            )
        },
        {
            title: t('db_provider'),
            dataIndex: 'dbProvider',
            key: 'dbProvider',
            width: 130,
            align: 'center',
            render: (val: string) => (
                <Tag color="processing" style={{ borderRadius: 20, margin: 0 }}>
                    {val?.toUpperCase() || 'POSTGRESQL'}
                </Tag>
            )
        },
        {
            title: t('features'),
            dataIndex: 'features',
            key: 'features',
            width: 280,
            align: 'center',
            render: (features: string[]) => (
                <Space size={4} wrap className="justify-center">
                    {features && features.length > 0 ? (
                        features.map(f => (
                            <Tag key={f} color="cyan" style={{ fontSize: '11px', borderRadius: 20, margin: 0 }}>
                                {f.split('.').pop()}
                            </Tag>
                        ))
                    ) : (
                        <span className="text-gray-300 italic">—</span>
                    )}
                </Space>
            )
        },
        {
            title: t('db_config'),
            key: 'dbConfig',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Badge
                    status={record.connectionString ? "warning" : "success"}
                    text={
                        <span className={record.connectionString ? "text-orange-500 font-medium" : "text-green-600 font-medium"}>
                            {record.connectionString ? t('db_isolated') : t('db_shared')}
                        </span>
                    }
                />
            )
        },
        {
            title: t('last_migrated_at', 'Ngày chạy Update DB'),
            dataIndex: 'lastMigratedAt',
            key: 'lastMigratedAt',
            width: 170,
            align: 'center',
            render: (date: string) => <span className={date ? "text-[#00b5ad] font-medium" : "text-gray-400 italic"}>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—'}</span>
        },
        {
            title: t('created_at'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            align: 'center',
            render: (date: string) => <span className="text-gray-500">{dayjs(date).format('DD/MM/YYYY')}</span>
        }
    ];

    return (
        <AccessGuard permission="AdministrationService.Tenants.View" hostOnly={true}>
            <div className="flex flex-col gap-4">
                <Breadcrumb items={[{ title: t('system_admin') }, { title: t('tenant_management') }]} />

                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800 m-0">{t('tenant_list_title')}</h1>
                </div>

                <Card className="shadow-sm border-none overflow-hidden" style={{ borderRadius: 6 }}>
                    <AppToolbar
                        searchId="tenant-search-input"
                        searchValue={searchText}
                        onSearchChange={setSearchText}
                        searchRef={searchRef}
                        buttons={[
                            {
                                key: 'add',
                                onClick: handleAdd,
                                title: `${t('add')} ${t('tenant')}`,
                                permission: "AdministrationService.Tenants.Create",
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
                    open={isModalOpen}
                    editingTenant={editingTenant}
                    onSuccess={handleModalSuccess}
                    onClose={() => setIsModalOpen(false)}
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
