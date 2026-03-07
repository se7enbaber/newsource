'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { App } from 'antd';
import { getTenantId } from './auth-utils';

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    isRead: boolean;
}

interface NotificationContextProps {
    connection: signalR.HubConnection | null;
    unreadCount: number;
    notifications: NotificationItem[];
    resetUnreadCount: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
    connection: null,
    unreadCount: 0,
    notifications: [],
    resetUnreadCount: () => { },
    clearNotifications: () => { }
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { notification } = App.useApp();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const resetUnreadCount = () => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const startConnection = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                if (connection) {
                    await connection.stop();
                    setConnection(null);
                }
                return;
            };

            const signalrUrl = process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5000/notificationHub';
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl(signalrUrl, {
                    accessTokenFactory: () => token,
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        };

        startConnection();

        // Optional: Listen for storage changes (login/logout in other tabs)
        const handleStorageChange = () => startConnection();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('🌐 SignalR Connected');

                    const tenantId = getTenantId()?.toLowerCase();
                    if (tenantId) {
                        console.log('📡 Joining SignalR Group:', tenantId);
                        connection.invoke('JoinTenantGroup', tenantId);
                    }

                    connection.on('ReceiveNotification', (data) => {
                        console.log('🔔 Received Notification:', data);

                        const validTypes = ['info', 'success', 'warning', 'error'];
                        const type = validTypes.includes(data.type) ? data.type : 'info';

                        const newNotification: NotificationItem = {
                            id: Math.random().toString(36).substr(2, 9),
                            title: data.title,
                            message: data.message,
                            type: type as any,
                            timestamp: new Date(),
                            isRead: false
                        };

                        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Giữ tối đa 50 tin
                        setUnreadCount(prev => prev + 1);

                        notification[type as 'info' | 'success' | 'warning' | 'error']({
                            title: data.title,
                            description: data.message,
                            placement: 'topRight'
                        });
                    });

                    connection.on('ReceiveJobStatus', (data) => {
                        console.log('⚙️ Received Job Status:', data);
                        if (data.status === 'Running' || data.status === 'Processing') {
                            notification.info({
                                title: `Job ${data.status}`,
                                description: `${data.message}`,
                                placement: 'topRight'
                            });
                        }
                    });
                })
                .catch(err => console.error('SignalR Connection Error: ', err));
        }

        return () => {
            connection?.off('ReceiveNotification');
            connection?.off('ReceiveJobStatus');
            connection?.stop();
        };
    }, [connection, notification]);

    return (
        <NotificationContext.Provider value={{
            connection,
            unreadCount,
            notifications,
            resetUnreadCount,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
