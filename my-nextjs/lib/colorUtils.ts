/**
 * Tiện ích xử lý màu sắc và độ tương phản theo chuẩn WCAG 2.1
 */

/**
 * Tính toán Luminance (độ sáng tương đối) của một màu hex
 * Công thức theo chuẩn WCAG 2.1
 */
export function getLuminance(hex: string): number {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

    const [R, G, B] = [r, g, b].map((v) => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Tính tỷ lệ tương phản giữa hai màu (Contrast Ratio)
 * Tỷ lệ tối đa là 21 (trắng - đen), tối thiểu là 1
 */
export function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Tự động chọn màu chữ (đen hoặc trắng) phù hợp với màu nền
 * @param bgColor Màu nền dạng hex
 * @param dark Màu chữ tối (mặc định #1e293b - Slate 800)
 * @param light Màu chữ sáng (mặc định #ffffff)
 * @returns Màu chữ có độ tương phản tốt nhất
 */
export function getContrastTextColor(
    bgColor: string, 
    dark: string = '#1e293b', 
    light: string = '#ffffff'
): string {
    // Nếu màu không hợp lệ hoặc không có màu, mặc định trả về màu tối
    if (!bgColor || !bgColor.startsWith('#') || bgColor.length < 7) return dark;
    
    const bgLuminance = getLuminance(bgColor);
    
    // Ngưỡng sáng/tối thường dùng là 0.179 hoặc đánh giá tỷ lệ contrast
    // Ở đây ta chọn màu có contrast ratio cao hơn với nền
    const contrastWithLight = getContrastRatio(bgColor, light);
    const contrastWithDark = getContrastRatio(bgColor, dark);
    
    return contrastWithLight >= contrastWithDark ? light : dark;
}

/**
 * Chuyển đổi màu Hex sang HSL để dễ dàng tính toán độ sáng/tối
 */
export function hexToHsl(hex: string): { h: number, s: number, l: number } {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Chuyển đổi màu HSL ngược lại Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        r = hue2rgb(h + 1 / 3);
        g = hue2rgb(h);
        b = hue2rgb(h - 1 / 3);
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Làm tối/sáng một màu dựa trên phần trăm (ví dụ: -15 để làm tối 15%)
 */
export function adjustLightness(hex: string, percent: number): string {
    const { h, s, l } = hexToHsl(hex);
    const newL = Math.max(0, Math.min(100, l + percent));
    return hslToHex(h, s, newL);
}

/**
 * Làm tối một màu dựa trên phần trăm (0-100) theo phương pháp tương đối
 * @param hex Màu hex cần xử lý
 * @param amount Phần trăm muốn làm tối (ví dụ: 45)
 * @returns Màu hex mới đã được làm tối, tối thiểu 15% lightness
 * @example
 * darkenColor('#4ECDC4', 45) → khoảng #1a5c58 ✓
 * darkenColor('#3B0764', 45) → khoảng #1a0a2e ✓ (không phải #000000)
 * darkenColor('#000000', 45) → #262626 (lightness=15%) ✓
 */
export function darkenColor(hex: string, amount: number): string {
    const { h, s, l } = hexToHsl(hex);
    // Tính tương đối: giảm theo % của lightness hiện tại
    // Safety floor Math.max(15, ...) giúp màu không bao giờ bị đen hoàn toàn
    const newL = Math.max(15, l * (1 - amount / 100));
    return hslToHex(h, s, newL);
}

/**
 * Làm sáng một màu dựa trên phần trăm (0-100) theo phương pháp tương đối
 * @param hex Màu hex cần xử lý
 * @param amount Phần trăm muốn làm sáng
 * @returns Màu hex mới đã được làm sáng, tối đa 92% lightness
 */
export function lightenColor(hex: string, amount: number): string {
    const { h, s, l } = hexToHsl(hex);
    // Tính tương đối và Safety ceiling Math.min(92, ...)
    const newL = Math.min(92, l + (100 - l) * (amount / 100));
    return hslToHex(h, s, newL);
}
