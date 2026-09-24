'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/providers/theme-provider';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { notificationApi } from '@/services/notification.service';
import { authApi } from '@/services/auth.service';
import {
  Flame,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  LayoutDashboard,
  CalendarDays,
  QrCode,
  Receipt,
  User,
  CreditCard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/member', icon: LayoutDashboard },
  { name: 'Gói tập của tôi', href: '/member/membership', icon: CreditCard },
  { name: 'Lịch tập', href: '/member/schedule', icon: CalendarDays },
  { name: 'Lịch sử check-in', href: '/member/checkins', icon: QrCode },
  { name: 'Thanh toán', href: '/member/payments', icon: Receipt },
  { name: 'Hồ sơ', href: '/member/profile', icon: User },
];

export function MemberHeader() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const { data: notifData } = useQuery({
    queryKey: ['member-notif-badge'],
    queryFn: notificationApi.getMyNotifications,
    refetchInterval: 60_000,
    retry: 0,
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    authApi.clearSession();
    router.push('/');
  };

  const fullName = me?.fullName || 'Hội viên';
  const roleLabel = me?.isTrainer ? 'HUẤN LUYỆN VIÊN' : 'HỘI VIÊN';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/member" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Flame className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <p className="font-black tracking-tight text-slate-900 dark:text-white text-base">
                GYM<span className="text-emerald-600 dark:text-emerald-400">MASTER</span>
                <span className="ml-1.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 align-middle">
                  Member
                </span>
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  pathname === item.href
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/member/profile"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                pathname === '/member/profile'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              <User className="w-4 h-4" />
              Hồ sơ
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notification bell */}
            <Link
              href="/member/notifications"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {(notifData?.unreadCount || 0) > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifData!.unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                  {fullName.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[140px] truncate">
                    {fullName}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{roleLabel}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Link
                    href="/member/profile"
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-3.5 h-3.5" />
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href="/member/notifications"
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Thông báo
                  </Link>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/member/notifications"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === '/member/notifications'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              <Bell className="w-4 h-4" />
              Thông báo
              {(notifData?.unreadCount || 0) > 0 && (
                <span className="ml-auto min-w-[18px] text-center px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {notifData!.unreadCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}