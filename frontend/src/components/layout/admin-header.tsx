'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { MobileNav } from './mobile-nav';
import NotificationBell from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Search,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tìm nhanh hội viên
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query.trim());
      setActiveIndex(-1);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const stored = localStorage.getItem('gym_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!showUserMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showUserMenu]);

  // Đóng kết quả tìm kiếm khi click ra ngoài
  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [searchOpen]);

  // Health check query to backend
  const {
    data: health,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ['backend-health'],
    queryFn: async () => {
      const res = await apiClient.get('/health');
      return res.data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Tìm nhanh hội viên theo tên / SĐT / mã (backend không phân biệt hoa thường và dấu)
  const trimmed = debounced.trim();
  const { data: searchData, isFetching: searchFetching } = useQuery({
    queryKey: ['admin-header-member-search', trimmed],
    queryFn: async () => {
      const res = await apiClient.get('/members', {
        params: { search: trimmed, limit: 6 },
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
    retry: 0,
  });
  const results: any[] = trimmed.length >= 2 ? (searchData?.data ?? []) : [];

  const selectMember = (member: any) => {
    setSearchOpen(false);
    setQuery('');
    setActiveIndex(-1);
    router.push(`/admin/members/${member.id}`);
  };

  const goToList = () => {
    setSearchOpen(false);
    router.push(`/admin/members?search=${encodeURIComponent(trimmed)}`);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchOpen(true);
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : -1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) selectMember(results[activeIndex]);
      else if (trimmed.length >= 1) goToList();
      return;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gym_access_token');
    localStorage.removeItem('gym_user');
    router.push('/login');
  };

  const statusDot = isSuccess ? 'bg-neon' : isError ? 'bg-danger' : 'bg-muted animate-pulse';
  const statusText = isSuccess
    ? 'Đã kết nối API'
    : isError
      ? 'Mất kết nối API'
      : 'Đang kiểm tra kết nối...';

  return (
    <header className="h-16 px-4 md:px-6 border-b border-line bg-ink/85 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="relative hidden sm:block w-64 md:w-80" ref={searchRef}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm bg-surface border border-line text-xs focus-within:border-neon/60">
            <Search className="size-3.5 text-muted shrink-0" />
            <input
              type="text"
              value={query}
              role="combobox"
              aria-expanded={searchOpen}
              aria-controls="admin-quick-search-listbox"
              aria-label="Tìm nhanh hội viên"
              placeholder="Tìm nhanh hội viên, số điện thoại, thẻ tập..."
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={onSearchKeyDown}
              className="bg-transparent border-none outline-none w-full text-chalk placeholder:text-muted/70 min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Xoá nội dung tìm kiếm"
                className="shrink-0 rounded-full p-0.5 text-muted hover:text-chalk transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {searchOpen && (
            <div
              id="admin-quick-search-listbox"
              role="listbox"
              aria-label="Kết quả tìm kiếm hội viên"
              className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
            >
              {trimmed.length < 2 ? (
                <p className="px-4 py-3 text-xs text-muted">
                  Nhập ít nhất 2 ký tự để tìm theo tên, SĐT hoặc mã hội viên…
                </p>
              ) : searchFetching && results.length === 0 ? (
                <p className="flex items-center gap-2 px-4 py-3 text-xs text-muted">
                  <Loader2 className="size-3.5 animate-spin" /> Đang tìm…
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted">
                  Không tìm thấy hội viên khớp &ldquo;{trimmed}&rdquo;.
                </p>
              ) : (
                <>
                  <ul className="max-h-80 overflow-y-auto py-1.5">
                    {results.map((m, i) => (
                      <li key={m.id} role="option" aria-selected={i === activeIndex}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => selectMember(m)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                            i === activeIndex ? 'bg-ink' : ''
                          }`}
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-ink text-xs font-bold uppercase text-neon">
                            {m.fullName?.charAt(0) || '?'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-chalk">
                              {m.fullName}
                            </span>
                            <span className="block truncate text-[11px] text-muted">
                              {m.code} · {m.phone || 'Chưa có SĐT'}
                            </span>
                          </span>
                          {m.memberships?.[0]?.package?.name && (
                            <span className="max-w-28 shrink-0 truncate rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">
                              {m.memberships[0].package.name}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={goToList}
                    className="flex w-full items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-xs font-medium text-muted transition-colors hover:bg-ink hover:text-chalk"
                  >
                    Xem tất cả kết quả cho &ldquo;{trimmed}&rdquo;
                    <ArrowRight className="size-3.5 shrink-0" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Backend Connection Status + Notifications + User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Status indicator */}
        <div
          title={
            isSuccess
              ? `Backend kết nối thành công: ${health?.service}`
              : isError
                ? 'Không kết nối được với Backend'
                : 'Đang kiểm tra kết nối Backend...'
          }
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors bg-ink border-line shrink-0"
        >
          <span className={`size-2 rounded-full shrink-0 ${statusDot}`} />
          <span className={isError ? 'text-danger' : 'text-muted'}>{statusText}</span>
        </div>

        {/* Notification Bell */}
        <ThemeToggle />
        <NotificationBell notificationsHref="/admin/notifications" queryKeyPrefix="admin" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-sm hover:bg-line/30 transition-colors"
          >
            <div className="size-8 rounded-full bg-surface border border-neon/40 text-neon flex items-center justify-center font-bold text-xs uppercase">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-chalk leading-tight">
                {user?.fullName || 'Quản trị viên'}
              </p>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-neon">
                <ShieldCheck className="size-3" />
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div
              role="presentation"
              className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-line shadow-xl py-1.5 z-50 text-xs animate-fade-in"
              onClick={() => setShowUserMenu(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowUserMenu(false);
              }}
            >
              <div className="px-3 py-2 border-b border-line">
                <p className="font-semibold text-chalk">{user?.fullName || 'Quản trị viên'}</p>
                <p className="text-[11px] text-muted truncate">{user?.email || 'admin@gym.com'}</p>
              </div>
              <button
                onClick={() => router.push('/admin/settings')}
                className="w-full flex items-center gap-2 px-3 py-2 text-muted hover:bg-ink hover:text-chalk transition-colors"
              >
                <UserIcon className="size-3.5" />
                Hồ sơ & Tài khoản
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="size-3.5" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
