'use client';

import React from 'react';
import { Modal, ModalProps, App, Space, Button } from 'antd';
import { ExclamationCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { AppTour } from './AppTour';
import type { TourProps } from 'antd';

interface AppPopupProps extends ModalProps {
    /** Cờ báo form đã bị thay đổi — khi đóng sẽ hỏi xác nhận */
    isDirty?: boolean;
    /** Đang gọi API lưu — lock toàn bộ popup (nút Cancel, X, mask, keyboard) */
    submitting?: boolean;
    /** Nội dung truyền vào (thay thế hoặc bổ sung cho children) */
    content?: React.ReactNode;
    /** Danh sách các bước hướng dẫn (Tour) cho riêng modal này */
    tourSteps?: TourProps['steps'];
    onCancel?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const AppPopup: React.FC<AppPopupProps> = ({
    isDirty = false,
    submitting = false,
    content,
    tourSteps,
    onCancel,
    title,
    children,
    ...props
}) => {
    const { modal } = App.useApp();
    const { primaryColor } = useTheme();
    const { t } = useTranslation();
    const [tourOpen, setTourOpen] = React.useState(false);

    // Khi đang submitting, chặn mọi hành động đóng popup
    const handleCancel = (e: any) => {
        if (submitting) return;

        if (isDirty) {
            modal.confirm({
                title: t('confirm_discard_title'),
                icon: <ExclamationCircleFilled />,
                content: t('confirm_discard_message'),
                okText: t('discard'),
                cancelText: t('stay'),
                okButtonProps: { danger: true },
                onOk: () => onCancel?.(e),
            });
        } else {
            onCancel?.(e);
        }
    };

    return (
        <>
            <Modal
                centered
                {...props}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: tourSteps ? '24px' : '0' }}>
                    <span style={{ color: primaryColor, fontWeight: 600 }}>{title}</span>
                    {tourSteps && (
                        <Button
                            type="text"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setTourOpen(true);
                            }}
                            style={{
                                padding: '0 4px',
                                height: '22px'
                            }}
                            title={t('help')}
                            className="hover:bg-gray-100/50"
                        >
                            <QuestionCircleOutlined style={{ color: primaryColor, fontSize: 16 }} />
                        </Button>
                    )}
                </div>
            }
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText={props.okText || t('save')}
            cancelText={props.cancelText || t('cancel')}
            // Khi đang submitting: lock Cancel, X, click-ngoài, Escape
            cancelButtonProps={{ 
                id: 'app-popup-cancel-btn',
                disabled: submitting, 
                ...props.cancelButtonProps 
            }}
            closable={!submitting}
            mask={{ closable: false }}
            keyboard={!submitting}
            style={{ borderRadius: 6, ...props.style }}
            okButtonProps={{
                id: 'app-popup-save-btn',
                style: { backgroundColor: primaryColor },
                ...props.okButtonProps,
            }}
        >
            <div style={{ paddingTop: '16px' }}>
                {content ?? children}

                {tourSteps && (
                    <AppTour
                        open={tourOpen}
                        onClose={() => setTourOpen(false)}
                        steps={tourSteps}
                    />
                )}
            </div>
            </Modal>
        </>
    );
};