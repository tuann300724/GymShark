'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notification.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  CalendarDays,
  Package,
  Megaphone,
  Flame,
  Mail,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  SYSTEM: { label: 'Hệ thống', icon: <Bell className="w-4 h-4" />, color: 'bg-sky-500/10 text-sky-400' },
  MEMBERSHIP: { label: 'Hội viên', icon: <CreditCard className="w-4 h-4" />, color: 'bg-neon/10 text-neon' },
  PAYMENT: { label: 'Thanh toán', icon: <Package className="w-4 h-4" />, color: 'bg-amber-500/10 text-amber-400' },
  SCHEDULE: { label: 'Lịch tập', icon: <CalendarDays className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-400' },
  PROMOTION: { label: 'Khuyến mãi', icon: <Megaphone className="w-4 h-4" />, color: 'bg-danger/10 text-danger' },
};

function typeMeta(type: string) {
  return TYPE_META[type] || TYPE_META.SYSTEM;
}

export default function MemberNotificationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['member-notifications'],
    queryFn: notificationApi.getMyNotifications,
    retry: 0,
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['member-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Thông báo
          </h1>
          <p className="mt-1 text-sm text-muted">
            Cập nhật về hội viên, thanh toán và lịch tập của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} chưa đọc</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-2">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-ink">
                <BellOff className="h-6 w-6 text-muted" />
              </div>
              <p className="text-sm font-semibold text-muted">
                Không có thông báo nào
              </p>
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
                    <div className="min-w-0 flex-1">
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
                            <Mail className="h-3 w-3" /> Mới
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-words text-sm text-muted">
                        {n.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="px-2 py-0.5 text-[10px]">
                          {meta.label}
                        </Badge>
                        <span className="text-[11px] text-muted">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                        className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-line/40 disabled:opacity-50"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đã đọc
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Flame className="h-3.5 w-3.5 text-neon" />
        GymMaster luôn cập nhật trạng thái gói tập và lịch hẹn PT cho bạn.
      </p>
    </div>
  );
}
