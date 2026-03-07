'use client';

import { Layout } from 'antd';
import Navbar from '@/app/components/Navbar';
import AppHeader from './AppHeader';
import { usePathname } from 'next/navigation';
import { AppFloatButton } from './AppFloatButton';
import AuthWrapper from '../AuthWrapper';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <AuthWrapper>
            <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
                {/* 1. Chỉ hiển thị Navbar nếu KHÔNG PHẢI trang login */}
                {!isLoginPage && <Navbar />}

                <Layout style={{
                    transition: 'all 0.2s',
                    background: '#f8fafc'
                }}>
                    {!isLoginPage && <AppHeader />}
                    <main style={{ padding: isLoginPage ? 0 : '0 24px 40px', minHeight: 'calc(100vh - 120px)' }}>
                        {children}
                        <AppFloatButton />
                    </main>
                </Layout>
            </Layout>
        </AuthWrapper>
    );
}
