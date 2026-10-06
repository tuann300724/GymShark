import type { Metadata } from 'next';
import { Barlow_Condensed, Be_Vietnam_Pro } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/components/ui/toast';

const sans = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

const display = Barlow_Condensed({
  subsets: ['vietnamese', 'latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'GymMaster Pro - Hệ Thống Quản Lý Phòng Gym & Vận Hành',
  description:
    'Nền tảng quản lý hội viên, huấn luyện viên PT, điểm danh check-in và vận hành phòng tập gym chuyên nghiệp.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      {/* Chống chớp theme: đọc gym_theme trước khi React hydrate (mặc định dark). */}
      <Script
        id="gym-theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('gym_theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`,
        }}
      />
      <body className="min-h-screen bg-ink font-sans antialiased text-chalk">
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
