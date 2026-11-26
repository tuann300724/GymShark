'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { MobileNav } from './mobile-nav';
import NotificationBell from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Dialog } from '@/components/ui/dialog';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { memberApi } from '@/services/member.service';
import { getVisibleAdminItems, navigationSections } from './admin-sidebar';
import { isPartnerRole } from '@/lib/auth';
import { cn, formatCurrency } from '@/lib/utils';
import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL, TRAINER_STATUS_META } from '@/lib/status';
import {
  Search,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  ArrowRight,
  Loader2,
  X,
  Compass,
  Users,
  UserCheck,
  Receipt,
  UserCog,
  ChevronRight,
  KeyRound,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tìm nhanh trong khu vực quản trị — kết quả gom nhóm + lọc theo nhóm
// ---------------------------------------------------------------------------

type SearchFilter = 'all' | 'nav' | 'members' | 'trainers' | 'payments' | 'staff';

const FILTERS: { key: SearchFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'nav', label: 'Điều hướng' },
  { key: 'members', label: 'Hội viên' },
  { key: 'trainers', label: 'HLV' },
  { key: 'payments', label: 'Thanh toán' },
  { key: 'staff', label: 'Nhân viên' },
];

/** Trang danh sách tương ứng mỗi nhóm (đọc ?search= ở trang đích) */
const LIST_HREFS: Record<string, string> = {
  members: '/admin/members',
  trainers: '/admin/trainers',
  payments: '/admin/payments',
  staff: '/admin/staff',
};

const KBD_CLASS =
  'inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-line bg-ink px-1 text-[10px] font-semibold text-muted';

type SearchItem = {
  key: string;
  href: string;
  title: string;
  badge?: string;
  meta: string;
  tag?: string;
  icon?: React.ElementType;
  initial?: string;
};

type SearchSection = {
  key: Exclude<SearchFilter, 'all'>;
  label: string;
  icon: React.ElementType;
  count: number;
  items: SearchItem[];
};

/** Bỏ dấu + lowercase để tìm không phân biệt hoa/thường/dấu */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export function AdminHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const { success: showSuccess, error: showError } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);

  // Tìm nhanh trong admin
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>('all');
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

  // Đổi nhóm lọc → bỏ chọn dòng đang highlight
  useEffect(() => {
    setActiveIndex(-1);
  }, [filter]);

  // Cuộn tới dòng đang chọn bằng phím
  useEffect(() => {
    if (!searchOpen || activeIndex < 0) return;
    const el = searchRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, searchOpen]);

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

  const role: string = user?.role || '';
  const isPartner = isPartnerRole(role);
  const canSeeStaff = !isPartner && (role === 'ADMIN' || role === 'MANAGER');

  // Danh mục điều hướng (đồng bộ sidebar; ẩn mục STAFF không được xem)
  const navItems = useMemo(
    () =>
      navigationSections.flatMap((section) =>
        getVisibleAdminItems(section, role).map((item) => ({
          name: item.name,
          href: item.href,
          icon: item.icon,
          section: section.title,
        })),
      ),
    [role],
  );

  const trimmed = debounced.trim();
  const ready = trimmed.length >= 2;
  const wants = (key: SearchFilter) =>
    (key === 'nav' || !isPartner) && (filter === 'all' || filter === key);

  // 4 nhóm dữ liệu tìm từ backend — chỉ gọi nhóm đang được chọn
  const { data: memberData, isFetching: memberFetching } = useQuery({
    queryKey: ['admin-header-search-members', trimmed],
    queryFn: async () => {
      const res = await apiClient.get('/members', {
        params: { search: trimmed, limit: 5 },
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: ready && wants('members'),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: trainerData, isFetching: trainerFetching } = useQuery({
    queryKey: ['admin-header-search-trainers', trimmed],
    queryFn: async () => {
      const res = await apiClient.get('/trainers', {
        params: { search: trimmed, limit: 4 },
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: ready && wants('trainers'),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: paymentData, isFetching: paymentFetching } = useQuery({
    queryKey: ['admin-header-search-payments', trimmed],
    queryFn: async () => {
      const res = await apiClient.get('/payments', {
        params: { search: trimmed, limit: 4 },
      });
      return res.data as { data: any[]; total: number };
    },
    enabled: ready && wants('payments'),
    staleTime: 30_000,
    retry: 0,
  });

  // /users/staff chỉ trả về mảng và yêu cầu vai trò ADMIN/MANAGER
  const { data: staffData, isFetching: staffFetching } = useQuery({
    queryKey: ['admin-header-search-staff', trimmed],
    queryFn: async () => {
      const res = await apiClient.get('/users/staff', {
        params: { search: trimmed },
      });
      return res.data as any[];
    },
    enabled: ready && wants('staff') && canSeeStaff,
    staleTime: 30_000,
    retry: 0,
  });

  // Gom kết quả thành các nhóm (thứ tự hiển thị)
  const q = normalize(trimmed);
  const sections: SearchSection[] = [];

  if (ready && wants('nav')) {
    const matched = navItems.filter((item) =>
      normalize(`${item.name} ${item.section}`).includes(q),
    );
    if (matched.length > 0) {
      // Trang khớp trực tiếp theo tên xếp trước trang chỉ khớp qua tên nhóm
      const ranked = [...matched].sort(
        (a, b) => Number(normalize(b.name).includes(q)) - Number(normalize(a.name).includes(q)),
      );
      const shown = ranked.slice(0, filter === 'nav' ? 10 : 6);
      sections.push({
        key: 'nav',
        label: 'Điều hướng nhanh',
        icon: Compass,
        count: matched.length,
        items: shown.map((item) => ({
          key: `nav:${item.href}`,
          href: item.href,
          title: item.name,
          meta: item.section,
          icon: item.icon,
        })),
      });
    }
  }

  if (ready && wants('members') && (memberData?.data?.length ?? 0) > 0) {
    sections.push({
      key: 'members',
      label: 'Hội viên',
      icon: Users,
      count: memberData?.total ?? 0,
      items: (memberData?.data ?? []).map((m: any) => ({
        key: `member:${m.id}`,
        href: `/admin/members/${m.id}`,
        title: m.fullName || 'Hội viên chưa đặt tên',
        badge: m.code,
        meta: [m.phone || 'Chưa có SĐT', m.email].filter(Boolean).join(' · '),
        tag: m.memberships?.[0]?.package?.name,
        initial: (m.fullName || '?').charAt(0).toUpperCase(),
      })),
    });
  }

  if (ready && wants('trainers') && (trainerData?.data?.length ?? 0) > 0) {
    sections.push({
      key: 'trainers',
      label: 'Huấn luyện viên',
      icon: UserCheck,
      count: trainerData?.total ?? 0,
      items: (trainerData?.data ?? []).map((t: any) => ({
        key: `trainer:${t.id}`,
        href: `/admin/trainers/${t.id}`,
        title: t.user?.fullName || 'Huấn luyện viên',
        badge: t.specialization || undefined,
        meta: [t.user?.phone, t.user?.email].filter(Boolean).join(' · ') || 'Chưa có liên hệ',
        tag: TRAINER_STATUS_META[t.status]?.label,
        initial: (t.user?.fullName || 'H').charAt(0).toUpperCase(),
      })),
    });
  }

  if (ready && wants('payments') && (paymentData?.data?.length ?? 0) > 0) {
    sections.push({
      key: 'payments',
      label: 'Thanh toán',
      icon: Receipt,
      count: paymentData?.total ?? 0,
      items: (paymentData?.data ?? []).map((p: any) => ({
        key: `payment:${p.id}`,
        href: `/admin/payments/${p.id}`,
        title: p.member?.fullName || p.code,
        badge: p.code,
        meta: `${formatCurrency(p.amount)} · ${PAYMENT_STATUS_META[p.status]?.label || p.status}`,
        tag: PAYMENT_METHOD_LABEL[p.method] || p.method,
        icon: Receipt,
      })),
    });
  }

  if (ready && canSeeStaff && wants('staff') && (staffData?.length ?? 0) > 0) {
    sections.push({
      key: 'staff',
      label: 'Nhân viên',
      icon: UserCog,
      count: staffData?.length ?? 0,
      items: (staffData ?? []).slice(0, 5).map((s: any) => ({
        key: `staff:${s.id}`,
        href: `/admin/staff?search=${encodeURIComponent(s.email)}`,
        title: s.fullName || 'Nhân viên',
        badge: s.phone || undefined,
        meta: s.email,
        tag: s.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa',
        initial: (s.fullName || 'N').charAt(0).toUpperCase(),
      })),
    });
  }

  // Danh sách phẳng để điều hướng bằng phím ↑ ↓
  const flatItems: SearchItem[] = [];
  const startIndexes: Record<string, number> = {};
  for (const section of sections) {
    startIndexes[section.key] = flatItems.length;
    flatItems.push(...section.items);
  }
  const totalResults = sections.reduce((sum, section) => sum + section.count, 0);
  const anyFetching = memberFetching || trainerFetching || paymentFetching || staffFetching;

  // Nút "Xem tất cả" → trang danh sách tương ứng nhóm đang lọc (?search=)
  const listKey = filter === 'all' ? 'members' : filter;
  const listHref = LIST_HREFS[listKey];
  const viewAll =
    ready && listHref && sections.some((s) => s.key === listKey)
      ? {
          href: `${listHref}?search=${encodeURIComponent(trimmed)}`,
          label:
            listKey === 'members'
              ? `Xem tất cả kết quả hội viên cho “${trimmed}”`
              : `Xem tất cả kết quả cho “${trimmed}”`,
        }
      : null;

  const goTo = (href: string) => {
    setSearchOpen(false);
    setQuery('');
    setActiveIndex(-1);
    router.push(href);
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
      setActiveIndex((i) => (flatItems.length ? (i + 1) % flatItems.length : -1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (flatItems.length ? (i <= 0 ? flatItems.length - 1 : i - 1) : -1));
      return;
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && flatItems[activeIndex]) goTo(flatItems[activeIndex].href);
      else if (viewAll) goTo(viewAll.href);
      else if (flatItems.length) goTo(flatItems[0].href);
      return;
    }
  };

  const renderItem = (item: SearchItem, index: number) => {
    const active = index === activeIndex;
    const ItemIcon = item.icon;
    return (
      <button
        key={item.key}
        type="button"
        role="option"
        aria-selected={active}
        data-active={active}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => goTo(item.href)}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-[10px] border px-2 py-1.5 text-left transition-colors',
          active ? 'border-neon/40 bg-neon/10' : 'border-transparent hover:bg-ink/60',
        )}
      >
        {ItemIcon ? (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-[10px] border bg-ink transition-colors',
              active ? 'border-neon/40 text-neon' : 'border-line text-muted group-hover:text-chalk',
            )}
          >
            <ItemIcon className="size-4" aria-hidden />
          </span>
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-ink text-xs font-bold uppercase text-neon">
            {item.initial || '?'}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-chalk">{item.title}</span>
            {item.badge && (
              <span className="max-w-28 shrink-0 truncate rounded border border-line bg-ink px-1.5 py-px text-[10px] font-semibold text-neon/90">
                {item.badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-muted">{item.meta}</span>
        </span>

        {item.tag && (
          <span className="hidden max-w-28 shrink-0 truncate rounded-full border border-line px-2 py-0.5 text-[10px] text-muted sm:block">
            {item.tag}
          </span>
        )}
        <ChevronRight
          className={cn('size-3.5 shrink-0 transition-colors', active ? 'text-neon' : 'text-muted')}
          aria-hidden
        />
      </button>
    );
  };

  const handleLogout = () => {
    queryClient.clear(); // xoá cache phiên để tài khoản tiếp theo không thấy dữ liệu cũ
    localStorage.removeItem('gym_access_token');
    localStorage.removeItem('gym_user');
    router.push('/login');
  };

  const submitPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      await memberApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
      showSuccess('Đã đổi mật khẩu thành công.');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      showError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setChangingPassword(false);
    }
  };

  const statusDot = isSuccess ? 'bg-neon' : isError ? 'bg-danger' : 'bg-muted animate-pulse';
  const statusText = isSuccess
    ? 'Đã kết nối API'
    : isError
      ? 'Mất kết nối API'
      : 'Đang kiểm tra kết nối...';

  const visibleFilters = isPartner
    ? FILTERS.filter((f) => f.key === 'all' || f.key === 'nav')
    : FILTERS.filter((f) => f.key !== 'staff' || canSeeStaff);

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
              aria-label="Tìm nhanh trong khu vực quản trị"
              placeholder="Tìm hội viên, HLV, giao dịch, trang..."
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
            <div className="absolute left-0 top-full z-50 mt-2 w-[22rem] md:w-[34rem] overflow-hidden rounded-xl border border-line bg-surface shadow-xl animate-fade-in">
              {/* Lọc theo nhóm */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line px-3 py-2">
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Lọc:
                </span>
                {visibleFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                      filter === f.key
                        ? 'border-neon/50 bg-neon/10 text-neon'
                        : 'border-line text-muted hover:border-neon/30 hover:text-chalk',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Kết quả gom nhóm */}
              <div
                id="admin-quick-search-listbox"
                role="listbox"
                aria-label="Kết quả tìm kiếm"
                className="max-h-80 overflow-y-auto py-1.5"
              >
                {!ready ? (
                  <p className="px-4 py-3 text-xs text-muted">
                    Nhập ít nhất 2 ký tự để tìm hội viên, huấn luyện viên, giao dịch hoặc trang quản
                    trị…
                  </p>
                ) : sections.length === 0 ? (
                  <p className="flex items-center gap-2 px-4 py-3 text-xs text-muted">
                    {anyFetching ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Đang tìm…
                      </>
                    ) : (
                      <>Không tìm thấy kết quả nào cho &ldquo;{trimmed}&rdquo;.</>
                    )}
                  </p>
                ) : (
                  sections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <div key={section.key} className="mb-1 last:mb-0">
                        <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-1.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                            <SectionIcon className="size-3.5 text-neon" aria-hidden />
                            {section.label}
                          </span>
                          <span className="shrink-0 rounded-full border border-line px-1.5 py-px text-[10px] font-bold text-muted">
                            {section.count}
                          </span>
                        </div>
                        {section.key === 'nav' ? (
                          <div className="grid grid-cols-1 gap-1 px-2 md:grid-cols-2">
                            {section.items.map((item, i) =>
                              renderItem(item, startIndexes[section.key] + i),
                            )}
                          </div>
                        ) : (
                          <ul className="px-1.5">
                            {section.items.map((item, i) => (
                              <li key={item.key} role="none">
                                {renderItem(item, startIndexes[section.key] + i)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Xem tất cả kết quả ở trang danh sách */}
              {viewAll && (
                <button
                  type="button"
                  onClick={() => goTo(viewAll.href)}
                  className="flex w-full items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-xs font-medium text-muted transition-colors hover:bg-ink hover:text-chalk"
                >
                  <span className="truncate">{viewAll.label}</span>
                  <ArrowRight className="size-3.5 shrink-0" />
                </button>
              )}

              {/* Footer: phím tắt + tổng số kết quả */}
              {ready && (
                <div className="flex items-center justify-between gap-2 border-t border-line bg-ink/40 px-3 py-2 text-[10px] text-muted">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <kbd className={KBD_CLASS}>↑↓</kbd> Chọn
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className={KBD_CLASS}>Enter</kbd> Mở
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className={KBD_CLASS}>Esc</kbd> Đóng
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-chalk">{totalResults} kết quả</span>
                </div>
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
              {user?.role === 'PARTNER' && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswordDialog(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-muted hover:bg-ink hover:text-chalk transition-colors"
                >
                  <KeyRound className="size-3.5" />
                  Đổi mật khẩu
                </button>
              )}
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
      {showPasswordDialog &&
        typeof document !== 'undefined' &&
        createPortal(
          <Dialog
            open={showPasswordDialog}
            onClose={() => !changingPassword && setShowPasswordDialog(false)}
            title="Đổi mật khẩu"
            description="Nhập mật khẩu hiện tại, sau đó đặt mật khẩu mới cho tài khoản đối tác."
          >
            <form onSubmit={submitPasswordChange} className="space-y-4">
              <PasswordInput
                label="Mật khẩu hiện tại"
                name="currentPassword"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <PasswordInput
                label="Mật khẩu mới"
                name="newPassword"
                autoComplete="new-password"
                minLength={6}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
              <PasswordInput
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  disabled={changingPassword}
                  onClick={() => setShowPasswordDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" isLoading={changingPassword} disabled={changingPassword}>
                  <KeyRound className="size-4" /> Đổi mật khẩu
                </Button>
              </div>
            </form>
          </Dialog>,
          document.body,
        )}
    </header>
  );
}
