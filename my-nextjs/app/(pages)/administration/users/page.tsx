'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Input, Space, Breadcrumb, Tag, App, Card } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, FileExcelOutlined, EditOutlined } from '@ant-design/icons';
import { AppGrid } from '@/app/components/common/AppGrid';
import { useTranslation } from 'react-i18next';
import { getUsersApi, getUserByIdApi } from '@/services/userService';
import type { ColumnsType } from 'antd/es/table';
import { useAppGridSearch } from '@/app/components/common/AppGridSearch';
import { FormModal, UserDataType } from './FormModal';
import { AccessGuard } from '@/lib/AccessGuard';
import { AppTour } from '@/app/components/common/AppTour';
import { Button, Avatar as AntAvatar } from 'antd';
import dayjs from 'dayjs';
import { AppButton } from '@/app/components/common/AppButton';
import { AppToolbar } from '@/app/components/common/AppToolbar';

export default function UserListPage() {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const { getColumnSearchProps } = useAppGridSearch();

    const [users, setUsers] = useState<UserDataType[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [currentPagination, setCurrentPagination] = useState({ current: 1, pageSize: 10 });
    const [userLoading, setUserLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDataType | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

    // ── Fetch danh sách user ──────────────────────────────────────────────────
    const fetchData = async (page: number, size: number) => {
        setLoading(true);
        try {
            const data = await getUsersApi(page, size);
            if (data?.items) {
                setUsers(data.items);
                setTotal(data.totalCount || 0);
            } else if (Array.isArray(data)) {
                setUsers(data);
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
        return users.filter((item) => {
            if (!searchText) return true;
            return Object.values(item).some(
                (val) => val?.toString().toLowerCase().includes(searchText.toLowerCase())
            );
        });
    }, [users, searchText]);

    // ── Modal handlers ────────────────────────────────────────────────────────
    const handleOpenAdd = () => {
        setEditingUser(null);
        setModalOpen(true);
    };

    const handleOpenEdit = async (user: UserDataType) => {
        setUserLoading(true);
        try {
            const userData = await getUserByIdApi(user.id);
            setEditingUser(userData);
            setModalOpen(true);
        } catch (error: any) {
            message.error(error.message || 'Không thể lấy thông tin chi tiết người dùng');
        } finally {
            setUserLoading(false);
        }
    };

    const handleModalClose = () => setModalOpen(false);

    const handleModalSuccess = () => {
        fetchData(currentPagination.current, currentPagination.pageSize);
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns: ColumnsType<UserDataType> = [
        {
            title: <span className="text-white font-semibold">{t('actions')}</span>,
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
            title: t('user_name').toUpperCase(),
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text, record) => (
                <div className="flex items-center gap-4">
                    <div>
                        <div className="text-[14px] font-extrabold text-[#1e293b] leading-tight">{text || record.userName}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">ID: {record.userName}</div>
                    </div>
                </div>
            ),
        },
        {
            title: t('email').toUpperCase(),
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <span className="text-[13px] font-bold text-slate-500">{email}</span>
            )
        },
        {
            title: t('role').toUpperCase(),
            dataIndex: 'roles',
            key: 'roles',
            render: (roles: string[]) => (
                <div className="flex flex-wrap gap-1">
                    {roles?.map(role => (
                        <Tag key={role} className="m-0 border-none bg-teal-50 text-[#2bd4bd] font-black text-[9px] uppercase tracking-wider rounded-md px-2 py-0.5">
                            {role}
                        </Tag>
                    ))}
                    {(!roles || roles.length === 0) && <span className="text-slate-300 italic text-xs">—</span>}
                </div>
            )
        },
        {
            title: t('phone_number').toUpperCase(),
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            render: (text) => <span className="text-[13px] font-extrabold text-[#111827]">{text || <span className="text-slate-300 italic">—</span>}</span>,
        },
        {
            title: t('date_of_birth').toUpperCase(),
            dataIndex: 'dateOfBirth',
            key: 'dateOfBirth',
            render: (text) => (
                <span className="text-[13px] font-bold text-slate-400">
                    {text ? dayjs(text).format('DD/MM/YYYY') : <span className="text-slate-300 italic">—</span>}
                </span>
            ),
        },
        {
            title: t('status').toUpperCase(),
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag
                    className="border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest m-0"
                    style={{
                        backgroundColor: isActive ? '#f0fdf9' : '#f8fafc',
                        color: isActive ? '#2bd4bd' : '#94a3b8'
                    }}
                >
                    {isActive ? 'Active' : 'Offline'}
                </Tag>
            )
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AccessGuard feature="Feature.Administration.Users" permission="AdministrationService.Users.View">
            <div className="flex flex-col gap-4">
                <Breadcrumb items={[{ title: t('system_admin') }, { title: t('user_management') }]} />

                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-gray-800 m-0">{t('user_list_title')}</h1>
                </div>

                <Card className="shadow-sm border-none overflow-hidden" style={{ borderRadius: 6 }}>
                    <AppToolbar
                        searchId="user-search-input"
                        searchValue={searchText}
                        onSearchChange={setSearchText}
                        searchRef={searchRef}
                        buttons={[
                            {
                                key: 'add',
                                onClick: handleOpenAdd,
                                title: `${t('add')} ${t('user')}`,
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
                            rowSelection={{
                                type: 'checkbox',
                                selectedRowKeys,
                                onChange: (keys) => setSelectedRowKeys(keys),
                            }}
                            onRow={(record) => ({
                                onClick: () => handleOpenEdit(record),
                                style: { cursor: 'pointer' }
                            })}
                            loading={loading || userLoading}
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

                {/* Modal Add / Edit — dùng chung 1 component */}
                <FormModal
                    open={modalOpen}
                    editingUser={editingUser}
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
