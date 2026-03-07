'use client';

import React from 'react';

export type BadgeVibeType = 'crushing' | 'coffee' | 'vibing' | 'on_fire' | 'steady' | 'paused' | 'default';

interface AppBadgeProps {
    type?: BadgeVibeType;
    children: React.ReactNode;
    className?: string;
}

/**
 * AppBadge - Mint ERP Vibe Status Badges with Dot indicator
 */
export const AppBadge: React.FC<AppBadgeProps> = ({ 
    type = 'default', 
    children, 
    className = '' 
}) => {
    const getBadgeConfig = () => {
        switch (type) {
            case 'on_fire': 
            case 'crushing': 
                return { color: '#ff9800', bg: '#fff7ed' }; 
            case 'steady': 
            case 'vibing': 
                return { color: '#2bd4bd', bg: '#f0fdfa' };
            case 'paused': 
            case 'coffee':
                return { color: '#94a3b8', bg: '#f8fafc' };
            default: 
                return { color: '#64748b', bg: '#f1f5f9' };
        }
    };

    const config = getBadgeConfig();

    return (
        <div 
           className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${className}`}
           style={{ backgroundColor: config.bg, color: config.color }}
        >
            <div 
               className="w-1.5 h-1.5 rounded-full" 
               style={{ backgroundColor: config.color }} 
            />
            {children}
        </div>
    );
};
