'use client';

import React, { useRef, useState } from 'react';
import { Tabs } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { AppToolbar } from '@/app/components/common/AppToolbar';
import { AppButton } from '@/app/components/common/AppButton';
import { useTranslation } from 'react-i18next';
import SystemTab, { SystemTabHandle } from './components/SystemTab';

export default function SystemConfigPage() {
    const { t } = useTranslation();
    const [activeKey, setActiveKey] = useState('system');
    const [saving, setSaving] = useState(false);
    const systemTabRef = useRef<SystemTabHandle>(null);

    const handleSave = () => {
        if (activeKey === 'system') {
            systemTabRef.current?.submit();
        }
    };

    const items = [
        {
            key: 'system',
            label: (
                <span className="flex items-center gap-2">
                    <SettingOutlined />
                    <span>{t('tab_system', 'Hệ thống')}</span>
                </span>
            ),
            children: <SystemTab ref={systemTabRef} onSavingChange={setSaving} />,
        },
        // Thêm các tab khác ở đây trong tương lai (ví dụ: Audit Logs, Email Settings,...)
    ];

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6 w-full max-w-5xl mx-auto h-full overflow-y-auto">
            <AppToolbar 
                showSearch={false}
                leftActions={
                    <h1 className="text-xl font-semibold text-gray-800 m-0">{t('system_configuration', 'Cấu hình Hệ thống (System Configuration)')}</h1>
                }
                extraActions={
                    <AppButton
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                        className="shadow-sm font-bold bg-[#2bd4bd] border-none hover:bg-[#25c0ab]"
                    >
                        {t('save', 'Lưu cấu hình')}
                    </AppButton>
                }
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
                <Tabs 
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    items={items}
                    className="app-tabs-large"
                    animated={{ inkBar: true, tabPane: true }}
                />
            </div>
        </div>
    );
}
