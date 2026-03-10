'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * Tự động quét và nạp dữ liệu từ thư mục ../locales
 * Quy tắc: Các file kết thúc bằng vi.json sẽ gộp vào tiếng Việt, 
 *          Các file kết thúc bằng en.json sẽ gộp vào tiếng Anh.
 */
// Import thủ công các file locale vì require.context có thể không hoạt động ổn định trong Next.js App Router (đặc biệt khi dev/build)
import vi from '../locales/vi.json';
import en from '../locales/en.json';
import jp from '../locales/jp.json';
import zh from '../locales/zh.json';
import kr from '../locales/kr.json';
import fr from '../locales/fr.json';

import tourVi from '../locales/tour_vi.json';
import tourEn from '../locales/tour_en.json';
import tourJp from '../locales/tour_jp.json';
import tourZh from '../locales/tour_zh.json';
import tourKr from '../locales/tour_kr.json';
import tourFr from '../locales/tour_fr.json';

const resources: any = {
    vi: { translation: { ...vi, ...tourVi } },
    en: { translation: { ...en, ...tourEn } },
    jp: { translation: { ...jp, ...tourJp } },
    zh: { translation: { ...zh, ...tourZh } },
    kr: { translation: { ...kr, ...tourKr } },
    fr: { translation: { ...fr, ...tourFr } },
};

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