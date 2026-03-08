'use client';

import { theme } from 'antd';
import { getContrastTextColor, getContrastRatio } from '@/lib/colorUtils';

/**
 * useContrastColor - Hook hỗ trợ xử lý màu chữ tương phản động theo theme
 * Đảm bảo tính khả dụng (Accessibility) khi người dùng đổi màu Primary
 */
export function useContrastColor() {
    const { token } = theme.useToken();

    return {
        /**
         * Tự động tính màu chữ phù hợp cho bất kỳ màu nền nào
         */
        getTextColor: (bgColor: string) => getContrastTextColor(bgColor),
        
        /**
         * Màu chữ tối ưu cho các token hay dùng
         */
        primaryTextColor: getContrastTextColor(token.colorPrimary),
        primaryBgTextColor: getContrastTextColor(token.colorPrimaryBg),
        
        /**
         * Kiểm tra tỷ lệ tương phản giữa 2 màu
         */
        checkContrast: (bg: string, fg: string) => getContrastRatio(bg, fg),
    };
}
