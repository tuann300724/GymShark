'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck, ChevronRight } from 'lucide-react';
import { notificationApi } from '@/services/notification.service';
import { NOTIFICATION_TYPE_META } from '@/lib/status';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface NotificationBellProps {
  /** Đường dẫn trang danh sách thông báo đầy đủ (định tuyến theo role) */
  notificationsHref: string;
  /** Query key riêng theo role để tránh dùng chung cache */
  queryKeyPrefix: string;
}

/**
 * Chuông thông báo dùng chung (member/trainer/admin) — dropdown + badge số chưa đọc.
 * Tự render mini list 5 mục, đánh dấu đã đọc khi bấm, tôn trọng dark/neon.
 */
export default function NotificationBell({
  notificationsHref,
  queryKeyPrefix,
}: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const unreadKey = [queryKeyPrefix, 'unread'];
  const miniKey = [queryKeyPrefix, 'mini'];

  const { data: unread } = useQuery({
    queryKey: unreadKey,
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 60_000,
    retry: 0,
  });

  const { data: items = [] } = useQuery({
    queryKey: miniKey,
    queryFn: () => notificationApi.getMineMini(5),
    refetchInterval: 120_000,
    retry: 0,
    enabled: open,
  });

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const badge = (unread?.count || 0) > 0;

  const handleItemClick = async (id: string, link?: string | null) => {
    setOpen(false);
    if (!link) return;
    try {
      await notificationApi.markRead(id);
      queryClient.invalidateQueries({ queryKey: unreadKey });
      queryClient.invalidateQueries({ queryKey: miniKey });
    } catch {
      // không chặn điều hướng
    }
    router.push(link);
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: unreadKey });
      queryClient.invalidateQueries({ queryKey: miniKey });
    } catch {
      // im lặng
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex size-9 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors',
          open ? 'border-neon/50 text-neon' : 'hover:border-neon/50 hover:text-neon',
        )}
        aria-label="Thông báo"
      >
        {badge ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {badge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
            {unread!.count > 99 ? '99+' : unread!.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] animate-fade-in overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <p className="text-xs font-bold text-chalk">
              Thông báo{' '}
              {badge && <span className="ml-1 text-neon">• {unread!.count} chưa đọc</span>}
            </p>
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-neon"
            >
              <CheckCheck className="size-3.5" /> Đánh dấu đã đọc
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-3.5 py-8 text-center">
                <Bell className="mx-auto mb-2 size-6 text-line" />
                <p className="text-xs text-muted">Chưa có thông báo nào</p>
              </div>
            ) : (
              items.map((n) => {
                const meta = NOTIFICATION_TYPE_META[n.type] || {
                  label: n.type,
                  variant: 'default' as const,
                };
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleItemClick(n.id, n.link)}
                    className={cn(
                      'block w-full border-b border-line/60 px-3.5 py-3 text-left transition-colors last:border-0 hover:bg-line/20',
                      !n.isRead && 'bg-neon/[0.03]',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-1 size-1.5 shrink-0 rounded-full',
                          n.isRead ? 'bg-line' : 'bg-neon',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-chalk">{n.title}</p>
                          {!n.isRead && (
                            <span className="shrink-0 rounded-sm bg-neon/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-neon">
                              {meta.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                          {n.content}
                        </p>
                        <p className="mt-1 text-[10px] text-line">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-line bg-ink/60 px-3.5 py-2.5 text-[11px] font-semibold text-muted transition-colors hover:text-neon"
          >
            Xem tất cả thông báo <ChevronRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
