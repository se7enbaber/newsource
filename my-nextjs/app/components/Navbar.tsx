'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, ConfigProvider, MenuProps, theme, Dropdown, App, Space, Tooltip } from 'antd';
import {
    HomeOutlined,
    SettingOutlined,
    UserOutlined,
    TeamOutlined,
    DatabaseOutlined,
    HistoryOutlined,
    PictureOutlined,
    GlobalOutlined,
    ProjectOutlined,
    LogoutOutlined,
    KeyOutlined,
    IdcardOutlined,
    DownOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/lib/PermissionProvider';
import { useTheme } from '@/lib/ThemeProvider';
import { getUserId } from '@/lib/auth-utils';
import { darkenColor } from '@/lib/colorUtils';
import { getUserByIdApi } from '@/services/userService';
import { FormModal, UserDataType } from '@/app/(pages)/administration/users/FormModal';
import { logoutApi } from '@/services/authService';

const { Sider } = Layout;

/**
 * Component hỗ trợ hiển thị label menu với Tooltip khi bị truncate
 */
const MenuItemLabel: React.FC<{ label: React.ReactNode }> = ({ label }) => {
    return (
        <span className="inline-block align-middle whitespace-normal leading-snug py-1.5 w-full">
            {label}
        </span>
    );
};

type MenuItem = Required<MenuProps>['items'][number];

const Navbar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();
    const { hasPermission, userName, isHostTenant, tenantName, tenantCode, tenantLogo } = usePermission();
    const { primaryColor } = useTheme();
    const { token } = theme.useToken();
    const { modal, message } = App.useApp();

    const [mounted, setMounted] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserDataType | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // DARK COLORED SIDEBAR DESIGN SYSTEM
    // Tính toán màu nền Sidebar tối đi 45% để đạt contrast chuẩn với text trắng (~4.5:1)
    const sidebarBg = darkenColor(primaryColor, 45);

    // Memoize menu items to prevent infinite re-renders
    const items = React.useMemo(() => {
        const rawItems = [
            {
                key: '/',
                icon: <HomeOutlined style={{ fontSize: 18 }} />,
                label: t('menu_dashboard', 'Trang chủ'),
            },
            {
                key: 'divider-1',
                type: 'divider',
                style: { margin: '12px 12px', borderBlockStart: '1px solid rgba(255,255,255,0.1)' }
            },
            {
                key: '/administration',
                icon: <SettingOutlined style={{ fontSize: 18 }} />,
                label: t('menu_administrator', 'Quản trị hệ thống'),
                children: [
                    {
                        key: '/administration/users',
                        icon: <UserOutlined style={{ fontSize: 16 }} />,
                        label: t('menu_users', 'Quản lý người dùng'),
                        permission: 'AdministrationService.Users.View'
                    },
                    {
                        key: '/administration/roles',
                        icon: <TeamOutlined style={{ fontSize: 16 }} />,
                        label: t('menu_roles', 'Quản lý vai trò'),
                        permission: 'AdministrationService.Roles.View'
                    },
                    {
                        key: '/administration/tenants',
                        icon: <GlobalOutlined style={{ fontSize: 16 }} />,
                        label: t('menu_tenants', 'Quản lý khách hàng'),
                        permission: 'AdministrationService.Tenants.View',
                        hostOnly: true
                    },
                    {
                        key: '/administration/audit-logs',
                        icon: <HistoryOutlined style={{ fontSize: 16 }} />,
                        label: t('menu_job_logs', 'Lịch sử Jobs'),
                    },
                ],
            },
            {
                key: 'divider-2',
                type: 'divider',
                style: { margin: '12px 12px', borderBlockStart: '1px solid rgba(255,255,255,0.1)' }
            },
            {
                key: '/master-data',
                icon: <DatabaseOutlined style={{ fontSize: 18 }} />,
                label: t('menu_mdm', 'Quản lý dữ liệu chủ'),
                children: [
                    {
                        key: '/master-data/products',
                        icon: <ProjectOutlined style={{ fontSize: 16 }} />,
                        label: t('menu_products', 'Sản phẩm'),
                    },
                ],
            },
        ];

        const mapItem = (item: any): any => {
            if (item.type === 'divider') return item;
            
            const label = <MenuItemLabel label={item.label} />;
            const children = item.children ? item.children.map(mapItem) : undefined;
            
            return { ...item, label, children };
        };

        return rawItems
            .map(item => {
                if (item?.type === 'divider') return item;
                
                // Lọc con
                let filteredChildren = (item as any).children;
                if (filteredChildren) {
                    filteredChildren = filteredChildren.filter((child: any) => {
                        if (child.hostOnly && !isHostTenant) return false;
                        if (child.permission) return hasPermission(child.permission);
                        return true;
                    }).map((child: any) => {
                        const { permission, hostOnly, ...rest } = child;
                        return mapItem(rest); // Áp dụng tooltip
                    });
                }

                const { permission, hostOnly, ...rest } = item as any;
                const finalItem = filteredChildren ? { ...rest, children: filteredChildren } : rest;
                return mapItem(finalItem); // Áp dụng tooltip cho cả cha
            })
            .filter(item => {
                if (item?.type === 'divider') return true;
                if ((item as any).children) {
                    return (item as any).children.length > 0;
                }
                const key = (item as any).key;
                return !key || hasPermission(key as string);
            }) as MenuItem[];
    }, [t, hasPermission, isHostTenant]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            const keys = getAllKeys(items);
            const activeParent = keys.find(key => pathname.startsWith(key));
            if (activeParent && !openKeys.includes(activeParent)) {
                setOpenKeys([activeParent]);
            }
        }
    }, [pathname, items, mounted]);

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

    const handleLogout = () => {
        modal.confirm({
            title: t('logout_confirm_title', 'Xác nhận đăng xuất'),
            content: t('logout_confirm_desc', 'Bạn có chắc chắn muốn rời khỏi hệ thống không?'),
            okText: t('logout', 'Đăng xuất'),
            okType: 'danger',
            cancelText: t('cancel', 'Hủy'),
            onOk: () => {
                logoutApi();
            }
        });
    };

    const profileMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: t('profile_info', 'Thông tin tài khoản'),
            icon: <IdcardOutlined />,
            onClick: handleProfileClick
        },
        {
            key: 'password',
            label: t('change_password', 'Đổi mật khẩu'),
            icon: <KeyOutlined />,
            onClick: () => message.info('Tính năng đang phát triển...')
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: t('logout', 'Đăng xuất'),
            icon: <LogoutOutlined />,
            danger: true,
            onClick: handleLogout
        },
    ];

    if (!mounted) {
        return <Sider width={260} theme="light" className="min-h-screen border-r shadow-sm" style={{ background: '#ffffff' }} />;
    }

    return (
        <Sider
            width={260}
            theme="light"
            className="h-screen flex flex-col shadow-2xl border-none relative z-[100]"
            style={{
                backgroundColor: sidebarBg,
                transition: 'all 0.3s ease'
            }}
        >
            {/* LOGO & BRAND */}
            <div className="shrink-0 p-5">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white text-xl backdrop-blur-md transition-transform group-hover:scale-105 shadow-inner overflow-hidden shrink-0"
                    >
                        {tenantLogo ? (
                            <img src={tenantLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <PictureOutlined />
                        )}
                    </div>
                    <div className="flex flex-col justify-center gap-1 overflow-hidden" style={{ minWidth: 0 }}>
                        <span className="font-extrabold text-white text-[16px] leading-tight tracking-tight truncate w-full" title={tenantName || 'Mint ERP'}>
                            {tenantName || 'Mint ERP'}
                        </span>
                        <div className="flex">
                            <span 
                                className="flex-none rounded-[4px] tracking-widest leading-none shadow-sm truncate uppercase border border-white/20 bg-white/10 transition-colors text-white/90 text-[9px] font-bold px-1.5 py-[3px]" 
                                title={tenantCode ? `${t('tenant', 'Khách hàng')}: ${tenantCode}` : 'PREMIUM'}
                            >
                                {tenantCode || 'PREMIUM'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN MENU SCROLLABLE */}
            <div className="flex-1 overflow-y-auto custom-sidebar-scrollbar py-2 px-2">
                <ConfigProvider
                    theme={{
                        components: {
                            Menu: {
                                itemBg: 'transparent',
                                itemColor: 'rgba(255,255,255,0.7)',
                                itemSelectedColor: '#ffffff',
                                itemSelectedBg: 'rgba(255,255,255,0.22)',
                                itemHoverColor: '#ffffff',
                                itemHoverBg: 'rgba(255,255,255,0.1)',
                                itemBorderRadius: 8,
                                itemMarginInline: 8,
                                itemMarginBlock: 4,
                                subMenuItemBg: 'transparent',
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
                        }}
                    />
                </ConfigProvider>
            </div>

            {/* BOTTOM SECTION - USER PROFILE */}
            <div className="shrink-0 border-t border-white/10 p-3 bg-black/15">
                <Dropdown 
                    menu={{ items: profileMenuItems }} 
                    placement="topRight" 
                    trigger={['click']}
                    onOpenChange={(open) => setDropdownOpen(open)}
                >
                    <div className="p-2.5 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group backdrop-blur-sm border border-transparent">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.20)',
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}
                                size={40}
                            >
                                {userName ? userName.charAt(0).toUpperCase() : 'A'}
                            </Avatar>
                            <div className="overflow-hidden">
                                <div className="text-white font-semibold text-[14px] leading-tight truncate">
                                    {userName || 'User'}
                                </div>
                                <div className="text-white/60 text-[10px] mt-0.5 truncate uppercase tracking-wider font-medium">
                                    {profileLoading ? 'Đang tải...' : (isHostTenant ? 'Quản trị hệ thống' : 'Người dùng')}
                                </div>
                            </div>
                        </div>
                        <DownOutlined 
                            className={`text-white/40 text-[10px] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                        />
                    </div>
                </Dropdown>
            </div>

            <FormModal
                open={profileModalOpen}
                editingUser={userToEdit}
                onSuccess={() => setProfileModalOpen(false)}
                onClose={() => setProfileModalOpen(false)}
            />

            <style jsx global>{`
                /* Menu Group Parent Style */
                .ant-menu-root > .ant-menu-submenu > .ant-menu-submenu-title,
                .ant-menu-root > .ant-menu-item {
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    color: rgba(255,255,255,0.95) !important;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Submenu Item (Child) Style */
                .ant-menu-sub .ant-menu-item {
                    font-size: 14px !important;
                    font-weight: 400 !important;
                    color: rgba(255,255,255,0.75) !important;
                    text-transform: none;
                    letter-spacing: normal;
                }

                /* Layout Foundation for wrapping and alignment */
                .ant-menu-item, .ant-menu-submenu-title {
                    height: auto !important;
                    line-height: normal !important;
                    min-height: 44px !important;
                    display: flex !important;
                    align-items: center !important;
                    padding-top: 6px !important;
                    padding-bottom: 6px !important;
                    transition: all 150ms ease !important;
                }

                .ant-menu-title-content {
                    display: flex !important;
                    align-items: center !important;
                    flex: 1 !important;
                    min-width: 0 !important;
                    white-space: normal !important;
                    overflow: visible !important;
                }

                /* Icon Alignment */
                .ant-menu-item .ant-menu-item-icon, 
                .ant-menu-submenu-title .ant-menu-item-icon {
                    color: rgba(255,255,255,0.6) !important;
                    flex-shrink: 0 !important;
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 18px !important;
                    transition: all 150ms ease;
                }

                /* Active State: Menu Item */
                .ant-menu-item-selected {
                    background-color: rgba(255,255,255,0.15) !important;
                    color: #ffffff !important;
                    font-weight: 600 !important;
                    border-left: 3px solid #ffffff !important;
                }
                
                .ant-menu-item-selected::after {
                    display: none !important;
                }

                /* Submenu Title Highlighting */
                .ant-menu-submenu-selected > .ant-menu-submenu-title,
                .ant-menu-submenu-open > .ant-menu-submenu-title {
                    color: #ffffff !important;
                }

                .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-item-icon,
                .ant-menu-submenu-open > .ant-menu-submenu-title .ant-menu-item-icon {
                    color: #ffffff !important;
                }
                
                .ant-menu-item:hover, .ant-menu-submenu-title:hover {
                    background-color: rgba(255,255,255,0.08) !important;
                }

                .ant-menu-item:hover .ant-menu-item-icon,
                .ant-menu-submenu-title:hover .ant-menu-item-icon,
                .ant-menu-item-selected .ant-menu-item-icon {
                    color: #ffffff !important;
                }

                /* Chevron icon style */
                .ant-menu-submenu-arrow {
                    color: rgba(255,255,255,0.4) !important;
                    transform: scale(0.85);
                    position: static !important;
                    margin-left: 8px !important;
                }

                /* Scrollbar Customization */
                .custom-sidebar-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-sidebar-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.15);
                    border-radius: 10px;
                }
                .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.25);
                }

                /* Layout helper */
                .ant-menu-inline .ant-menu-sub.ant-menu-inline {
                    background: transparent !important;
                }
            `}</style>
        </Sider>
    );
}

const getAllKeys = (items: any[]): string[] => {
    let keys: string[] = [];
    items.forEach(item => {
        if (item && item.children) {
            keys.push(item.key);
            keys = [...keys, ...getAllKeys(item.children)];
        }
    });
    return keys;
};

export default Navbar;