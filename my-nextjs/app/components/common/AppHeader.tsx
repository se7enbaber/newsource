'use client';

import React from 'react';
import { Badge, Popover, Button, Empty } from 'antd';
import { BellOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/lib/ThemeProvider';
import { useNotification } from '@/lib/NotificationProvider';
import { usePermission } from '@/lib/PermissionProvider';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function AppHeader() {
    const { t } = useTranslation();
    const { primaryColor } = useTheme();
    const { unreadCount, resetUnreadCount, notifications, clearNotifications } = useNotification();
    const { tenantName, tenantCode } = usePermission();

    const notificationContent = (
        <div className="w-[320px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-800">{t('notifications')}</span>
                {notifications.length > 0 && (
                    <Button type="link" size="small" onClick={clearNotifications} className="text-gray-400 hover:text-red-500 flex items-center gap-1">
                        <DeleteOutlined /> {t('clear_all')}
                    </Button>
                )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {notifications.length === 0 ? (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description={<span className="text-gray-400 text-xs">{t('no_notifications')}</span>} 
                        className="py-10"
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {notifications.map((n) => (
                            <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100">
                                <div className="mt-0.5">
                                    {n.type === 'info' && <InfoCircleOutlined className="text-blue-500" />}
                                    {n.type === 'success' && <CheckCircleOutlined className="text-green-500" />}
                                    {n.type === 'warning' && <WarningOutlined className="text-orange-500" />}
                                    {n.type === 'error' && <CloseCircleOutlined className="text-red-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-gray-800 leading-snug">{n.title}</div>
                                    <div className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                                    <div className="text-[10px] text-gray-400 mt-1.5 flex items-center justify-between">
                                        {dayjs(n.timestamp).fromNow()}
                                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Button type="text" size="small" className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
                    {t('view_all_notifications')}
                </Button>
            </div>
        </div>
    );

    return (
        <header className="px-6 py-6 flex items-center justify-between bg-transparent flex-none">
            {/* Left: Tenant Info */}
            <div className="flex items-center gap-4">
                <Popover 
                    content={notificationContent} 
                    title={null} 
                    trigger="click" 
                    placement="bottomLeft" 
                    arrow={false}
                    onOpenChange={(visible) => visible && resetUnreadCount()}
                    overlayClassName="notification-popover"
                >
                    <div className="p-2.5 rounded-xl bg-[#f0fdf9] text-[#2bd4bd] border border-[#ccfbf1] shadow-sm cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95">
                        <Badge count={unreadCount} size="small" offset={[2, 2]}>
                            <BellOutlined className="text-xl" style={{ color: primaryColor }} />
                        </Badge>
                    </div>
                </Popover>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{tenantCode || 'HOST'}</div>
                    <div className="text-[15px] font-black text-[#1e293b]">{tenantName || 'Standard Tenant'}</div>
                </div>
            </div>

            {/* Right side is now empty as requested */}
            <div />
        </header>
    );
}
