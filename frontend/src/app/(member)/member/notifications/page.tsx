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
  SYSTEM: { label: 'Hệ thống', icon: <Bell className="w-4 h-4" />, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400' },
  MEMBERSHIP: { label: 'Hội viên', icon: <CreditCard className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
  PAYMENT: { label: 'Thanh toán', icon: <Package className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
  SCHEDULE: { label: 'Lịch tập', icon: <CalendarDays className="w-4 h-4" />, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  PROMOTION: { label: 'Khuyến mãi', icon: <Megaphone className="w-4 h-4" />, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' },
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Thông báo
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
            <CheckCheck className="w-4 h-4" />
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
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <BellOff className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Không có thông báo nào
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Khi có cập nhật về gói tập, thanh toán hay lịch tập, thông báo sẽ hiện ở đây.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n) => {
                const meta = typeMeta(n.type);
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors',
                      !n.isRead && 'bg-emerald-50/50 dark:bg-emerald-900/10',
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        meta.color,
                      )}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            'text-sm font-semibold text-slate-900 dark:text-slate-100',
                            !n.isRead && 'text-emerald-700 dark:text-emerald-300',
                          )}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                            <Mail className="w-3 h-3" /> Mới
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 break-words">
                        {n.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                          {meta.label}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending}
                        className="self-start shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        title="Đánh dấu đã đọc"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
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

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5" />
        GymMaster luôn cập nhật trạng thái gói tập và lịch hẹn PT cho bạn.
      </p>
    </div>
  );
}