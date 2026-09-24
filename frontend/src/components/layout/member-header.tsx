'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { notificationApi } from '@/services/notification.service';
import { authApi } from '@/services/auth.service';
import {
  Dumbbell,
  Menu,
  X,
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

const NAV_LINK_CLASSES =
  'relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-[2px] after:origin-center after:rounded-full after:bg-neon after:transition-transform after:duration-300';

function navLinkClass(active: boolean) {
  return cn(
    NAV_LINK_CLASSES,
    active
      ? 'text-neon after:scale-x-100'
      : 'text-muted hover:text-chalk after:scale-x-0 hover:after:scale-x-100',
  );
}

export function MemberHeader() {
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
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="container-x">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/member" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-neon/40 bg-surface text-neon transition-colors group-hover:border-neon/70">
              <Dumbbell className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold uppercase leading-none tracking-wide text-chalk xl:text-xl">
              GYM<span className="text-neon">MASTER</span>
              <span className="ml-2 hidden rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold uppercase tracking-normal text-neon sm:inline-block">
                Member
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(pathname === item.href)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <Link href="/member/profile" className={navLinkClass(pathname === '/member/profile')}>
              <User className="h-4 w-4" />
              Hồ sơ
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Notification bell */}
            <Link
              href="/member/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon"
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
              {(notifData?.unreadCount || 0) > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
                  {notifData!.unreadCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-[10px] p-1.5 transition-colors hover:bg-ink"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                  {fullName.charAt(0)}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold leading-tight text-chalk">
                    {fullName}
                  </span>
                  <span className="block text-[10px] font-bold text-neon">{roleLabel}</span>
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-muted md:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-52 animate-fade-in rounded-xl border border-line bg-surface py-1.5 text-xs shadow-xl"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Link
                    href="/member/profile"
                    className="flex w-full items-center gap-2 px-3 py-2 text-chalk transition-colors hover:bg-ink"
                  >
                    <User className="h-3.5 w-3.5" />
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href="/member/notifications"
                    className="flex w-full items-center gap-2 px-3 py-2 text-chalk transition-colors hover:bg-ink"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Thông báo
                  </Link>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-danger transition-colors hover:bg-ink"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface text-chalk transition-colors hover:border-neon/50 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="animate-fade-in border-t border-line bg-ink lg:hidden">
          <nav className="container-x flex flex-col gap-1 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-neon/10 text-neon'
                    : 'text-muted hover:bg-surface hover:text-chalk',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/member/notifications"
              className={cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === '/member/notifications'
                  ? 'bg-neon/10 text-neon'
                  : 'text-muted hover:bg-surface hover:text-chalk',
              )}
            >
              <Bell className="h-4 w-4" />
              Thông báo
              {(notifData?.unreadCount || 0) > 0 && (
                <span className="ml-auto min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold text-white">
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
