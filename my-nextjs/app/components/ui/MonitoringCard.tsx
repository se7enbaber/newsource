'use client';

import React from 'react';
import { Card, Badge, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { LineChartOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface MonitoringCardProps {
    name: string;
    health: {
        status: string;
        message: string;
        code: number;
    };
    onClick: () => void;
    getStatusColor: (status: string) => string;
}

export const MonitoringCard: React.FC<MonitoringCardProps> = ({ 
    name, 
    health, 
    onClick, 
    getStatusColor 
}) => {
    const { t } = useTranslation();
    
    return (
        <Card 
            className="!rounded-[32px] border-0 shadow-sm hover:shadow-xl transition-all overflow-hidden relative group cursor-pointer hover:-translate-y-1"
            onClick={onClick}
        >
            <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ backgroundColor: getStatusColor(health.status) }} 
            />
            <div className="p-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="font-black text-slate-800 truncate pr-2 uppercase tracking-wider text-[12px]">{name}</div>
                    <Badge 
                        status={health.status === 'Healthy' ? 'processing' : 'error'} 
                        color={getStatusColor(health.status)} 
                        text={<span className="font-black text-[10px]" style={{ color: getStatusColor(health.status) }}>{t(`status_${health.status.toLowerCase()}`, { defaultValue: health.status }).toUpperCase()}</span>} 
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-xs font-bold leading-relaxed">{health.message || t('dash_checking')}</div>
                    <LineChartOutlined className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
            </div>
        </Card>
    );
};
