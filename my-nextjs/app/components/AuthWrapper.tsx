'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { isTokenExpired } from '@/lib/auth-utils';

/**
 * AuthWrapper kiểm tra token ngay trên client.
 *
 * Hydration-safe: state khởi tạo đồng nhất giữa Server (SSR) và Client.
 * - Server render: isChecking = true → spinner (hoặc null ở /login)
 * - Client hydrate: isChecking = true → khớp, không có mismatch
 * - useEffect chạy sau hydration → đọc localStorage → điều phối route
 *
 * Dùng router.replace() thay vì router.push() để không tích lũy history entry.
 */
export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    // PHẢI khởi tạo là true để đồng nhất server/client (tránh hydration mismatch).
    // Không được đọc localStorage trong render phase.
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // useEffect chỉ chạy trên client → an toàn để đọc localStorage
        const token = localStorage.getItem('access_token');
        const expired = token ? isTokenExpired(token) : true;

        if (expired && !isLoginPage) {
            // Token không có hoặc đã hết hạn, và không ở trang login → về trang login ngay lập tức
            if (token) {
                // Tiện tay xóa luôn các token cũ
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
            }
            router.replace('/login');
        } else if (!expired && isLoginPage) {
            // Đã có token hợp lệ mà vào trang /login → đẩy vào app
            router.replace('/products');
        } else if (expired && isLoginPage) {
            // Token hết hạn và đang ở trang login → giữ nguyên để đăng nhập
            setIsChecking(false);
        } else {
            // Hợp lệ → cho phép render
            setIsChecking(false);
        }
    }, [pathname, router, isLoginPage]);

    // Trang /login không cần spinner (nó tự render ngay)
    if (isChecking && !isLoginPage) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return <>{children}</>;
}