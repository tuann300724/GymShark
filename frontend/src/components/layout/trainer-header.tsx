'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { memberApi } from '@/services/member.service';
import { notificationApi } from '@/services/notification.service';
import { authApi } from '@/services/auth.service';
import NotificationBell from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Dumbbell,
  Menu,
  X,
  Bell,
  LayoutDashboard,
  CalendarDays,
  Users,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/trainer', icon: LayoutDashboard },
  { name: 'Lịch dạy', href: '/trainer/schedule', icon: CalendarDays },
  { name: 'Hội viên', href: '/trainer/members', icon: Users },
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

export function TrainerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['trainer-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const { data: notifData } = useQuery({
    queryKey: ['trainer-notif-badge'],
    queryFn: notificationApi.getUnreadCount,
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

  const fullName = me?.fullName || 'Huấn luyện viên';
  const roleLabel = 'HUẤN LUYỆN VIÊN';

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="container-x">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/trainer" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-sm border border-neon/40 bg-surface text-neon transition-colors group-hover:border-neon/70">
              <Dumbbell className="size-4" />
            </span>
            <span className="font-display text-lg font-bold uppercase leading-none tracking-wide text-chalk xl:text-xl">
              GYM<span className="text-neon">MASTER</span>
              <span className="ml-2 hidden rounded border border-neon/25 bg-neon/10 px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold uppercase tracking-normal text-neon sm:inline-block">
                Trainer
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(pathname === item.href)}
              >
                <item.icon className="size-4" />
                {item.name}
              </Link>
            ))}
            <Link href="/trainer/profile" className={navLinkClass(pathname === '/trainer/profile')}>
              <User className="size-4" />
              Hồ sơ
            </Link>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Notification bell */}
            <ThemeToggle />
            <NotificationBell notificationsHref="/trainer/notifications" queryKeyPrefix="trainer" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-sm p-1.5 transition-colors hover:bg-ink"
              >
                <span className="flex size-8 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                  {fullName.charAt(0)}
                </span>
                <span className="hidden text-left md:block">
                  <span className="block max-w-[140px] truncate text-xs font-semibold leading-tight text-chalk">
                    {fullName}
                  </span>
                  <span className="block text-[10px] font-bold text-neon">{roleLabel}</span>
                </span>
                <ChevronDown className="hidden size-3.5 text-muted md:block" />
              </button>

              {userMenuOpen && (
                <div
                  role="presentation"
                  className="absolute right-0 z-50 mt-2 w-52 animate-fade-in rounded-xl border border-line bg-surface py-1.5 text-xs shadow-xl"
                  onClick={() => setUserMenuOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setUserMenuOpen(false);
                  }}
                >
                  <Link
                    href="/trainer/profile"
                    className="flex w-full items-center gap-2 px-3 py-2 text-chalk transition-colors hover:bg-ink"
                  >
                    <User className="size-3.5" />
                    Hồ sơ của tôi
                  </Link>
                  <Link
                    href="/trainer/notifications"
                    className="flex w-full items-center gap-2 px-3 py-2 text-chalk transition-colors hover:bg-ink"
                  >
                    <Bell className="size-3.5" />
                    Thông báo
                  </Link>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-danger transition-colors hover:bg-ink"
                  >
                    <LogOut className="size-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex size-9 items-center justify-center rounded-sm border border-line bg-surface text-chalk transition-colors hover:border-neon/50 lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
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
                <item.icon className="size-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/trainer/profile"
              className={cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === '/trainer/profile'
                  ? 'bg-neon/10 text-neon'
                  : 'text-muted hover:bg-surface hover:text-chalk',
              )}
            >
              <User className="size-4" />
              Hồ sơ
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
