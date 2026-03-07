'use client';

import { useState, useEffect, useMemo } from 'react';
import { Form, Input, App, Button, Modal, Checkbox, Row, Col, Typography, Card, Space } from 'antd';
import { UnorderedListOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { createRoleApi, updateRoleApi, RoleData, getPermissionsApi } from '@/services/roleService';
import { AppPopup } from '@/app/components/common/AppPopup';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormModalProps {
    open: boolean;
    editingRole: RoleData | null; // null = Add mode, có data = Edit mode
    onSuccess: () => void;
    onClose: () => void;
}

// ─── Inner Form Component ─────────────────────────────────────────────────────

interface RoleFormProps {
    form: ReturnType<typeof Form.useForm>[0];
    isEditMode: boolean;
    submitting: boolean;
    onDirty: () => void;
    onOpenPermissions: () => void;
    selectedPermsCount: number;
    isAdmin: boolean;
    isSystem: boolean;
}

function RoleForm({
    form,
    submitting,
    onDirty,
    onOpenPermissions,
    selectedPermsCount,
    isAdmin,
    isSystem
}: RoleFormProps) {
    const { t } = useTranslation();

    return (
        <Form form={form} layout="vertical" disabled={submitting} onValuesChange={onDirty}>
            <Form.Item
                name="name"
                label={t('role_name')}
                rules={[{ required: true, message: t('validate_role_name_required') }]}
            >
                <Input id="role-form-name" placeholder={t('placeholder_role_name')} onChange={onDirty} disabled={(isAdmin || isSystem) && submitting === false} />
            </Form.Item>

            <Form.Item name="description" label={t('description')}>
                <Input.TextArea id="role-form-desc" placeholder={t('placeholder_description')} rows={3} />
            </Form.Item>

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item name="isActive" valuePropName="checked" label={t('status')}>
                        <Checkbox id="role-form-status" onChange={onDirty} disabled={isAdmin || isSystem}>Cho phép sử dụng (Kích hoạt)</Checkbox>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item label="Thiết lập quyền">
                <Space>
                    <Button
                        id="role-form-perms-btn"
                        type="dashed"
                        icon={isAdmin ? <SafetyCertificateOutlined style={{ color: 'green' }} /> : <UnorderedListOutlined />}
                        onClick={onOpenPermissions}
                    >
                        Hiện bảng Quyền hạng
                    </Button>
                    {isAdmin ? (
                        <Text type="success">Admin: Mặc định tất cả quyền</Text>
                    ) : (
                        <Text type="secondary">Đã chọn {selectedPermsCount} quyền</Text>
                    )}
                </Space>
            </Form.Item>
        </Form>
    );
}

// ─── Modal Component ──────────────────────────────────────────────────────────

export function FormModal({ open, editingRole, onSuccess, onClose }: FormModalProps) {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const isEditMode = editingRole !== null;

    const [submitting, setSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const tourSteps = [
        {
            title: t('tour_role_field_name_title'),
            description: t('tour_role_field_name_desc'),
            target: () => document.getElementById('role-form-name') as HTMLElement,
        },
        {
            title: t('tour_role_field_desc_title'),
            description: t('tour_role_field_desc_desc'),
            target: () => document.getElementById('role-form-desc') as HTMLElement,
        },
        {
            title: t('tour_role_field_status_title'),
            description: t('tour_role_field_status_desc'),
            target: () => document.getElementById('role-form-status') as HTMLElement,
        },
        {
            title: t('tour_role_field_perms_title'),
            description: t('tour_role_field_perms_desc'),
            target: () => document.getElementById('role-form-perms-btn') as HTMLElement,
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

    // Permissions logic
    const [allPermissions, setAllPermissions] = useState<string[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);

    // Watch values for logic
    const roleNameValue = Form.useWatch('name', form);
    const isAdmin = (roleNameValue || '').toLowerCase() === 'admin';
    const isSystem = Form.useWatch('isSystemRole', form) === true;

    // ── Fetch permissions when component loads
    useEffect(() => {
        getPermissionsApi().then(perms => {
            setAllPermissions(perms);
        }).catch(() => {
            console.error("Failed to load permissions list.");
            message.error("Không thể tải danh sách quyền.");
        });
    }, []);

    // ── Pre-fill form khi modal mở ───────────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        setIsDirty(false);

        if (isEditMode && editingRole) {
            form.setFieldsValue({
                name: editingRole.name,
                description: editingRole.description,
                isSystemRole: editingRole.isSystemRole,
                isActive: editingRole.isActive,
            });
            setSelectedPermissions(editingRole.permissions || []);
        } else {
            form.resetFields();
            form.setFieldsValue({ isActive: true, isSystemRole: false }); // Default cho form Add
            setSelectedPermissions([]);
        }
    }, [open, editingRole, form, isEditMode]);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // Gắn list quyền đã tick (nếu là admin, server sẽ tự ignore hoặc save vào cũng được)
            const payload = {
                ...values,
                permissions: selectedPermissions
            };

            if (isEditMode && editingRole) {
                const result = await updateRoleApi(editingRole.id, payload);
                message.success(result?.message || "Cập nhật thành công!");
            } else {
                const result = await createRoleApi(payload);
                message.success(result?.message || "Thêm mới thành công!");
            }

            onSuccess();
            handleClose();
        } catch (error: any) {
            console.error("Submit Exception:", error);
            if (error?.errorFields) return; // Lỗi validation của form
            message.error(error.message || "Xảy ra lỗi khi lưu dữ liệu");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Close ────────────────────────────────────────────────────────────────
    const handleClose = () => {
        form.resetFields();
        setIsDirty(false);
        setIsPermModalOpen(false);
        onClose();
    };

    // ── Permissions Grouping Logic ─────────────────────────────────────────
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, string[]> = {};
        allPermissions.forEach(p => {
            const parts = p.split('.');
            const moduleName = parts.length > 1 ? parts[1] : 'Hệ Thống';
            if (!groups[moduleName]) groups[moduleName] = [];
            groups[moduleName].push(p);
        });
        return groups;
    }, [allPermissions]);

    const handleCheckAllInGroup = (groupName: string, e: any) => {
        const groupPerms = groupedPermissions[groupName] || [];
        if (e.target.checked) {
            setSelectedPermissions(prev => Array.from(new Set([...prev, ...groupPerms])));
        } else {
            setSelectedPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
        }
        setIsDirty(true);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <AppPopup
                title={
                    isEditMode
                        ? `✏️ ${t('update')} ${t('role')}`
                        : `➕ ${t('add')} ${t('role')}`
                }
                open={open}
                onOk={handleSubmit}
                onCancel={handleClose}
                okText={t('save')}
                cancelText={t('cancel')}
                submitting={submitting}
                isDirty={isDirty}
                tourSteps={tourSteps}
                destroyOnHidden
                width={500}
                content={
                    <RoleForm
                        form={form}
                        isEditMode={isEditMode}
                        submitting={submitting}
                        onDirty={() => setIsDirty(true)}
                        onOpenPermissions={() => setIsPermModalOpen(true)}
                        selectedPermsCount={isAdmin ? allPermissions.length : selectedPermissions.length}
                        isAdmin={isAdmin}
                        isSystem={isSystem}
                    />
                }
            />

            {/* Modal Chọn Phân quyền (Z-index lớn hơn AppPopup nếu cần, Modal mặc định là 1000) */}
            <Modal
                title="⚙️ Quản lý Quyền hạng"
                open={isPermModalOpen}
                onOk={() => setIsPermModalOpen(false)}
                onCancel={() => setIsPermModalOpen(false)}
                width={650}
                zIndex={1100}
                footer={[
                    <Button key="ok" type="primary" onClick={() => setIsPermModalOpen(false)}>
                        Hoàn tất
                    </Button>
                ]}
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                    {isAdmin && (
                        <div style={{ marginBottom: 16 }}>
                            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                                <Text type="success">
                                    <SafetyCertificateOutlined /> <b>Role Admin</b> có toàn quyền hệ thống. Các quyền hiển thị dưới đây chỉ để tham khảo và không thể thay đổi.
                                </Text>
                            </Card>
                        </div>
                    )}

                    {Object.entries(groupedPermissions).map(([group, perms]) => {
                        const allChecked = perms.every(p => selectedPermissions.includes(p));
                        const isIndeterminate = perms.some(p => selectedPermissions.includes(p)) && !allChecked;

                        return (
                            <Card key={group} size="small" style={{ marginBottom: 16 }} title={
                                <Checkbox
                                    indeterminate={isAdmin ? false : isIndeterminate}
                                    checked={isAdmin ? true : allChecked}
                                    onChange={(e) => handleCheckAllInGroup(group, e)}
                                    disabled={isAdmin}
                                >
                                    <b>{group}</b>
                                </Checkbox>
                            }>
                                <Checkbox.Group
                                    style={{ width: '100%' }}
                                    value={isAdmin ? allPermissions : selectedPermissions}
                                    onChange={(checkedValues) => {
                                        if (isAdmin) return;

                                        // 1. Lọc ra các quyền KHÔNG thuộc nhóm hiện tại
                                        const otherGroupPerms = selectedPermissions.filter(p => !perms.includes(p));

                                        // 2. Gộp chúng với các quyền MỚI được chọn của nhóm này
                                        setSelectedPermissions([...otherGroupPerms, ...(checkedValues as string[])]);
                                        setIsDirty(true);
                                    }}
                                    disabled={isAdmin}
                                >
                                    <Row gutter={[16, 8]}>
                                        {perms.map(p => {
                                            const parts = p.split('.');
                                            const name = parts[parts.length - 1]; // e.g: "View", "Create"
                                            return (
                                                <Col span={8} key={p}>
                                                    <Checkbox value={p}>{name}</Checkbox>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </Checkbox.Group>
                            </Card>
                        );
                    })}
                </div>
            </Modal>
        </>
    );
}
