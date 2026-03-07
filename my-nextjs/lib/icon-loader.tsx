import React from 'react';
import * as Icons from '@ant-design/icons';

export const getIcon = (iconName?: string) => {
    if (!iconName) return null;

    // Ép kiểu để lấy đúng component từ thư viện icons
    const AntIcon = (Icons as any)[iconName];

    return AntIcon ? React.createElement(AntIcon) : null;
};