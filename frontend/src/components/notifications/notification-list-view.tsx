'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notification.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, formatDateTime } from '@/lib/utils';
import { NOTIFICATION_TYPE_META } from '@/lib/status';
import {
  Bell,
  BellOff,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Flame,
  Mail,
  Megaphone,
  Package,
  QrCode,
  Trash2,
} from 'lucide-react';

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  PAYMENT: { icon: <CreditCard className="size-4" />, color: 'bg-amber-500/10 text-amber-400' },
  MEMBERSHIP: { icon: <Package className="size-4" />, color: 'bg-neon/10 text-neon' },
  CHECKIN: { icon: <QrCode className="size-4" />, color: 'bg-sky-500/10 text-sky-400' },
  TRAINING: {
    icon: <CalendarDays className="size-4" />,
    color: 'bg-purple-500/10 text-purple-400',
  },
  PROMOTION: { icon: <Megaphone className="size-4" />, color: 'bg-danger/10 text-danger' },
  EQUIPMENT: { icon: <Dumbbell className="size-4" />, color: 'bg-amber-500/10 text-amber-400' },
  SYSTEM: { icon: <Bell className="size-4" />, color: 'bg-sky-500/10 text-sky-400' },
};

function typeMeta(type: string) {
  return TYPE_ICON[type] || TYPE_ICON.SYSTEM;
}

const TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
] as const;

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'PAYMENT', label: 'Thanh toán' },
  { value: 'MEMBERSHIP', label: 'Gói tập' },
  { value: 'CHECKIN', label: 'Check-in' },
  { value: 'TRAINING', label: 'Lịch tập' },
  { value: 'PROMOTION', label: 'Khuyến mãi' },
  { value: 'EQUIPMENT', label: 'Thiết bị' },
  { value: 'SYSTEM', label: 'Hệ thống' },
];

interface NotificationListViewProps {
  pageTitle: string;
  pageDesc: string;
  /** Tiền tố query key theo role (member/trainer) */
  queryPrefix: string;
  /** Invalidate thêm khi có thay đổi */
  refreshExtra?: string[];
}

/** Trang danh sách thông báo dùng chung (member + trainer) — API /notifications/me */
export default function NotificationListView({
  pageTitle,
  pageDesc,
  queryPrefix,
  refreshExtra = [],
}: NotificationListViewProps) {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState('');

  const listKey = ['notif-list', queryPrefix, tab, typeFilter];
  const { data, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => notificationApi.getMine({ tab, type: typeFilter || undefined, limit: 100 }),
    retry: 0,
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: [queryPrefix, 'unread'] });
    queryClient.invalidateQueries({ queryKey: [queryPrefix, 'mini'] });
    refreshExtra.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: refresh,
    onError: () => toast.error('Không thể cập nhật', 'Có lỗi xảy ra khi đánh dấu đã đọc.'),
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      refresh();
      toast.success('Đã đánh dấu tất cả là đã đọc!');
    },
    onError: () => toast.error('Không thể cập nhật', 'Có lỗi xảy ra khi đánh dấu tất cả.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: () => toast.success('Đã xóa thông báo'),
    onError: () => toast.error('Không thể xóa', 'Có lỗi xảy ra khi xóa thông báo.'),
  });

  const handleOpen = async (n: { id: string; link?: string | null; isRead: boolean }) => {
    if (!n.isRead) {
      try {
        await notificationApi.markRead(n.id);
        refresh();
      } catch {
        // bỏ qua
      }
    }
    if (n.link) router.push(n.link);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">{pageDesc}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} chưa đọc</Badge>}
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="size-4" />
            Đánh dấu tất cả
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
                tab === t.value ? 'bg-neon text-ink' : 'text-muted hover:text-chalk',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-xs text-chalk outline-none focus:border-neon/50"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-line bg-ink">
                <BellOff className="size-6 text-muted" />
              </div>
              <p className="text-sm font-semibold text-muted">Không có thông báo nào</p>
              <p className="max-w-xs text-xs text-muted">
                Khi có cập nhật về gói tập, thanh toán hay lịch tập, thông báo sẽ hiện ở đây.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {notifications.map((n) => {
                const meta = typeMeta(n.type);
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-5',
                      !n.isRead && 'bg-neon/5',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        meta.color,
                      )}
                    >
                      {meta.icon}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-semibold text-chalk',
                            !n.isRead && 'text-neon',
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-neon">
                            <Mail className="size-3" /> Mới
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-words text-sm text-muted">{n.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                          {NOTIFICATION_TYPE_META[n.type]?.label || n.type}
                        </Badge>
                        <span className="text-[11px] text-muted">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {!n.isRead && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-line/40 disabled:opacity-50"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Đã đọc
                        </button>
                      )}
                      <button
                        onClick={() => remove.mutate(n.id)}
                        disabled={remove.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="size-3.5" />
                        Xóa
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Flame className="size-3.5 text-neon" />
        GymMaster luôn cập nhật trạng thái gói tập và lịch hẹn PT cho bạn.
      </p>
    </div>
  );
}
