'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notification.service';
import { branchApi } from '@/services/branch.service';
import type { NotificationItem } from '@/services/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { NOTIFICATION_TYPE_META, ANNOUNCEMENT_TARGET_LABEL } from '@/lib/status';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Bell,
  BellRing,
  CheckCheck,
  Megaphone,
  Search,
  Send,
  Trash2,
  UserSearch,
} from 'lucide-react';

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  ...Object.entries(NOTIFICATION_TYPE_META).map(([value, meta]) => ({ value, label: meta.label })),
];

const ROLE_OPTIONS = [
  { value: '', label: 'Mọi vai trò' },
  { value: 'MEMBER', label: 'Hội viên' },
  { value: 'TRAINER', label: 'Huấn luyện viên' },
  { value: 'STAFF', label: 'Nhân viên lễ tân' },
  { value: 'MANAGER', label: 'Quản lý' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

const TARGET_OPTIONS = Object.entries(ANNOUNCEMENT_TARGET_LABEL).map(([value, label]) => ({
  value,
  label,
}));

type FormState = {
  title: string;
  message: string;
  target: string;
  branchId: string;
};

const EMPTY_FORM: FormState = { title: '', message: '', target: 'ALL', branchId: '' };

function recipientName(n: NotificationItem) {
  if (n.member) return `${n.member.fullName} (${n.member.code})`;
  if (n.user) return `${n.user.fullName} · ${n.user.role}`;
  return 'Toàn hệ thống';
}

export default function AdminNotificationsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [role, setRole] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications-admin', search, type, role],
    queryFn: () =>
      notificationApi.findAllAdmin({
        search: search || undefined,
        type: type || undefined,
        role: role || undefined,
        limit: 100,
      }),
    retry: 1,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-list'],
    queryFn: branchApi.list,
    retry: 1,
  });

  const list: NotificationItem[] = data?.data || [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-admin'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'unread'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'mini'] });
  };

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      refresh();
      toast.success(
        'Đã đánh dấu thông báo của tôi',
        'Tất cả thông báo của quản trị đã chuyển sang đã đọc.',
      );
    },
    onError: () => toast.error('Không thể cập nhật', 'Có lỗi xảy ra.'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: () => {
      refresh();
      toast.success('Đã xóa thông báo');
    },
    onError: () => toast.error('Không thể xóa', 'Có lỗi xảy ra.'),
  });

  const announce = useMutation({
    mutationFn: () =>
      notificationApi.announce({
        title: form.title.trim(),
        message: form.message.trim(),
        target: form.target,
        branchId: form.target === 'SPECIFIC_BRANCH' ? form.branchId || undefined : undefined,
      }),
    onSuccess: (res: any) => {
      toast.success(
        'Đã gửi thông báo',
        `Đã gửi cho ${res?.created ?? res?.count ?? ''} người nhận.`,
      );
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      refresh();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error('Gửi thất bại', Array.isArray(msg) ? msg.join(', ') : msg || 'Có lỗi xảy ra.');
    },
  });

  const handleSend = () => {
    if (!form.title.trim()) return toast.error('Thiếu tiêu đề', 'Vui lòng nhập tiêu đề thông báo.');
    if (!form.message.trim())
      return toast.error('Thiếu nội dung', 'Vui lòng nhập nội dung thông báo.');
    if (form.target === 'SPECIFIC_BRANCH' && !form.branchId) {
      return toast.error('Thiếu chi nhánh', 'Vui lòng chọn chi nhánh để gửi.');
    }
    announce.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
            <Bell className="size-6 text-neon" /> Thông báo hệ thống
          </h1>
          <p className="mt-1 text-xs text-muted">
            Theo dõi thông báo đã gửi tới hội viên / nhân viên và phát đi thông báo hàng loạt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="mr-1.5 size-4" /> Đánh dấu đã đọc
          </Button>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            <Megaphone className="mr-1.5 size-4" /> Gửi thông báo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          title="Tổng thông báo"
          value={data?.total ?? 0}
          icon={Bell}
          colorScheme="neon"
          subtitle={`${list.length} bản ghi đang hiển thị`}
        />
        <StatCard
          title="Chưa đọc"
          value={data?.unreadCount ?? 0}
          icon={BellRing}
          colorScheme="amber"
          subtitle="Trong bộ lọc hiện tại"
        />
        <StatCard
          title="Loại phổ biến"
          value="7"
          icon={Send}
          colorScheme="purple"
          subtitle="Payment · Membership · Check-in · ..."
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm text-chalk placeholder:text-muted/70 outline-none transition-colors focus:border-neon/60"
          />
        </div>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={TYPE_OPTIONS}
          className="lg:w-52"
        />
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={ROLE_OPTIONS}
          className="lg:w-56"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-14 text-center text-xs text-danger">
            Không kết nối được API thông báo.
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <BellRing className="size-6 text-line" />
            <p className="text-xs text-muted">Không có thông báo nào phù hợp.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {list.map((n) => {
            const typeMeta = NOTIFICATION_TYPE_META[n.type] || {
              label: n.type,
              variant: 'outline' as const,
            };
            return (
              <Card key={n.id} className={cn(n.isRead ? 'opacity-80' : 'border-neon/40')}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      'mt-0.5 size-2 shrink-0 rounded-full',
                      n.isRead ? 'bg-line' : 'bg-neon',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-chalk">{n.title}</p>
                      <Badge variant={typeMeta.variant as any}>{typeMeta.label}</Badge>
                      {!n.isRead && <Badge variant="warning">Mới</Badge>}
                      {n.link && (
                        <Badge variant="outline" className="px-1.5 py-0.5 text-[10px]">
                          {n.link}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 break-words text-xs text-muted">{n.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <UserSearch className="size-3.5" /> {recipientName(n)}
                      </span>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove.mutate(n.id)}
                    disabled={remove.isPending}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-50"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Announce dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Gửi thông báo hàng loạt"
        description="Thông báo sẽ hiển thị trong chuông thông báo của đối tượng được chọn (kể cả người đang đăng nhập)."
        className="max-w-xl"
      >
        <div className="space-y-4">
          <Input
            label="Tiêu đề"
            placeholder="VD: Bảo trì hệ thống 23:00 - 00:00"
            value={form.title}
            maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Nội dung"
            rows={3}
            maxLength={1000}
            placeholder="Nhập nội dung thông báo..."
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <Select
            label="Đối tượng nhận"
            value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
            options={TARGET_OPTIONS}
          />
          {form.target === 'SPECIFIC_BRANCH' && (
            <Select
              label="Chi nhánh"
              value={form.branchId}
              onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              options={(branches || []).map((b) => ({
                value: b.id,
                label: `${b.name} (${b.code})`,
              }))}
            />
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" isLoading={announce.isPending} onClick={handleSend}>
              <Send className="mr-1.5 size-4" /> Gửi thông báo
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
