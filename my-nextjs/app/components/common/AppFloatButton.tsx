'use client';

import React, { useState, useEffect } from 'react';
import {
    FloatButton,
    Space,
    Typography,
    Modal,
    Button,
    Slider,
    Drawer,
    Segmented,
    Divider,
    Card,
    Tooltip,
    App,
    Avatar
} from 'antd';
import {
    SettingOutlined,
    CheckOutlined,
    BgColorsOutlined,
    FormatPainterOutlined,
    LogoutOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeStyle } from '@/lib/ThemeProvider';
import { usePermission } from '@/lib/PermissionProvider';
import { logoutApi } from '@/services/authService';

const { Text, Title } = Typography;

export const AppFloatButton: React.FC = () => {
    const { modal } = App.useApp();
    const { t, i18n: i18nContext } = useTranslation();
    const { userName } = usePermission();
    const {
        primaryColor, setPrimaryColor,
        themeStyle, setThemeStyle,
        fontSize, setFontSize,
        isCompact, setIsCompact,
        isDarkMode
    } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState('vi');

    // Performance optimization: Local state for color picker to prevent massive re-renders
    const [localColor, setLocalColor] = useState(primaryColor);

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem('app_lang') || i18nContext.language || 'vi';
        setCurrentLang(savedLang.startsWith('vi') ? 'vi' : savedLang.startsWith('en') ? 'en' : 'vi');
    }, [i18nContext.language]);

    // Handle initial primaryColor sync
    useEffect(() => {
        setLocalColor(primaryColor);
    }, [primaryColor]);

    // Debounce the global color update
    useEffect(() => {
        if (localColor === primaryColor) return;

        const timer = setTimeout(() => {
            setPrimaryColor(localColor);
        }, 150); // 150ms delay for smooth response

        return () => clearTimeout(timer);
    }, [localColor, primaryColor, setPrimaryColor]);

    if (!mounted) return null;

    const themeColors = [
        { name: 'Sunrise', color: '#FAAD14' },
        { name: 'Sunset', color: '#F5222D' },
        { name: 'Volcano', color: '#FA541C' },
        { name: 'Teal', color: '#00b5ad' },
        { name: 'Cyan', color: '#13C2C2' },
        { name: 'Daybreak', color: '#1890FF' },
        { name: 'Geek Blue', color: '#2F54EB' },
        { name: 'Golden Purple', color: '#722ED1' },
    ];

    const themeStyles: { key: ThemeStyle, label: string, desc: string }[] = [
        { key: 'default', label: 'Ant Design', desc: 'Standard look' },
        { key: 'dark', label: 'Dark Mode', desc: 'Modern & Deep' },
        { key: 'glass', label: 'Glassmorphism', desc: 'Blur & Gradient' },
        { key: 'shadcn', label: 'Minimalist', desc: 'Flat & Clean' },
        { key: 'mui', label: 'Material', desc: 'Rounded & Soft' },
        { key: 'cartoon', label: 'Cartoon', desc: 'Bold & Playful' },
        { key: 'geek', label: 'Terminal', desc: 'Monospace Tech' },
    ];

    const languages = [
        { key: 'vi', label: 'Tiếng Việt', native: 'Tiếng Việt', flag: '🇻🇳' },
        { key: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
        { key: 'jp', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
        { key: 'kr', label: 'Korean', native: '한국어', flag: '🇰🇷' },
        { key: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
        { key: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
    ];

    const handleLogout = () => {
        modal.confirm({
            title: t('logout_confirm_title'),
            content: t('logout_confirm_message'),
            okText: t('logout'),
            cancelText: t('cancel'),
            okButtonProps: { danger: true },
            onOk: () => logoutApi(),
        });
    };

    const handleLanguageChange = (lang: string) => {
        i18nContext.changeLanguage(lang);
        setCurrentLang(lang);
        localStorage.setItem('app_lang', lang);
    };

    return (
        <>
            <FloatButton.Group
                trigger="click"
                type="primary"
                icon={<SettingOutlined />}
                style={{ right: 24, bottom: 24 }}
            >
                <FloatButton
                    icon={<FormatPainterOutlined />}
                    tooltip="Design Center"
                    onClick={() => setDrawerOpen(true)}
                />
                <FloatButton
                    icon={<LogoutOutlined style={{ color: '#ff4d4f' }} />}
                    tooltip={t('logout')}
                    onClick={handleLogout}
                />
                <FloatButton.BackTop visibilityHeight={400} />
            </FloatButton.Group>

            <Drawer
                title={
                    <Space>
                        <FormatPainterOutlined style={{ color: primaryColor }} />
                        <span>Design Center</span>
                    </Space>
                }
                placement="right"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                size="default"
            >
                <div className="flex flex-col gap-8 pb-8">
                    {/* ALGORITHM SECTION */}
                    <section>
                        <Title level={5} className="mb-4">System Algorithm</Title>
                        <Segmented
                            block
                            value={isDarkMode ? 'dark' : 'light'}
                            onChange={(val) => setThemeStyle(val === 'dark' ? 'dark' : 'default')}
                            options={[
                                { label: 'Light', value: 'light', icon: <BgColorsOutlined /> },
                                { label: 'Dark', value: 'dark', icon: <FormatPainterOutlined /> },
                            ]}
                        />
                        <div className="mt-4 flex justify-between items-center bg-gray-50 dark:bg-zinc-900 p-3 rounded-lg border border-dashed">
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>Compact Mode</span>
                            <Button
                                type={isCompact ? 'primary' : 'default'}
                                size="small"
                                onClick={() => setIsCompact(!isCompact)}
                                style={{ marginLeft: '12px' }}
                            >
                                {isCompact ? 'Enabled' : 'Disabled'}
                            </Button>
                        </div>
                    </section>

                    {/* LANGUAGE SECTION */}
                    <section>
                        <Title level={5} className="mb-4 flex items-center gap-2">
                            <GlobalOutlined style={{ color: primaryColor }} />
                            <span>Language</span>
                        </Title>
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map(lang => (
                                <Card
                                    key={lang.key}
                                    size="small"
                                    hoverable
                                    className={`transition-all border ${currentLang === lang.key ? 'shadow-sm' : 'border-gray-100 dark:border-zinc-800'}`}
                                    style={{
                                        borderColor: currentLang === lang.key ? primaryColor : undefined,
                                        backgroundColor: currentLang === lang.key ? (isDarkMode ? `${primaryColor}15` : `${primaryColor}05`) : undefined
                                    }}
                                    onClick={() => handleLanguageChange(lang.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-[12px] truncate" style={{ color: currentLang === lang.key ? primaryColor : undefined }}>{lang.label}</div>
                                            <div className="text-[10px] text-gray-400 truncate">{lang.native}</div>
                                        </div>
                                        {currentLang === lang.key && <CheckOutlined style={{ color: primaryColor, marginLeft: 'auto', fontSize: '10px' }} />}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* PRIMARY COLOR */}
                    <section>
                        <Title level={5} className="mb-4">Primary Color</Title>
                        <div className="grid grid-cols-4 gap-3">
                            {themeColors.map(c => (
                                <Tooltip title={c.name} key={c.name}>
                                    <div
                                        onClick={() => setPrimaryColor(c.color)}
                                        className="h-8 rounded-md cursor-pointer transition-all flex items-center justify-center hover:scale-110 active:scale-95 border border-white dark:border-zinc-800 shadow-sm"
                                        style={{ backgroundColor: c.color }}
                                    >
                                        {primaryColor === c.color && <CheckOutlined style={{ color: '#fff', fontSize: '10px' }} />}
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Text type="secondary" style={{ fontSize: '12px' }}>Pick Custom Color (Smooth Delay)</Text>
                            <input
                                type="color"
                                value={localColor}
                                onChange={(e) => setLocalColor(e.target.value)}
                                className="w-full h-8 mt-1 border-0 cursor-pointer p-0 rounded-md overflow-hidden"
                            />
                        </div>
                    </section>

                    {/* PRESET STYLES */}
                    <section>
                        <Title level={5} className="mb-4">Visual Presets</Title>
                        <div className="flex flex-col gap-2">
                            {themeStyles.map(s => (
                                <Card
                                    key={s.key}
                                    size="small"
                                    hoverable
                                    className={`transition-all ${themeStyle === s.key ? 'border-primary shadow-md ring-1 ring-primary' : 'border-gray-100 dark:border-zinc-800'}`}
                                    style={{ borderColor: themeStyle === s.key ? primaryColor : undefined }}
                                    onClick={() => setThemeStyle(s.key)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-[13px]">{s.label}</div>
                                            <div className="text-[11px] text-gray-400">{s.desc}</div>
                                        </div>
                                        {themeStyle === s.key && <CheckOutlined style={{ color: primaryColor }} />}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* FONT SIZE */}
                    <section>
                        <div className="flex justify-between items-center mb-2">
                            <Title level={5} className="m-0">Global Text Size</Title>
                            <Text strong style={{ color: primaryColor }}>{fontSize}px</Text>
                        </div>
                        <Slider
                            min={12}
                            max={20}
                            value={fontSize}
                            onChange={(v) => setFontSize(v)}
                            tooltip={{ open: false }}
                        />
                    </section>

                    <Divider />

                    <div className="text-center text-[11px] text-gray-400 italic">
                        Inspired by Ant Design Premium Component Suite
                    </div>
                </div>
            </Drawer>
        </>
    );
};
