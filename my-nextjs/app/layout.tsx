// src/app/layout.tsx
import './globals.css';
import { Space_Grotesk } from 'next/font/google';
import I18nProvider from '@/lib/I18nProvider';
import ThemeProvider from '@/lib/ThemeProvider';
import AppLayout from '@/app/components/common/AppLayout';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { PermissionProvider } from '@/lib/PermissionProvider';
import NextTopLoader from 'nextjs-toploader';
import { NotificationProvider } from '@/lib/NotificationProvider';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin', 'vietnamese'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={spaceGrotesk.className}>
      <body>
        <AntdRegistry>
          <NextTopLoader color="#7f13ec" showSpinner={false} height={3} />
          <I18nProvider>
            <ThemeProvider>
              <PermissionProvider>
                <NotificationProvider>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </NotificationProvider>
              </PermissionProvider>
            </ThemeProvider>
          </I18nProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}