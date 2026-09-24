'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Menu, X, Dumbbell, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Gói tập', href: '/packages' },
  { name: 'Huấn luyện viên', href: '/trainers' },
  { name: 'Lịch tập', href: '/schedule' },
  { name: 'Blog', href: '/blog' },
  { name: 'Liên hệ', href: '/contact' },
];

const SEARCH_INDEX = [
  { title: 'Trang chủ', href: '/', desc: 'Tổng quan GymMaster Pro' },
  { title: 'Gói tập & giá', href: '/packages', desc: 'Các gói hội viên hiện hành' },
  { title: 'Huấn luyện viên', href: '/trainers', desc: 'Đội ngũ PT chuyên nghiệp' },
  { title: 'Lịch tập & lớp học', href: '/schedule', desc: 'Thời khóa biểu tuần' },
  { title: 'Blog fitness', href: '/blog', desc: 'Bài viết tập luyện & dinh dưỡng' },
  { title: 'Về GymMaster', href: '/about', desc: 'Giới thiệu hệ thống phòng tập' },
  { title: 'Liên hệ', href: '/contact', desc: 'Địa chỉ, hotline, giờ mở cửa' },
  { title: 'Đăng nhập', href: '/login', desc: 'Đăng nhập tài khoản' },
  { title: 'Đăng ký hội viên', href: '/register', desc: 'Tạo tài khoản mới' },
];

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gym_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, [pathname]);

  // Đóng drawer khi đổi route
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Search overlay: Esc để đóng, focus input, chặn scroll nền
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX;
    return SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q),
    );
  }, [query]);

  const portalHref = user && ADMIN_ROLES.includes(user.role) ? '/admin' : '/member';

  const go = (href: string) => {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="container-x">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[68px]">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-neon/40 bg-surface text-neon transition-colors group-hover:border-neon/70">
              <Dumbbell size={18} />
            </span>
            <span className="font-display text-xl font-bold uppercase leading-none tracking-wide text-chalk">
              GYM<span className="text-neon">MASTER</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-3 py-2 text-[13.5px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-[2px] after:origin-center after:rounded-full after:bg-neon after:transition-transform after:duration-300',
                    active
                      ? 'text-neon after:scale-x-100'
                      : 'text-muted hover:text-chalk after:scale-x-0 hover:after:scale-x-100',
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon"
              aria-label="Tìm kiếm trang"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <Button variant="outline" size="sm" onClick={() => router.push(portalHref)}>
                  <Dumbbell className="h-3.5 w-3.5" />
                  Khu vực của tôi
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      Đăng ký
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface text-chalk lg:hidden"
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
        <div className="border-t border-line bg-ink animate-fade-in lg:hidden">
          <nav className="container-x flex flex-col gap-1 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-neon/10 text-neon'
                    : 'text-muted hover:bg-surface hover:text-chalk',
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-line pt-3">
              {user ? (
                <Button className="flex-1" onClick={() => router.push(portalHref)}>
                  Khu vực của tôi
                </Button>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full">Đăng ký</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[80] animate-fade-in">
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative mx-auto mt-24 w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-surface p-3 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-ink px-3">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) go(results[0].href);
                }}
                placeholder="Tìm trang, gói tập, bài viết..."
                className="h-11 w-full bg-transparent text-sm text-chalk outline-none placeholder:text-muted/70"
                aria-label="Tìm kiếm"
              />
              <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">
                ESC
              </kbd>
            </div>

            <div className="mt-2 max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Không tìm thấy trang phù hợp.
                </p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-ink"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-chalk">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-muted">{item.desc}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
