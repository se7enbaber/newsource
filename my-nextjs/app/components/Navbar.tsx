'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, ConfigProvider, MenuProps } from 'antd';
import {
    HomeOutlined,
    SettingOutlined,
    UserOutlined,
    TeamOutlined,
    DatabaseOutlined,
    HistoryOutlined,
    PictureOutlined,
    GlobalOutlined,
    ProjectOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/lib/PermissionProvider';
import { useTheme } from '@/lib/ThemeProvider';
import { getUserId } from '@/lib/auth-utils';
import { getUserByIdApi } from '@/services/userService';
import { FormModal, UserDataType } from '@/app/(pages)/administration/users/FormModal';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const Navbar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { hasPermission, userName, isHostTenant } = usePermission();
    const { primaryColor } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserDataType | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Tự động mở menu cha nếu pathname đang ở menu con
        const keys = getAllKeys(items);
        const activeParent = keys.find(key => pathname.startsWith(key));
        if (activeParent) setOpenKeys([activeParent]);
    }, [pathname]);

    const items: MenuItem[] = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: t('dashboard', 'Trang chủ'),
        },
        {
            key: '/administration',
            icon: <SettingOutlined />,
            label: t('system_management', 'Quản trị hệ thống'),
            children: [
                {
                    key: '/administration/users',
                    icon: <UserOutlined />,
                    label: t('user_management', 'Quản lý người dùng'),
                    permission: 'AdministrationService.Users.View'
                },
                {
                    key: '/administration/roles',
                    icon: <TeamOutlined />,
                    label: t('role_management', 'Quản lý vai trò'),
                    permission: 'AdministrationService.Roles.View'
                },
                {
                    key: '/administration/tenants',
                    icon: <GlobalOutlined />,
                    label: t('tenant_management', 'Quản lý khách hàng'),
                    permission: 'AdministrationService.Tenants.View',
                    hostOnly: true
                },
                {
                    key: '/administration/audit-logs',
                    icon: <HistoryOutlined />,
                    label: t('audit_logs', 'Lịch sử Jobs'),
                },
            ],
        },
        {
            key: '/master-data',
            icon: <DatabaseOutlined />,
            label: t('master_data', 'Quản lý dữ liệu chủ'),
            children: [
                {
                    key: '/master-data/products',
                    icon: <ProjectOutlined />,
                    label: t('product_management', 'Quản lý sản phẩm'),
                },
            ],
        },
    ]
    .map(item => {
        if (item.children) {
            const filteredChildren = item.children.filter((child: any) => {
                // Check Host-only restriction
                if (child.hostOnly && !isHostTenant) return false;
                
                // Check Permission
                if (child.permission) return hasPermission(child.permission);
                
                // Default fallback if no permission/hostOnly specified
                return !child.key || hasPermission(child.key);
            });
            return { ...item, children: filteredChildren };
        }
        return item;
    })
    .filter(item => {
        if (item.children) {
            return item.children.length > 0;
        }
        return !item.key || hasPermission(item.key as string);
    }) as MenuItem[];

    const onOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    const onClick = (e: any) => {
        router.push(e.key);
    };

    const handleProfileClick = async () => {
        const userId = getUserId();
        if (!userId) return;

        setProfileLoading(true);
        try {
            const userData = await getUserByIdApi(userId);
            setUserToEdit(userData);
            setProfileModalOpen(true);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setProfileLoading(false);
        }
    };

    if (!mounted) {
        return <Sider width={260} theme="light" className="min-h-screen border-r-0 shadow-sm" style={{ background: '#ffffff' }} />;
    }

    return (
        <Sider
            width={260}
            theme="light"
            className="min-h-screen border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
            style={{
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* LOGO AREA */}
            <div style={{ flex: 'none', padding: '32px 28px 24px' }}>
                <div className="flex items-center gap-3 mb-8 px-1 cursor-pointer" onClick={() => router.push('/')}>
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-[#2bd4bd33]"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <PictureOutlined />
                    </div>
                    <div>
                        <div className="font-extrabold text-[#1e293b] text-base leading-tight">Mint ERP</div>
                        <div className="text-[10px] uppercase font-black tracking-widest leading-none mt-1" style={{ color: primaryColor }}>Vibe Check</div>
                    </div>
                </div>
            </div>

            {/* MAIN MENU */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ConfigProvider
                    theme={{
                        components: {
                            Menu: {
                                itemBg: 'transparent',
                                itemColor: '#64748b',
                                itemSelectedColor: '#1e293b',
                                itemSelectedBg: primaryColor,
                                itemHoverColor: '#1e293b',
                                itemHoverBg: '#f8fafc',
                                itemBorderRadius: 16,
                                itemMarginInline: 16,
                                itemMarginBlock: 8,
                            },
                        },
                    }}
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[pathname]}
                        openKeys={openKeys}
                        onOpenChange={onOpenChange}
                        onClick={onClick}
                        items={items}
                        style={{
                            borderRight: 0,
                            backgroundColor: 'transparent',
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    />
                </ConfigProvider>
            </div>

            {/* BOTTOM SECTION */}
            <div className="px-4 py-6 mt-auto flex flex-col gap-4">
                <div
                    onClick={handleProfileClick}
                    className="mx-2 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-3"
                >
                    <Avatar
                        style={{
                            backgroundColor: primaryColor,
                            color: '#1e293b',
                            fontWeight: 'bold',
                            boxShadow: `0 4px 12px ${primaryColor}44`
                        }}
                        size={40}
                    >
                        {userName ? userName.charAt(0).toUpperCase() : 'A'}
                    </Avatar>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '13px', lineHeight: 1.2 }}>
                            {userName || 'Alex Mitchell'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: 2 }}>
                            {profileLoading ? 'Loading...' : 'Project Manager'}
                        </div>
                    </div>
                </div>
            </div>

            <FormModal
                open={profileModalOpen}
                editingUser={userToEdit}
                onSuccess={() => setProfileModalOpen(false)}
                onClose={() => setProfileModalOpen(false)}
            />
        </Sider>
    );
}

const getAllKeys = (items: any[]): string[] => {
    let keys: string[] = [];
    items.forEach(item => {
        if (item.children) {
            keys.push(item.key);
            keys = [...keys, ...getAllKeys(item.children)];
        }
    });
    return keys;
};

export default Navbar;