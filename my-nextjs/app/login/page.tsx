'use client';

import React, { useState } from 'react';
import { Form, Input, Card, App } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { AppButton } from '@/app/components/common/AppButton';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { loginApi } from '@/services/authService';
import { usePermission } from '@/lib/PermissionProvider';
import { useTheme } from '@/lib/ThemeProvider';

export default function LoginPage() {
    const { refreshAccess } = usePermission();
    const { primaryColor } = useTheme();
    const { t } = useTranslation();
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const data = await loginApi(values);
            localStorage.setItem('access_token', data.access_token);
            // Refresh trước khi navigate → PermissionProvider có data ngay khi trang mới mount
            refreshAccess();
            router.replace('/products');
        } catch (error: any) {
            message.error(error.message || 'Sai thông tin đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-vh-100 bg-gray-50">
            <Card title={<b className="text-lg" style={{ color: primaryColor }}>HỆ THỐNG QUẢN TRỊ</b>} style={{ width: 400, borderRadius: 6 }}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="tenant" label="Tenant" rules={[{ required: true }]}>
                        <Input prefix={<BankOutlined />} placeholder="Nhập Tenant (ví dụ: Admin)" />
                    </Form.Item>

                    <Form.Item name="username" label="Tài khoản" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} placeholder="Username" />
                    </Form.Item>

                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <AppButton
                        btnType="add"
                        htmlType="submit"
                        className="w-full mt-2"
                        loading={loading}
                    >
                        ĐĂNG NHẬP
                    </AppButton>
                </Form>
            </Card>
        </div>
    );
}