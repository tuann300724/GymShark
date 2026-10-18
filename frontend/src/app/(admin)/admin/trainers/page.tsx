'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { trainerApi } from '@/services/trainer.service';
import { TRAINER_STATUS_META } from '@/lib/status';
import { TrainerFormDialog } from '@/components/training/trainer-form-dialog';
import type { TrainerListItem } from '@/services/types';
import {
  Search,
  UserCheck,
  Plus,
  Pencil,
  Eye,
  Power,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function TrainersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('ALL');
  const [specialization, setSpecialization] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainerListItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainers', { page, search, status, specialization }],
    queryFn: () =>
      trainerApi.list({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        specialization: specialization || undefined,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (t: TrainerListItem) =>
      t.status === 'ACTIVE'
        ? trainerApi.remove(t.id)
        : trainerApi.update(t.id, { status: 'ACTIVE' }),
    onSuccess: (_d, t) => {
      toast.success(
        t.status === 'ACTIVE' ? 'Đã ngừng hoạt động HLV' : 'Đã kích hoạt lại HLV',
        t.status === 'ACTIVE'
          ? 'Tài khoản đăng nhập của HLV cũng đã bị khóa.'
          : 'Tài khoản đăng nhập đã được mở lại.',
      );
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (e: any) => toast.error('Thao tác thất bại', e?.response?.data?.message),
  });

  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk flex items-center gap-2">
            <UserCheck className="size-6 text-neon" />
            Huấn Luyện Viên (PT)
          </h1>
          <p className="text-xs text-muted mt-1">
            Quản lý hồ sơ HLV, phân công cho hội viên và theo dõi lịch dạy
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          className="font-semibold text-xs"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4 mr-1.5" />
          Thêm Huấn Luyện Viên
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearch(searchInput.trim());
              }
            }}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-14 text-sm text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
          />
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm bg-neon px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-neon-hover"
          >
            Tìm
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
          <Select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'ON_LEAVE', label: 'Tạm nghỉ' },
              { value: 'INACTIVE', label: 'Ngừng hoạt động' },
            ]}
          />
          <Input
            value={specialization}
            onChange={(e) => {
              setPage(1);
              setSpecialization(e.target.value);
            }}
            placeholder="Lọc chuyên môn..."
            className="h-11"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            className="m-3"
            title="Không tải được huấn luyện viên"
            description="Không tải được danh sách huấn luyện viên từ Backend. Vui lòng thử lại."
            onRetry={() => refetch()}
          />
        ) : data && data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                <tr>
                  <th className="py-3 px-4 font-semibold">HLV</th>
                  <th className="py-3 px-4 font-semibold">Chuyên môn</th>
                  <th className="py-3 px-4 font-semibold">Kinh nghiệm</th>
                  <th className="py-3 px-4 font-semibold">Hội viên</th>
                  <th className="py-3 px-4 font-semibold">Số buổi</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {data.data.map((t) => {
                  const statusMeta = TRAINER_STATUS_META[t.status] || {
                    label: t.status,
                    variant: 'outline' as const,
                  };
                  return (
                    <tr key={t.id} className="hover:bg-line/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {t.user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={t.user.avatarUrl}
                              alt=""
                              className="size-10 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex size-10 items-center justify-center rounded-xl border border-neon/40 bg-neon/10 text-sm font-bold uppercase text-neon">
                              {t.user.fullName?.charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-chalk">
                              {t.user.fullName}
                            </p>
                            <p className="truncate text-xs text-muted">{t.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neon font-semibold">{t.specialization}</td>
                      <td className="py-3 px-4 text-muted">{t.experienceYears} năm</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-chalk">
                          <Users className="size-3.5 text-muted" />
                          {t._count?.trainerMembers || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-chalk">
                          <CalendarDays className="size-3.5 text-muted" />
                          {t._count?.schedules || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/admin/trainers/${t.id}`}
                            className="flex h-8 items-center gap-1 rounded-sm border border-line px-2.5 text-xs font-semibold text-muted transition-colors hover:border-neon/50 hover:text-neon"
                          >
                            <Eye className="size-3.5" /> Chi tiết
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(t);
                              setFormOpen(true);
                            }}
                            className="flex h-8 items-center gap-1 rounded-sm border border-line px-2.5 text-xs font-semibold text-muted transition-colors hover:border-neon/50 hover:text-neon"
                          >
                            <Pencil className="size-3.5" /> Sửa
                          </button>
                          <button
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={() => {
                              const msg =
                                t.status === 'ACTIVE'
                                  ? `Ngừng hoạt động HLV "${t.user.fullName}"? Tài khoản đăng nhập sẽ bị khóa, lịch sử được giữ lại.`
                                  : `Kích hoạt lại HLV "${t.user.fullName}"?`;
                              if (window.confirm(msg)) toggleMutation.mutate(t);
                            }}
                            className={cn(
                              'flex h-8 items-center gap-1 rounded-[10px] border px-2.5 text-xs font-semibold transition-colors',
                              t.status === 'ACTIVE'
                                ? 'border-danger/40 text-danger hover:bg-danger/10'
                                : 'border-neon/40 text-neon hover:bg-neon/10',
                            )}
                          >
                            <Power className="size-3.5" />
                            {t.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            className="m-3"
            icon={UserCheck}
            title="Chưa có huấn luyện viên"
            description="Hãy thêm HLV đầu tiên để phân công tập cho hội viên."
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <p className="text-xs text-muted">
              Trang {page} / {totalPages} · {data?.total} HLV
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-8 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:border-neon/50 hover:text-neon disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      <TrainerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['trainers'] })}
        editing={editing}
      />
    </div>
  );
}
