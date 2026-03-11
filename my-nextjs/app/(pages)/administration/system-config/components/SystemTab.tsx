'use client';

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Card, Form, InputNumber, App, ConfigProvider } from 'antd';
import { SecurityScanOutlined } from '@ant-design/icons';
import { api } from '@/services/apiService';
import { useTranslation } from 'react-i18next';

export interface RateLimitConfig {
    globalLimit: number;
    authLimit: number;
}

export interface SystemTabHandle {
    submit: () => void;
}

interface SystemTabProps {
    onSavingChange?: (saving: boolean) => void;
}

const SystemTab = forwardRef<SystemTabHandle, SystemTabProps>((props, ref) => {
    const [form] = Form.useForm<RateLimitConfig>();
    const { message } = App.useApp();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        submit: () => form.submit()
    }));

    useEffect(() => {
        if (props.onSavingChange) {
            props.onSavingChange(saving);
        }
    }, [saving, props.onSavingChange]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const data = await api.get('/api/SystemConfig/rate-limit');
            form.setFieldsValue(data);
        } catch (error) {
            message.error(t('error_load_rate_limit', 'Không thể tải cấu hình cấu hình Rate Limit'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const onFinish = async (values: RateLimitConfig) => {
        setSaving(true);
        try {
            await api.post('/api/SystemConfig/rate-limit', values);
            message.success(t('msg_rate_limit_updated', 'Đã cập nhật cấu hình Rate limit! Hệ thống Gateway sẽ tự động nhận diện tham số mới.'));
        } catch (error) {
            message.error(t('error_save_config', 'Có lỗi xảy ra khi lưu cấu hình'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Card: {
                        headerBg: 'rgba(0, 0, 0, 0.02)',
                    }
                }
            }}
        >
            <Card 
                loading={loading}
                title={
                    <div className="flex items-center gap-2">
                        <SecurityScanOutlined className="text-primary font-bold" />
                        <span className="font-semibold text-slate-800">{t('api_protection_title', 'Bảo vệ hệ thống (Chống Spam / DDoS)')}</span>
                    </div>
                }
                className="shadow-sm border-slate-200/60 rounded-xl"
            >
                <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                    {t('api_protection_hint')}
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="max-w-xl px-2"
                >
                    <Form.Item
                        name="globalLimit"
                        label={<span className="font-semibold text-gray-700 uppercase text-[11px] tracking-wider">{t('global_limit_label', 'Giới hạn Global API (Requests / 10 giây)')}</span>}
                        tooltip={t('global_limit_tooltip', 'Giới hạn số lượng request tối đa trong mỗi 10 giây của toàn bộ hệ thống API')}
                        rules={[{ required: true, message: t('validate_required', 'Vui lòng nhập định mức.') }]}
                    >
                        <InputNumber 
                            className="w-full"
                            size="large"
                            min={10}
                            max={5000}
                            placeholder="Ví dụ: 100"
                        />
                    </Form.Item>

                    <div className="text-xs text-gray-500 mt-[-16px] mb-6 italic opacity-80">
                        {t('global_limit_hint', 'Khuyến nghị Global Limit nằm trong khoảng 100 - 300 tuỳ mức độ scale người dùng.')}
                    </div>

                    <Form.Item
                        name="authLimit"
                        label={<span className="font-semibold text-gray-700 uppercase text-[11px] tracking-wider">{t('auth_limit_label', 'Giới hạn kênh xác thực /connect (Requests / 30 giây)')}</span>}
                        tooltip={t('auth_limit_tooltip', 'Quy định siết chặt Anti Brute-force Login. Chỉ cho phép các request đăng nhập vài lần liên tiếp mỗi 30s.')}
                        rules={[{ required: true, message: t('validate_required', 'Vui lòng nhập định mức.') }]}
                    >
                        <InputNumber 
                            className="w-full"
                            size="large"
                            min={1}
                            max={100}
                            placeholder="Ví dụ: 5"
                        />
                    </Form.Item>

                    <div className="text-xs text-gray-500 mt-[-16px] mb-2 italic opacity-80">
                        {t('auth_limit_hint', 'Thực tế người dùng quên mật khẩu / spam đăng nhập không nên vượt quá 5 lần/30 giây.')}
                    </div>
                </Form>
            </Card>
        </ConfigProvider>
    );
});

SystemTab.displayName = 'SystemTab';

export default SystemTab;
