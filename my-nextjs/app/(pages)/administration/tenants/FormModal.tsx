'use client';

import { useState, useEffect, useMemo } from 'react';
import { Form, Input, Select, Tag, Spin, App, Button, Tree, Card, Modal } from 'antd';
import { useTranslation, Trans } from 'react-i18next';
import tenantService, { TenantDto } from '@/services/tenantService';
import { AppPopup } from '@/app/components/common/AppPopup';
import { AppButton } from '@/app/components/common/AppButton';
import { SettingOutlined, FolderOpenOutlined, SafetyCertificateOutlined, PictureOutlined } from '@ant-design/icons';
import { AppImageUpload } from '@/app/components/common/AppImageUpload';
import { api } from '@/services/apiService';

const { CheckableTag } = Tag;

interface FormModalProps {
    open: boolean;
    editingTenant: TenantDto | null;
    onSuccess: () => void;
    onClose: () => void;
}

/**
 * Null-rendering field — absorbs value/onChange injected by Ant Design Form
 */
function FeaturesHiddenField(_: { value?: string[]; onChange?: (v: string[]) => void }) {
    return null;
}

// Helper to build tree from flat list of feature codes (Feature.A.B)
const buildFeatureTree = (flatList: string[], t: (s: string) => string) => {
    const root: any[] = [];

    // Sort so parents come before children
    const sorted = [...flatList].sort((a, b) => a.split('.').length - b.split('.').length);

    sorted.forEach(item => {
        const parts = item.split('.');
        let currentLevel = root;
        let currentPath = '';

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}.${part}` : part;

            let node = currentLevel.find(n => n.key === currentPath);
            if (!node) {
                // If this is the last part, it's the item itself
                const isLeaf = index === parts.length - 1;
                node = {
                    title: <span className={index === 0 ? "font-bold text-primary" : ""}>{part}</span>,
                    key: currentPath,
                    children: [],
                    icon: index === 0 ? <SettingOutlined /> : (isLeaf ? <SafetyCertificateOutlined className="text-blue-400" /> : <FolderOpenOutlined className="text-orange-400" />)
                };
                currentLevel.push(node);
            }
            currentLevel = node.children;
        });
    });

    return root;
};

export function FormModal({ open, editingTenant, onSuccess, onClose }: FormModalProps) {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const isEditMode = editingTenant !== null;

    const [allFeatures, setAllFeatures] = useState<string[]>([]);
    const [featuresLoading, setFeaturesLoading] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

    const tourSteps = [
        {
            title: t('tour_tenant_field_name_title'),
            description: t('tour_tenant_field_name_desc'),
            target: () => document.getElementById('tenant-form-name') as HTMLElement,
        },
        {
            title: t('tour_tenant_field_code_title'),
            description: t('tour_tenant_field_code_desc'),
            target: () => document.getElementById('tenant-form-code') as HTMLElement,
        },
        {
            title: t('tour_tenant_field_conn_title'),
            description: t('tour_tenant_field_conn_desc'),
            target: () => document.getElementById('tenant-form-conn') as HTMLElement,
        },
        {
            title: t('tour_tenant_field_db_title'),
            description: t('tour_tenant_field_db_desc'),
            target: () => document.getElementById('tenant-form-db') as HTMLElement,
        },
        {
            title: t('tour_tenant_btn_check_conn_title'),
            description: t('tour_tenant_btn_check_conn_desc'),
            target: () => document.getElementById('tenant-form-check-conn-btn') as HTMLElement,
        },
        {
            title: t('tour_tenant_field_features_title'),
            description: t('tour_tenant_field_features_desc'),
            target: () => document.getElementById('tenant-form-features-btn') as HTMLElement,
        },
        {
            title: t('tour_popup_cancel_title'),
            description: t('tour_popup_cancel_desc'),
            target: () => document.getElementById('app-popup-cancel-btn') as HTMLElement,
        },
        {
            title: t('tour_popup_save_title'),
            description: t('tour_popup_save_desc'),
            target: () => document.getElementById('app-popup-save-btn') as HTMLElement,
        },
    ];

    const [checkLoading, setCheckLoading] = useState(false);

    // Watch tenant code to detect admin
    const tenantCode = Form.useWatch('code', form);
    const isAdmin = tenantCode?.toLowerCase() === 'admin';

    // Build tree data from flat list
    const featureTreeData = useMemo(() => buildFeatureTree(allFeatures, t), [allFeatures, t]);

    useEffect(() => {
        if (!open) return;
        setIsDirty(false);
        setIsFeatureModalOpen(false);

        const fetchFeatures = async () => {
            setFeaturesLoading(true);
            try {
                const data = await tenantService.getAllFeatures();
                setAllFeatures(data || []);
            } catch (error: any) {
                message.error(t('msg_fail', { action: t('view'), feature: t('features') }));
            } finally {
                setFeaturesLoading(false);
            }
        };

        fetchFeatures();

        if (isEditMode && editingTenant) {
            form.setFieldsValue({
                name: editingTenant.name,
                code: editingTenant.code,
                connectionString: editingTenant.connectionString,
                dbProvider: editingTenant.dbProvider || 'postgresql',
            });
            const features = editingTenant.features ?? [];
            setSelectedFeatures(features);
            form.setFieldsValue({
                features: features.length ? features : undefined,
                logoUrl: editingTenant.logoUrl
            });
        } else {
            form.resetFields();
            form.setFieldValue('dbProvider', 'postgresql');
            setSelectedFeatures([]);
        }
    }, [open, editingTenant]);

    // Force check all features if admin
    useEffect(() => {
        if (isAdmin && allFeatures.length > 0) {
            setSelectedFeatures(allFeatures);
            form.setFieldValue('features', allFeatures);
        }
    }, [isAdmin, allFeatures]);

    const handleFeatureCheck = (checkedKeysValue: any) => {
        const next = checkedKeysValue as string[];
        setSelectedFeatures(next);
        form.setFieldValue('features', next.length ? next : undefined);
        setIsDirty(true);
    };

    const handleCheckConnection = async () => {
        const connString = form.getFieldValue('connectionString');
        const provider = form.getFieldValue('dbProvider');

        if (!connString) {
            message.warning(t('msg_warning_empty_conn_string'));
            return;
        }

        setCheckLoading(true);
        try {
            const result = await tenantService.checkConnection(connString, provider);
            if (result.success) {
                message.success(t('connection_success'));
            } else {
                message.error(t('connection_error', { message: result.message }));
            }
        } catch (error: any) {
            message.error(error.message || t('msg_fail', { action: t('check_connection'), feature: 'Database' }));
        } finally {
            setCheckLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            let logoUrl = values.logoUrl;

            // Handle deferred file upload if logoUrl is a File object
            if (logoUrl instanceof File) {
                const formData = new FormData();
                formData.append('file', logoUrl);
                
                try {
                    const res = await api.upload(`/files/logos/upload`, formData, editingTenant?.id || 'host');
                    if (res && res.success) {
                        logoUrl = `/api/proxy/files/logos/${res.fileName}/view`;
                        message.success(t('msg_upload_success'));
                    } else {
                        throw new Error(res?.errorMessage || t('msg_upload_fail'));
                    }
                } catch (uploadError: any) {
                    message.error(t('msg_upload_fail') + ': ' + uploadError.message);
                    setSubmitting(false);
                    return;
                }
            }

            const payload = { ...values, logoUrl, features: selectedFeatures };

            if (isEditMode && editingTenant) {
                await tenantService.update(editingTenant.id, payload);
                message.success(t('msg_success', { action: t('update'), feature: t('tenant') }));
            } else {
                await tenantService.create(payload);
                message.success(t('msg_success', { action: t('add'), feature: t('tenant') }));
            }

            onSuccess();
            handleClose();
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(error.message || t('msg_fail', { action: isEditMode ? t('update') : t('add'), feature: t('tenant') }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        setSelectedFeatures([]);
        setIsDirty(false);
        onClose();
    };

    return (
        <>
            <AppPopup
                title={isEditMode ? `✏️ ${t('update')} ${t('tenant')}` : `➕ ${t('add')} ${t('tenant')}`}
                open={open}
                onOk={handleSubmit}
                onCancel={handleClose}
                submitting={submitting}
                isDirty={isDirty}
                tourSteps={tourSteps}
            width={750}
            content={
                <Form form={form} layout="vertical" disabled={submitting} onValuesChange={() => setIsDirty(true)}>
                    <div className="grid grid-cols-12 gap-x-8">
                        {/* Left: Logo Section */}
                        <div className="col-span-4 flex flex-col items-center justify-start pt-2">
                            <Form.Item 
                                name="logoUrl" 
                                label={<span className="font-bold text-gray-700">{t('tenant_logo')}</span>}
                                className="mb-4"
                            >
                                <AppImageUpload 
                                    tenantId={editingTenant?.id || tenantCode || 'host'} 
                                    folder="logos"
                                    placeholder={t('upload_logo')}
                                />
                            </Form.Item>
                            <div className="text-gray-400 text-[11px] text-center mt-4 px-4 leading-relaxed">
                                {t('logo_hint')}
                            </div>
                        </div>

                        {/* Right: Info Section */}
                        <div className="col-span-8">
                            <div className="grid grid-cols-2 gap-x-4">
                                <Form.Item
                                    name="name"
                                    label={<span className="font-bold text-gray-700">{t('tenant_name')}</span>}
                                    rules={[{ required: true, message: t('validate_tenant_name_required') }]}
                                >
                                    <Input id="tenant-form-name" placeholder={t('placeholder_tenant_name')} size="large" className="rounded-md" />
                                </Form.Item>

                                <Form.Item
                                    name="code"
                                    label={<span className="font-bold text-gray-700">{t('tenant_code')}</span>}
                                    rules={[{ required: true, message: t('validate_tenant_code_required') }]}
                                >
                                    <Input id="tenant-form-code" placeholder={t('placeholder_tenant_code')} disabled={isEditMode} size="large" className="rounded-md" />
                                </Form.Item>
                            </div>

                            <div className="grid grid-cols-12 gap-x-4 mt-2">
                                <div className="col-span-8">
                                    <Form.Item 
                                        name="connectionString" 
                                        label={<span className="font-bold text-gray-700">{t('connection_string')}</span>}
                                        className="mb-1"
                                    >
                                        <Input.TextArea
                                            id="tenant-form-conn"
                                            rows={3}
                                            placeholder={t('placeholder_conn_string')}
                                            disabled={isEditMode && (editingTenant?.isMigrated || editingTenant?.code?.toLowerCase() === 'admin')}
                                            className="rounded-md text-xs font-mono"
                                        />
                                    </Form.Item>
                                    <div className="flex justify-end mb-4">
                                        <AppButton
                                            id="tenant-form-check-conn-btn"
                                            size="small"
                                            btnType="add"
                                            loading={checkLoading}
                                            disabled={isEditMode && (editingTenant?.isMigrated || editingTenant?.code?.toLowerCase() === 'admin')}
                                            onClick={handleCheckConnection}
                                            style={{ fontSize: '11px', height: '26px', borderRadius: '6px' }}
                                        >
                                            {t('check_connection')}
                                        </AppButton>
                                    </div>
                                </div>
                                <div className="col-span-4">
                                    <Form.Item 
                                        name="dbProvider" 
                                        label={<span className="font-bold text-gray-700">{t('db_provider')}</span>}
                                    >
                                        <Select
                                            id="tenant-form-db"
                                            placeholder={t('placeholder_db_provider')}
                                            disabled={isEditMode && (editingTenant?.isMigrated || editingTenant?.code?.toLowerCase() === 'admin')}
                                            className="w-full"
                                            size="large"
                                        >
                                            <Select.Option value="postgresql">PostgreSQL</Select.Option>
                                            <Select.Option value="sqlserver">SQL Server</Select.Option>
                                            <Select.Option value="mysql">MySQL</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </div>
                            </div>

                            <div className="mt-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                <Form.Item label={<span className="font-bold text-gray-700">{t('features')}</span>} className="mb-0">
                                    <Form.Item name="features" noStyle>
                                        <FeaturesHiddenField />
                                    </Form.Item>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AppButton
                                                id="tenant-form-features-btn"
                                                type="dashed"
                                                icon={<SettingOutlined />}
                                                onClick={() => setIsFeatureModalOpen(true)}
                                                disabled={featuresLoading}
                                                className="hover:border-blue-400 transition-colors"
                                            >
                                                {isAdmin ? t('btn_full_features_admin') : t('btn_setup_features')}
                                            </AppButton>
                                            
                                            {!isAdmin && (
                                                <div className="text-gray-500 text-sm bg-white px-3 py-1 rounded-full border border-gray-200">
                                                    <Trans
                                                        i18nKey="selected_features_count"
                                                        values={{ count: selectedFeatures.length }}
                                                        components={{ b: <b className="text-blue-600" /> }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {isAdmin && (
                                            <Tag color="gold" icon={<SafetyCertificateOutlined />} className="m-0 px-3 py-1 rounded-full border-none shadow-sm">
                                                {t('status_all_features_enabled')}
                                            </Tag>
                                        )}
                                    </div>
                                </Form.Item>
                            </div>
                        </div>
                    </div>
                </Form>
            }
            />

            {/* Modal Chọn Features con */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <SettingOutlined className="text-blue-500" />
                        <span>{t('system_features_list')}</span>
                    </div>
                }
                open={isFeatureModalOpen}
                onOk={() => setIsFeatureModalOpen(false)}
                onCancel={() => setIsFeatureModalOpen(false)}
                width={550}
                zIndex={1100} // Cao hơn Popup chính
                footer={[
                    <Button key="ok" type="primary" onClick={() => setIsFeatureModalOpen(false)}>
                        {t('finish')}
                    </Button>
                ]}
            >
                {isAdmin && (
                    <Card size="small" className="mb-4 bg-yellow-50 border-yellow-200">
                        <div className="text-yellow-700 flex items-center gap-2">
                            <SafetyCertificateOutlined />
                            <b>{t('tenant')} Admin</b> {t('msg_tenant_admin_full_features')}
                        </div>
                    </Card>
                )}

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <Tree
                        checkable
                        showIcon
                        selectable={false}
                        defaultExpandAll
                        treeData={featureTreeData}
                        checkedKeys={selectedFeatures}
                        onCheck={isAdmin ? undefined : handleFeatureCheck}
                        disabled={isAdmin}
                        style={{ backgroundColor: 'transparent' }}
                    />
                </div>
            </Modal>
        </>
    );
}
