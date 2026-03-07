'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Modal, App } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { api } from '@/services/apiService';
import { useTranslation } from 'react-i18next';

interface AppImageUploadProps {
    value?: string | File;
    onChange?: (val: string | File) => void;
    tenantId?: string;
    folder?: string;
    placeholder?: string;
}

/**
 * Reusable Image Upload Component
 * Integration with FileService (MinIO)
 */
export const AppImageUpload: React.FC<AppImageUploadProps> = ({ 
    value, 
    onChange, 
    tenantId = 'host',
    folder = 'avatars',
    placeholder
}) => {
    const { t } = useTranslation();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [internalFileList, setInternalFileList] = useState<UploadFile[]>([]);

    // Transform value (URL or File) into Ant Design UploadFile format
    useEffect(() => {
        if (!value) {
            setInternalFileList([]);
            return;
        }

        if (typeof value === 'string') {
            // Existing URL from database
            setInternalFileList([
                {
                    uid: '-1',
                    name: 'image.png',
                    status: 'done',
                    url: value,
                },
            ]);
        } else if ((value as any) instanceof File) {
            // Newly selected local file (not yet uploaded)
            const file = value as File;
            setInternalFileList([
                {
                    uid: '-2',
                    name: file.name,
                    status: 'done',
                    originFileObj: file as any,
                    url: URL.createObjectURL(file),
                },
            ]);
        }
    }, [value]);

    const handleCancel = () => setPreviewOpen(false);

    const handlePreview = async (file: UploadFile) => {
        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleBeforeUpload = (file: any) => {
        // Validate file type - only allow images
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error(t('msg_upload_only_image', 'Chỉ được phép tải lên tệp hình ảnh!'));
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error(t('msg_upload_size_limit', 'Kích thước ảnh không được vượt quá 2MB!'));
            return Upload.LIST_IGNORE;
        }

        // Prevent automatic upload and notify form of the selected file
        onChange?.(file);
        return false;
    };

    const handleRemove = () => {
        onChange?.('');
    };

    const uploadButton = (
        <div className="flex flex-col items-center justify-center">
            {loading ? <LoadingOutlined /> : <PlusOutlined className="text-xl" />}
            <div style={{ marginTop: 8 }} className="text-gray-500 font-medium">
                {placeholder || t('upload')}
            </div>
        </div>
    );

    return (
        <div className="app-image-upload">
            <Upload
                listType="picture-card"
                className="image-uploader"
                showUploadList={true}
                beforeUpload={handleBeforeUpload}
                onPreview={handlePreview}
                fileList={internalFileList}
                maxCount={1}
                onRemove={handleRemove}
                accept="image/*"
            >
                {internalFileList.length >= 1 ? null : uploadButton}
            </Upload>
            
            <Modal 
                open={previewOpen} 
                title={t('preview')} 
                footer={null} 
                onCancel={handleCancel}
                centered
                className="preview-modal"
            >
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <img 
                        alt="preview" 
                        style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        src={previewImage || value} 
                    />
                </div>
            </Modal>

            <style jsx global>{`
                .image-uploader .ant-upload.ant-upload-select {
                    width: 120px !important;
                    height: 120px !important;
                    border-radius: 12px !important;
                    border: 2px dashed #d9d9d9 !important;
                    background: #fafafa !important;
                    transition: all 0.3s ease;
                    margin-bottom: 0px !important;
                }
                .image-uploader.ant-upload-wrapper {
                    min-height: 120px;
                }
                .image-uploader .ant-upload-list-item-container {
                    width: 120px !important;
                    height: 120px !important;
                }
            `}</style>
        </div>
    );
};
