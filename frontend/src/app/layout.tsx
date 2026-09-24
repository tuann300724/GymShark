import type { Metadata } from 'next';
import { Barlow_Condensed, Be_Vietnam_Pro } from 'next/font/google';
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
    <html
      lang="vi"
      className={`dark ${sans.variable} ${display.variable}`}
      suppressHydrationWarning
    >
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
