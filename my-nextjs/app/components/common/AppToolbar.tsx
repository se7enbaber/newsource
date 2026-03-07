'use client';

import React from 'react';
import { Space, Input } from 'antd';
import { SearchOutlined, PlusOutlined, FileExcelOutlined, QuestionCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { AppButton } from './AppButton';
import { useTranslation } from 'react-i18next';

export type AppToolbarButtonKey = 'add' | 'export' | 'help' | 'filter' | string;

export interface AppToolbarButtonConfig {
    key: AppToolbarButtonKey;
    title?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    permission?: string | string[];
    ref?: React.Ref<any>;
    show?: boolean; // Mặc định là true
    btnType?: 'add' | 'export' | 'filter' | 'edit' | 'delete' | 'view' | 'help' | 'vibe' | 'quest';
    /** @deprecated Use extraActions for completely custom components, or children for button text */
    children?: React.ReactNode;
}

export interface AppToolbarProps {
    // Search config
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    showSearch?: boolean;
    searchId?: string;
    searchRef?: React.Ref<any>;

    // Buttons config
    buttons?: AppToolbarButtonConfig[];
    
    // Custom actions on the left (e.g. Batch actions)
    leftActions?: React.ReactNode;
    
    // Additional custom components/buttons on the right
    extraActions?: React.ReactNode;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
    searchPlaceholder,
    searchValue,
    onSearchChange,
    showSearch = true,
    searchId,
    searchRef,

    buttons = [],

    leftActions,
    extraActions,
}) => {
    const { t } = useTranslation();

    // Hàm lấy icon mặc định dựa trên key
    const getDefaultIcon = (key: AppToolbarButtonKey) => {
        switch (key) {
            case 'add': return <PlusOutlined />;
            case 'export': return <FileExcelOutlined />;
            case 'help': return <QuestionCircleOutlined />;
            case 'filter': return <FilterOutlined />;
            default: return undefined;
        }
    };

    // Hàm lấy btnType mặc định dựa trên key
    const getDefaultBtnType = (key: AppToolbarButtonKey): any => {
        if (['add', 'export', 'help', 'filter'].includes(key)) {
            return key;
        }
        return undefined;
    };

    return (
        <div className="mb-4 flex justify-between items-center px-2">
            <div>
                {leftActions}
            </div>
            <Space>
                {buttons
                    .filter(btn => btn.show !== false)
                    .map((btn) => (
                        <span key={btn.key} ref={btn.ref}>
                            <AppButton
                                btnType={btn.btnType || getDefaultBtnType(btn.key)}
                                icon={btn.icon || getDefaultIcon(btn.key)}
                                title={btn.title}
                                onClick={btn.onClick}
                                permission={btn.permission}
                            >
                                {btn.children}
                            </AppButton>
                        </span>
                    ))
                }

                {extraActions}

                {showSearch && (
                    <span ref={searchRef}>
                        <Input
                            id={searchId}
                            placeholder={searchPlaceholder || t('searchText')}
                            prefix={<SearchOutlined />}
                            style={{ width: 250 }}
                            className="rounded-md"
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            allowClear
                        />
                    </span>
                )}
            </Space>
        </div>
    );
};
