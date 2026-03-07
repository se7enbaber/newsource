'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * Tự động quét và nạp dữ liệu từ thư mục ../locales
 * Quy tắc: Các file kết thúc bằng vi.json sẽ gộp vào tiếng Việt, 
 *          Các file kết thúc bằng en.json sẽ gộp vào tiếng Anh.
 */
const resources: any = {};

try {
    // @ts-ignore: require.context là tính năng của Webpack hỗ trợ quét file động
    const localesContext = require.context('../locales', false, /\.json$/);
    
    localesContext.keys().forEach((fileName: string) => {
        const content = localesContext(fileName);
        // Lấy mã ngôn ngữ từ cuối tên file: [prefix]_[lang].json hoặc [lang].json
        const match = fileName.match(/([a-z]{2})\.json$/);
        if (match) {
            const langCode = match[1];
            if (!resources[langCode]) {
                resources[langCode] = { translation: {} };
            }
            Object.assign(resources[langCode].translation, content);
        }
    });
} catch (error) {
    console.warn('I18n: Không thể tự động quét thư mục locales.', error);
}

// Đảm bảo các ngôn ngữ mặc định luôn tồn tại
if (!resources.vi) resources.vi = { translation: {} };
if (!resources.en) resources.en = { translation: {} };

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'vi',
        supportedLngs: ['en', 'vi', 'jp', 'zh', 'kr', 'fr'],
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag'],
            caches: ['localStorage'],
        },
    });

export default i18n;