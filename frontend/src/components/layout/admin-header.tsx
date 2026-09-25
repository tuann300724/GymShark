'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { MobileNav } from './mobile-nav';
import { Bell, Search, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

export function AdminHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('gym_access_token');
    localStorage.removeItem('gym_user');
    router.push('/login');
  };

  const statusDot = isSuccess ? 'bg-neon' : isError ? 'bg-danger' : 'bg-amber-400 animate-pulse';
  const statusText = isSuccess ? 'API Connected' : isError ? 'API Disconnected' : 'Checking API...';

  return (
    <header className="h-16 px-4 md:px-6 border-b border-line bg-ink/85 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-sm bg-surface border border-line text-xs w-64 md:w-80">
          <Search className="size-3.5 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Tìm nhanh hội viên, số điện thoại, thẻ tập..."
            className="bg-transparent border-none outline-none w-full text-chalk placeholder:text-muted/70 min-w-0"
          />
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
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors bg-ink border-line"
        >
          <span className={`size-2 rounded-full ${statusDot}`} />
          <span className="text-muted">{statusText}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => router.push('/admin/notifications')}
          className="p-2 rounded-sm text-muted hover:bg-line/30 hover:text-chalk relative transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-neon" />
        </button>

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
