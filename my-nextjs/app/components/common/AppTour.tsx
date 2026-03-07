'use client';

import React from 'react';
import { Tour, TourProps } from 'antd';

interface AppTourProps extends TourProps {
    open: boolean;
    onClose: () => void;
}

export const AppTour: React.FC<AppTourProps> = ({ open, onClose, steps, ...props }) => {
    return (
        <Tour
            open={open}
            onClose={onClose}
            steps={steps}
            {...props}
        />
    );
};
