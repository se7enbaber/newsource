'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, App, theme } from 'antd';

export type ThemeStyle = 'default' | 'dark' | 'mui' | 'shadcn' | 'cartoon' | 'illustration' | 'bootstrap' | 'glass' | 'geek';

interface ThemeContextType {
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    themeStyle: ThemeStyle;
    setThemeStyle: (style: ThemeStyle) => void;
    fontSize: number;
    setFontSize: (val: number) => void;
    isCompact: boolean;
    setIsCompact: (val: boolean) => void;
    isDarkMode: boolean; // Computed value for backward compatibility
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [primaryColor, setPrimaryColor] = useState('#2BD4BD');
    const [themeStyle, setThemeStyle] = useState<ThemeStyle>('default');
    const [fontSize, setFontSize] = useState(14);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const savedColor = localStorage.getItem('app_primary_color');
        if (savedColor) setPrimaryColor(savedColor);

        const savedStyle = localStorage.getItem('app_theme_style') as ThemeStyle;
        if (savedStyle) setThemeStyle(savedStyle);

        const savedFontSize = localStorage.getItem('app_font_size');
        if (savedFontSize) setFontSize(Number(savedFontSize));

        const savedCompact = localStorage.getItem('app_compact_mode');
        if (savedCompact === 'true') setIsCompact(true);
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', primaryColor);
    }, [primaryColor]);

    const handleSetPrimaryColor = (color: string) => {
        setPrimaryColor(color);
        localStorage.setItem('app_primary_color', color);
    };

    const handleSetThemeStyle = (style: ThemeStyle) => {
        setThemeStyle(style);
        localStorage.setItem('app_theme_style', style);
    };

    const handleSetFontSize = (val: number) => {
        setFontSize(val);
        localStorage.setItem('app_font_size', String(val));
    };

    const handleSetCompact = (val: boolean) => {
        setIsCompact(val);
        localStorage.setItem('app_compact_mode', String(val));
    };

    const isDarkMode = themeStyle === 'dark' || themeStyle === 'geek';

    const algorithms = React.useMemo(() => {
        const algs = [];
        if (isDarkMode) algs.push(theme.darkAlgorithm);
        else algs.push(theme.defaultAlgorithm);
        if (isCompact) algs.push(theme.compactAlgorithm);
        return algs;
    }, [isDarkMode, isCompact]);

    const themeConfig = React.useMemo(() => {
        const baseToken: any = {
            colorPrimary: primaryColor,
            borderRadius: 16,
            fontFamily: '"Space Grotesk", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: fontSize,
            colorSuccess: '#2bd4bd', 
            colorWarning: '#ff9800', 
            colorInfo: '#2BD4BD', 
            colorBgLayout: '#f8fafc', // Very light gray background
        };

        let components: any = {
            Menu: {
                itemBg: 'transparent',
                itemSelectedBg: primaryColor,
                itemSelectedColor: '#1e293b', // Dark text on mint
                itemHoverColor: '#1e293b',
                itemActiveBg: primaryColor,
                itemBorderRadius: 12,
                itemMarginInline: 16,
            },
            Card: {
                boxShadowTertiary: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                paddingLG: 24, 
                borderRadiusLG: 24,
                colorBgContainer: '#ffffff',
            },
            Table: {
                headerBg: 'transparent',
                headerColor: '#64748b',
                headerBorderRadius: 16,
                cellPaddingBlock: 16,
            },
            Button: {
                fontWeight: 600,
                controlHeight: 44,
                paddingInline: 24,
                borderRadius: 12,
                borderRadiusLG: 16,
            },
            Input: {
                controlHeight: 44,
                borderRadius: 12,
                colorBgContainer: '#f1f5f9',
                colorBorder: 'transparent',
            }
        };

        switch (themeStyle) {
            case 'mui':
                baseToken.borderRadius = 4;
                baseToken.colorPrimary = '#1976d2';
                break;
            case 'shadcn':
                baseToken.borderRadius = 2;
                baseToken.colorPrimary = isDarkMode ? '#ffffff' : '#000000';
                baseToken.colorBgContainer = isDarkMode ? '#09090b' : '#ffffff';
                break;
            case 'cartoon':
                baseToken.borderRadius = 12;
                baseToken.lineWidth = 2;
                components.Button = { borderRadius: 0, shadow: '4px 4px 0px 0px #000' };
                break;
            case 'geek':
                baseToken.borderRadius = 0;
                baseToken.fontFamily = 'Monaco, Consolas, "Ubuntu Mono", monospace';
                baseToken.colorBgContainer = '#000000';
                break;
            case 'glass':
                baseToken.borderRadius = 20;
                baseToken.colorBgContainer = isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                baseToken.backdropFilter = 'blur(10px)';
                break;
        }
        return { token: baseToken, components };
    }, [primaryColor, themeStyle, fontSize, isDarkMode]);

    return (
        <ThemeContext.Provider value={{
            primaryColor, setPrimaryColor: handleSetPrimaryColor,
            themeStyle, setThemeStyle: handleSetThemeStyle,
            fontSize, setFontSize: handleSetFontSize,
            isCompact, setIsCompact: handleSetCompact,
            isDarkMode
        }}>
            <ConfigProvider
                theme={{
                    algorithm: algorithms,
                    ...themeConfig
                }}
            >
                <App style={{
                    minHeight: '100vh',
                    background: themeStyle === 'glass' ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : undefined,
                    transition: 'background 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)'
                }}>
                    {children}
                </App>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
}

