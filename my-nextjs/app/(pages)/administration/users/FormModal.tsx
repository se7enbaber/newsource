'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Switch, DatePicker, Spin, Tag, App } from 'antd';
import dayjs from 'dayjs';
const { CheckableTag } = Tag;
import { useTranslation } from 'react-i18next';
import { createUserApi, updateUserApi } from '@/services/userService';
import { getRoleDropdownApi, RoleDropdownItem } from '@/services/roleService';
import { AppPopup } from '@/app/components/common/AppPopup';
import { AppImageUpload } from '@/app/components/common/AppImageUpload';
import { usePermission } from '@/lib/PermissionProvider';
import { api } from '@/services/apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserDataType {
    id: string;
    userName: string;
    fullName: string | null;
    email: string;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    roles: string[];
    isActive: boolean;
    avatarUrl: string | null;
}

interface FormModalProps {
    open: boolean;
    editingUser: UserDataType | null; // null = Add mode, có data = Edit mode
    onSuccess: () => void;
    onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Null-rendering field — absorbs value/onChange injected by Ant Design Form
 * mà không tạo DOM element (tránh lỗi uncontrolled → controlled).
 */
function RolesHiddenField(_: { value?: string[]; onChange?: (v: string[]) => void }) {
    return null;
}

// ─── Inner Form Component ─────────────────────────────────────────────────────

interface UserFormProps {
    form: ReturnType<typeof Form.useForm>[0];
    isEditMode: boolean;
    submitting: boolean;
    roles: RoleDropdownItem[];
    rolesLoading: boolean;
    selectedRoles: string[];
    onTagChange: (roleName: string, checked: boolean) => void;
    onDirty: () => void;
}

function UserForm({
    form,
    isEditMode,
    submitting,
    roles,
    rolesLoading,
    selectedRoles,
    onTagChange,
    onDirty,
}: UserFormProps) {
    const { t } = useTranslation();
    const { tenantCode } = usePermission();

    return (
        <Form form={form} layout="vertical" disabled={submitting} onValuesChange={onDirty}>
            <div className="grid grid-cols-12 gap-x-8">
                {/* Left: Avatar Section */}
                <div className="col-span-4 flex flex-col items-center justify-start pt-2">
                    <Form.Item 
                        name="avatarUrl" 
                        label={<span className="font-bold text-gray-700">{t('avatar_user')}</span>}
                        className="mb-4"
                    >
                        <AppImageUpload 
                            tenantId={tenantCode || 'host'} 
                            folder="avatars"
                            placeholder={t('upload_avatar')}
                        />
                    </Form.Item>
                    <div className="text-gray-400 text-[11px] text-center mt-4 px-4 leading-relaxed">
                        {t('avatar_hint')}
                    </div>
                </div>

                {/* Right: User Info Section */}
                <div className="col-span-8">
                    {/* Row 1: userName + fullName */}
                    <div className="grid grid-cols-2 gap-x-4">
                        <Form.Item
                            name="userName"
                            label={<span className="font-bold text-gray-700">{t('user_name')}</span>}
                            rules={[{ required: true, message: t('validate_username_required') }]}
                        >
                            <Input id="user-form-username" placeholder={t('placeholder_username')} disabled={isEditMode} size="large" className="rounded-md" />
                        </Form.Item>

                        <Form.Item name="fullName" label={<span className="font-bold text-gray-700">{t('full_name')}</span>}>
                            <Input id="user-form-fullname" placeholder={t('placeholder_fullname')} size="large" className="rounded-md" />
                        </Form.Item>
                    </div>

                    {/* Row 2: password + email */}
                    <div className="grid grid-cols-2 gap-x-4">
                        <Form.Item
                            name="password"
                            label={<span className="font-bold text-gray-700">{t('password')}</span>}
                            rules={[
                                ...(isEditMode ? [] : [
                                    { required: true, message: t('validate_password_required') },
                                ]),
                                { min: 6, message: t('validate_password_min') },
                            ]}
                            extra={isEditMode ? <span className="text-[11px] text-orange-500 italic">{t('password_edit_hint')}</span> : undefined}
                        >
                            <Input.Password
                                id="user-form-password"
                                size="large"
                                className="rounded-md"
                                placeholder={
                                    isEditMode
                                        ? t('placeholder_password_edit')
                                        : t('placeholder_password')
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span className="font-bold text-gray-700">{t('email')}</span>}
                            rules={[
                                { required: true, message: t('validate_email_required') },
                                { type: 'email', message: t('validate_email_invalid') },
                            ]}
                        >
                            <Input id="user-form-email" placeholder={t('placeholder_email')} size="large" className="rounded-md" />
                        </Form.Item>
                    </div>

                    {/* Row 3: phoneNumber + dateOfBirth */}
                    <div className="grid grid-cols-2 gap-x-4">
                        <Form.Item name="phoneNumber" label={<span className="font-bold text-gray-700">{t('phone_number')}</span>}>
                            <Input id="user-form-phone" placeholder={t('placeholder_phone')} size="large" className="rounded-md" />
                        </Form.Item>

                        <Form.Item name="dateOfBirth" label={<span className="font-bold text-gray-700">{t('date_of_birth')}</span>}>
                            <DatePicker
                                id="user-form-dob"
                                placeholder={t('placeholder_dob')}
                                format="DD/MM/YYYY"
                                size="large"
                                style={{ width: '100%' }}
                                className="rounded-md"
                                disabledDate={(d) => d && d.isAfter(dayjs())}
                            />
                        </Form.Item>
                    </div>

                    <div className="flex items-center gap-8 mt-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        {/* Row 5: isActive */}
                        <Form.Item name="isActive" label={<span className="font-bold text-gray-700">{t('status')}</span>} valuePropName="checked" initialValue={true} className="mb-0">
                            <Switch
                                id="user-form-status"
                                checkedChildren={t('status_active')}
                                unCheckedChildren={t('status_inactive')}
                            />
                        </Form.Item>

                        {/* Row 6: Vai trò */}
                        <Form.Item label={<span className="font-bold text-gray-700">{t('role')}</span>} required className="mb-0 flex-1">
                            <Form.Item
                                name="roles"
                                noStyle
                                rules={[{ required: true, message: t('validate_role_required') }]}
                            >
                                <RolesHiddenField />
                            </Form.Item>

                            {rolesLoading ? (
                                <div className="flex items-center gap-2 py-1 text-gray-400">
                                    <Spin size="small" /> <span className="text-xs">{t('loading_roles')}</span>
                                </div>
                            ) : (
                                <div id="user-form-roles" className="flex flex-wrap gap-2 pt-1">
                                    {roles.map((role) => (
                                        <CheckableTag
                                            key={role.name}
                                            checked={selectedRoles.includes(role.name)}
                                            onChange={(checked) => !submitting && onTagChange(role.name, checked)}
                                            style={{
                                                padding: '2px 12px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                border: '1.5px solid',
                                                borderColor: selectedRoles.includes(role.name) ? '#1677ff' : '#d9d9d9',
                                                cursor: submitting ? 'not-allowed' : 'pointer',
                                                opacity: submitting ? 0.5 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {role.name}
                                        </CheckableTag>
                                    ))}
                                </div>
                            )}
                        </Form.Item>
                    </div>
                </div>
            </div>
        </Form>
    );
}

// ─── Modal Component ──────────────────────────────────────────────────────────

export function FormModal({ open, editingUser, onSuccess, onClose }: FormModalProps) {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const { tenantCode } = usePermission();
    const [form] = Form.useForm();
    const isEditMode = editingUser !== null;

    const [roles, setRoles] = useState<RoleDropdownItem[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const tourSteps = [
        {
            title: t('tour_user_field_username_title'),
            description: t('tour_user_field_username_desc'),
            target: () => document.getElementById('user-form-username') as HTMLElement,
        },
        {
            title: t('tour_user_field_password_title'),
            description: t('tour_user_field_password_desc'),
            target: () => document.getElementById('user-form-password') as HTMLElement,
        },
        {
            title: t('tour_user_field_fullname_title'),
            description: t('tour_user_field_fullname_desc'),
            target: () => document.getElementById('user-form-fullname') as HTMLElement,
        },
        {
            title: t('tour_user_field_email_title'),
            description: t('tour_user_field_email_desc'),
            target: () => document.getElementById('user-form-email') as HTMLElement,
        },
        {
            title: t('tour_user_field_phone_title'),
            description: t('tour_user_field_phone_desc'),
            target: () => document.getElementById('user-form-phone') as HTMLElement,
        },
        {
            title: t('tour_user_field_dob_title'),
            description: t('tour_user_field_dob_desc'),
            target: () => document.getElementById('user-form-dob') as HTMLElement,
        },
        {
            title: t('tour_user_field_status_title'),
            description: t('tour_user_field_status_desc'),
            target: () => document.getElementById('user-form-status') as HTMLElement,
        },
        {
            title: t('tour_user_field_roles_title'),
            description: t('tour_user_field_roles_desc'),
            target: () => document.getElementById('user-form-roles') as HTMLElement,
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

    // ── Fetch roles + fill form khi modal mở ─────────────────────────────────
    useEffect(() => {
        if (!open) return;

        setIsDirty(false);

        const fetchRoles = async () => {
            setRolesLoading(true);
            try {
                const data = await getRoleDropdownApi();
                setRoles(data);
            } catch (error: any) {
                message.error(error.message || t('error_load_roles') || 'Không thể tải danh sách vai trò');
            } finally {
                setRolesLoading(false);
            }
        };

        fetchRoles();

        if (isEditMode && editingUser) {
            form.setFieldsValue({
                userName: editingUser.userName,
                fullName: editingUser.fullName,
                email: editingUser.email,
                phoneNumber: editingUser.phoneNumber,
                dateOfBirth: editingUser.dateOfBirth ? dayjs(editingUser.dateOfBirth) : null,
                isActive: editingUser.isActive,
                avatarUrl: editingUser.avatarUrl,
            });
            setSelectedRoles(editingUser.roles ?? []);
            form.setFieldValue('roles', editingUser.roles?.length ? editingUser.roles : undefined);
        } else {
            form.resetFields();
            setSelectedRoles([]);
        }
    }, [open, editingUser]);

    // ── Role tag toggle ──────────────────────────────────────────────────────
    const handleTagChange = (roleName: string, checked: boolean) => {
        const next = checked
            ? [...selectedRoles, roleName]
            : selectedRoles.filter((n) => n !== roleName);
        setSelectedRoles(next);
        form.setFieldValue('roles', next.length ? next : undefined);
        setIsDirty(true);
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            let avatarUrl = values.avatarUrl;

            // Handle deferred file upload if avatarUrl is a File object
            if (avatarUrl instanceof File) {
                const formData = new FormData();
                formData.append('file', avatarUrl);
                
                try {
                    const res = await api.upload(`/files/avatars/upload`, formData, tenantCode || 'host');
                    if (res && res.success) {
                        avatarUrl = `/api/proxy/files/avatars/${res.fileName}/view?tenantId=${tenantCode || 'host'}`;
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

            if (values.dateOfBirth) {
                values.dateOfBirth = values.dateOfBirth.toISOString();
            }

            const payload = { ...values, avatarUrl, roles: selectedRoles };

            if (isEditMode && editingUser) {
                const result = await updateUserApi(editingUser.id, payload);
                message.success(result?.message || t('msg_success', { action: t('update'), feature: t('user') }));
            } else {
                const result = await createUserApi(payload);
                message.success(result?.message || t('msg_success', { action: t('add'), feature: t('user') }));
            }

            onSuccess();
            handleClose();
        } catch (error: any) {
            if (error?.errorFields) return;
            message.error(
                error.message ||
                t('msg_fail', {
                    action: isEditMode ? t('update') : t('add'),
                    feature: t('user')
                })
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── Close ────────────────────────────────────────────────────────────────
    const handleClose = () => {
        form.resetFields();
        setSelectedRoles([]);
        setIsDirty(false);
        onClose();
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <AppPopup
            title={
                isEditMode
                    ? `✏️ ${t('update')} ${t('user')}`
                    : `➕ ${t('add')} ${t('user')}`
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
            width={720}
            content={
                <UserForm
                    form={form}
                    isEditMode={isEditMode}
                    submitting={submitting}
                    roles={roles}
                    rolesLoading={rolesLoading}
                    selectedRoles={selectedRoles}
                    onTagChange={handleTagChange}
                    onDirty={() => setIsDirty(true)}
                />
            }
        />
    );
}
