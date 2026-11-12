'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateStaffAccountDialog } from '@/components/admin/create-staff-account-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Textarea } from '@/components/ui/textarea';
import { WeeklyShiftTemplatesDialog } from '@/components/admin/weekly-shift-templates-dialog';
import { useToast } from '@/components/ui/toast';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  BarChart3,
  Banknote,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Plus,
  Receipt,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  StaffShift,
  StaffShiftFilters,
  StaffShiftPayload,
  ShiftReportGroup,
  staffShiftApi,
} from '@/services/staff-shift.service';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'IN_PROGRESS', label: 'Đang làm' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const STATUS_META: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'default' | 'destructive' | 'outline' }
> = {
  SCHEDULED: { label: 'Đã lên lịch', variant: 'default' },
  IN_PROGRESS: { label: 'Đang làm', variant: 'success' },
  COMPLETED: { label: 'Đã kết thúc', variant: 'outline' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
};

const EMPTY_FORM: StaffShiftPayload = {
  staffId: '',
  title: '',
  startTime: '',
  endTime: '',
  notes: '',
};

function toLocalDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === 'string').join(', ');
    }
  }
  return error instanceof Error ? error.message : fallback;
}

function ReportGroups({ title, groups }: { title: string; groups: ShiftReportGroup[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="font-display text-lg font-bold uppercase text-chalk">{title}</h2>
        {groups.length ? (
          <div className="mt-4 space-y-3">
            {groups.map((group) => (
              <div
                key={`${group.id ?? 'none'}-${group.label}`}
                className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-chalk">{group.label}</p>
                  <p className="mt-1 text-xs text-muted">
                    {group.transactionCount} giao dịch · {group.memberCount} hội viên
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-bold text-neon">
                  {formatCurrency(group.totalRevenue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Chưa có dữ liệu trong bộ lọc này.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StaffShiftsPage() {
  const toastApi = useToast();
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [filters, setFilters] = useState<StaffShiftFilters>({});
  const [draftFilters, setDraftFilters] = useState<StaffShiftFilters>({});
  const [editing, setEditing] = useState<StaffShift | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffAccountOpen, setStaffAccountOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [form, setForm] = useState<StaffShiftPayload>(EMPTY_FORM);
  const [settlingShift, setSettlingShift] = useState<StaffShift | null>(null);
  const [cashCounted, setCashCounted] = useState('');
  const [settlementNote, setSettlementNote] = useState('');

  const optionsQuery = useQuery({
    queryKey: ['staff-shift-options'],
    queryFn: staffShiftApi.options,
    staleTime: 5 * 60 * 1000,
  });
  const query = useQuery({
    queryKey: ['staff-shifts', filters],
    queryFn: () => staffShiftApi.list(filters),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const settlementPreviewQuery = useQuery({
    queryKey: ['staff-shift-settlement-preview', settlingShift?.id],
    queryFn: () => staffShiftApi.settlementPreview(settlingShift!.id),
    enabled: Boolean(settlingShift),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['staff-shifts'] });

  const createMutation = useMutation({
    mutationFn: (payload: StaffShiftPayload) => staffShiftApi.create(payload),
    onSuccess: () => {
      toastApi.success('Đã phân công ca làm');
      setDialogOpen(false);
      refresh();
    },
    onError: (error) =>
      toastApi.error(
        'Không thể tạo ca làm',
        getErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'),
      ),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffShiftPayload }) =>
      staffShiftApi.update(id, payload),
    onSuccess: () => {
      toastApi.success('Đã cập nhật ca làm');
      setDialogOpen(false);
      refresh();
    },
    onError: (error) =>
      toastApi.error(
        'Không thể cập nhật ca làm',
        getErrorMessage(error, 'Ca có thể đã bắt đầu hoặc bị trùng giờ.'),
      ),
  });
  const removeMutation = useMutation({
    mutationFn: staffShiftApi.remove,
    onSuccess: () => {
      toastApi.success('Đã xóa ca làm');
      refresh();
    },
    onError: (error) =>
      toastApi.error(
        'Không thể xóa ca làm',
        getErrorMessage(error, 'Ca đã bắt đầu hoặc đã phát sinh thanh toán.'),
      ),
  });
  const startMutation = useMutation({
    mutationFn: staffShiftApi.start,
    onSuccess: () => {
      toastApi.success('Đã bắt đầu ca làm');
      refresh();
    },
    onError: (error) =>
      toastApi.error(
        'Không thể bắt đầu ca',
        getErrorMessage(error, 'Kiểm tra người được phân công và thời gian ca.'),
      ),
  });
  const endMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { cashCounted: number; note?: string };
    }) => staffShiftApi.end(id, payload),
    onSuccess: (shift) => {
      toastApi.success(
        'Đã chốt ca làm',
        shift.cashDifference === 0
          ? 'Tiền mặt thực đếm khớp với số liệu hệ thống.'
          : `Đã ghi nhận chênh lệch ${formatCurrency(shift.cashDifference ?? 0)}.`,
      );
      setSettlingShift(null);
      setCashCounted('');
      setSettlementNote('');
      refresh();
    },
    onError: (error) =>
      toastApi.error(
        'Không thể chốt ca',
        getErrorMessage(error, 'Hãy kiểm tra giao dịch tiền mặt đang chờ và thử lại.'),
      ),
  });
  const cancelMutation = useMutation({
    mutationFn: staffShiftApi.cancel,
    onSuccess: () => {
      toastApi.success('Đã hủy ca làm');
      refresh();
    },
    onError: (error) =>
      toastApi.error('Không thể hủy ca', getErrorMessage(error, 'Ca đã kết thúc hoặc đã bị hủy.')),
  });

  const staffOptions = useMemo(
    () => [
      { value: '', label: 'Chọn nhân viên' },
      ...(optionsQuery.data?.staff ?? []).map((staff) => ({
        value: staff.id,
        label: `${staff.fullName} · ${staff.email}`,
      })),
    ],
    [optionsQuery.data?.staff],
  );
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (shift: StaffShift) => {
    setEditing(shift);
    setForm({
      staffId: shift.staffId,
      title: shift.title,
      startTime: toLocalDateTime(shift.startTime),
      endTime: toLocalDateTime(shift.endTime),
      notes: shift.notes ?? '',
    });
    setDialogOpen(true);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...form,
      notes: form.notes || null,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    };
    if (editing) updateMutation.mutate({ id: editing.id, payload });
    else createMutation.mutate(payload);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
  };
  const resetFilters = () => {
    setDraftFilters({});
    setFilters({});
  };
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const report = query.data;
  const expectedCash = settlementPreviewQuery.data?.expectedCash ?? 0;
  const countedCash = cashCounted.trim() === '' ? null : Number(cashCounted);
  const cashDifference =
    countedCash === null || !Number.isFinite(countedCash)
      ? null
      : Number((countedCash - expectedCash).toFixed(2));
  const hasCashDifference = cashDifference !== null && cashDifference !== 0;

  const openSettlement = (shift: StaffShift) => {
    setSettlingShift(shift);
    setCashCounted('');
    setSettlementNote('');
  };

  const submitSettlement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settlingShift || !settlementPreviewQuery.data || countedCash === null) return;
    endMutation.mutate({
      id: settlingShift.id,
      payload: {
        cashCounted: countedCash,
        note: settlementNote.trim() || undefined,
      },
    });
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="meta-label">Vận hành nhân sự</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-chalk">
            Ca làm & doanh thu
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Đến quầy, nhân viên mở ca được phân công trước khi thu tiền. Giao dịch tại quầy chỉ ghi
            nhận doanh thu sau khi thanh toán được xác nhận.
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStaffAccountOpen(true)}>
              <Plus className="mr-2 size-4" />
              Tạo tài khoản nhân viên
            </Button>
            <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
              <CalendarDays className="mr-2 size-4" />
              Mẫu lịch tuần
            </Button>
            <Button
              onClick={openCreate}
              disabled={
                optionsQuery.isLoading || optionsQuery.isError || !optionsQuery.data?.staff.length
              }
            >
              <Plus className="mr-2 size-4" />
              Phân công ca
            </Button>
          </div>
        )}
      </header>

      {optionsQuery.isError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm">
          <p className="text-danger">Không tải được danh sách nhân viên để phân ca.</p>
          <Button variant="outline" size="sm" onClick={() => optionsQuery.refetch()}>
            Tải lại danh sách
          </Button>
        </div>
      )}
      {!canManage && (
        <div className="rounded-xl border border-neon/20 bg-neon/5 p-4 text-sm text-muted">
          <p className="font-semibold text-chalk">Quy trình nhận ca</p>
          <p className="mt-1">
            Chọn ca được phân rồi nhấn{' '}
            <span className="font-semibold text-neon">Chấm công vào</span> khi đến làm. Khi rời ca,
            kiểm quỹ và chấm công ra. Tiền mặt được ghi nhận khi xác nhận thanh toán; chuyển khoản
            CASSO tại quầy gắn với ca đã tạo giao dịch.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            label="Từ ngày"
            value={draftFilters.from ?? ''}
            onChange={(event) => setDraftFilters({ ...draftFilters, from: event.target.value })}
          />
          <Input
            type="date"
            label="Đến ngày"
            value={draftFilters.to ?? ''}
            onChange={(event) => setDraftFilters({ ...draftFilters, to: event.target.value })}
          />
          {canManage && (
            <Select
              label="Nhân viên"
              options={[{ value: '', label: 'Tất cả nhân viên' }, ...staffOptions.slice(1)]}
              value={draftFilters.staffId ?? ''}
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, staffId: event.target.value })
              }
            />
          )}
          <Select
            label="Trạng thái ca"
            options={STATUS_OPTIONS}
            value={draftFilters.status ?? ''}
            onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value })}
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button onClick={applyFilters}>Lọc báo cáo</Button>
            <Button variant="outline" onClick={resetFilters}>
              Xóa lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Không tải được ca làm"
          description="Đã xảy ra lỗi khi tải danh sách ca và báo cáo."
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Tổng doanh thu"
              value={formatCurrency(report?.summary.totalRevenue ?? 0)}
              icon={BarChart3}
            />
            <StatCard
              title="Giao dịch"
              value={report?.summary.transactionCount ?? 0}
              icon={Receipt}
              subtitle="Giao dịch thẻ tập và nước đã thanh toán"
            />
            <StatCard
              title="Hội viên đã thanh toán"
              value={report?.summary.memberCount ?? 0}
              icon={Users}
              subtitle="Hội viên duy nhất mua thẻ tập hoặc nước"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportGroups title="Doanh thu theo ngày" groups={report?.byDay ?? []} />
            <ReportGroups title="Doanh thu theo nhân viên" groups={report?.byStaff ?? []} />
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold uppercase text-chalk">
                Danh sách ca làm
              </h2>
              <span className="text-xs text-muted">{report?.data.length ?? 0} ca</span>
            </div>
            {report?.data.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {report.data.map((shift) => {
                  const status = STATUS_META[shift.status] ?? STATUS_META.SCHEDULED;
                  return (
                    <Card key={shift.id} className="min-w-0">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-bold text-chalk">{shift.title}</h3>
                            <p className="mt-1 text-sm text-muted">{shift.staffName}</p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="text-sm">
                          <p className="flex min-w-0 items-center gap-2 text-muted">
                            <CalendarDays className="size-4 shrink-0 text-neon" />
                            <span>
                              {formatDateTime(shift.startTime)} – {formatDateTime(shift.endTime)}
                            </span>
                          </p>
                          {(shift.startedAt || shift.endedAt) && (
                            <p className="mt-2 text-xs text-muted">
                              {shift.startedAt
                                ? `Chấm công vào: ${formatDateTime(shift.startedAt)}`
                                : 'Chưa chấm công vào'}
                              {shift.endedAt
                                ? ` · Chấm công ra: ${formatDateTime(shift.endedAt)}`
                                : ''}
                            </p>
                          )}
                        </div>
                        {shift.notes && <p className="text-sm text-muted">{shift.notes}</p>}
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-ink/60 p-3 text-center">
                          <div>
                            <p className="text-[11px] text-muted">Doanh thu</p>
                            <p className="mt-1 text-sm font-bold text-neon">
                              {formatCurrency(shift.totalRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted">Giao dịch</p>
                            <p className="mt-1 text-sm font-bold text-chalk">
                              {shift.paidPaymentCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted">Hội viên</p>
                            <p className="mt-1 text-sm font-bold text-chalk">{shift.memberCount}</p>
                          </div>
                        </div>
                        {shift.status === 'COMPLETED' && (
                          <div className="rounded-xl border border-line bg-ink/40 p-3">
                            {shift.cashExpected !== null && shift.cashCounted !== null ? (
                              <>
                                <div className="grid gap-3 text-sm sm:grid-cols-3">
                                  <div>
                                    <p className="text-xs text-muted">Tiền mặt dự kiến</p>
                                    <p className="mt-1 font-semibold text-chalk">
                                      {formatCurrency(shift.cashExpected)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted">Thực đếm</p>
                                    <p className="mt-1 font-semibold text-chalk">
                                      {formatCurrency(shift.cashCounted)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted">Chênh lệch</p>
                                    <p
                                      className={`mt-1 font-semibold ${
                                        shift.cashDifference === 0 ? 'text-neon' : 'text-danger'
                                      }`}
                                    >
                                      {formatCurrency(shift.cashDifference ?? 0)}
                                    </p>
                                  </div>
                                </div>
                                {shift.closeNotes && (
                                  <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
                                    Lý do chênh lệch: {shift.closeNotes}
                                  </p>
                                )}
                                <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                                  Chốt bởi {shift.closedByName ?? 'Tài khoản không còn hoạt động'}
                                  {shift.closedAt ? ` · ${formatDateTime(shift.closedAt)}` : ''}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted">
                                Ca đã kết thúc trước khi có chức năng chốt quỹ.
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                          {shift.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              onClick={() => startMutation.mutate(shift.id)}
                              disabled={startMutation.isPending}
                            >
                              <Clock3 className="mr-1.5 size-4" /> Chấm công vào · mở ca
                            </Button>
                          )}
                          {shift.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              onClick={() => openSettlement(shift)}
                              disabled={endMutation.isPending || Boolean(settlingShift)}
                            >
                              <Banknote className="mr-1.5 size-4" /> Chấm công ra · kiểm quỹ & chốt
                              ca
                            </Button>
                          )}
                          {canManage && shift.status === 'SCHEDULED' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEdit(shift)}>
                                <Edit3 className="mr-1.5 size-4" /> Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  if (window.confirm(`Xóa ca "${shift.title}"?`))
                                    removeMutation.mutate(shift.id);
                                }}
                                disabled={removeMutation.isPending}
                              >
                                <Trash2 className="mr-1.5 size-4" /> Xóa
                              </Button>
                            </>
                          )}
                          {canManage && shift.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                if (window.confirm(`Hủy ca "${shift.title}" đang diễn ra?`)) {
                                  cancelMutation.mutate(shift.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                            >
                              <X className="mr-1.5 size-4" /> Hủy ca
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Clock3}
                title="Chưa có ca làm"
                description="Chưa có ca nào trong khoảng thời gian hoặc bộ lọc đã chọn."
                action={
                  canManage ? (
                    <Button onClick={openCreate}>
                      <Plus className="mr-2 size-4" /> Phân công ca
                    </Button>
                  ) : undefined
                }
              />
            )}
          </section>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Chỉnh sửa ca làm' : 'Phân công ca làm'}
        description="Chỉ tài khoản nhân viên đang hoạt động mới được phân công."
      >
        <form onSubmit={submitForm} className="space-y-4">
          <Input
            label="Tên ca"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Ví dụ: Ca sáng"
            required
            maxLength={255}
          />
          <Select
            label="Nhân viên"
            options={staffOptions}
            value={form.staffId}
            onChange={(event) => setForm({ ...form, staffId: event.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="datetime-local"
              label="Bắt đầu"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              required
            />
            <Input
              type="datetime-local"
              label="Kết thúc"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              required
            />
          </div>
          <Input
            label="Ghi chú"
            value={form.notes ?? ''}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Thông tin thêm cho ca làm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-1.5 size-4" /> Đóng
            </Button>
            <Button type="submit" disabled={isSaving || !form.staffId}>
              <Check className="mr-1.5 size-4" />{' '}
              {isSaving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo ca'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(settlingShift)}
        onClose={() => {
          if (!endMutation.isPending) setSettlingShift(null);
        }}
        title="Kiểm quỹ và chốt ca"
        description={
          settlingShift ? `${settlingShift.title} · ${settlingShift.staffName}` : undefined
        }
      >
        {settlementPreviewQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : settlementPreviewQuery.isError ? (
          <ErrorState
            title="Không tải được số liệu kiểm quỹ"
            description={getErrorMessage(
              settlementPreviewQuery.error,
              'Không thể lấy số tiền mặt dự kiến của ca.',
            )}
            onRetry={() => settlementPreviewQuery.refetch()}
          />
        ) : (
          <form onSubmit={submitSettlement} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-ink/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Tiền mặt dự kiến
                </p>
                <p className="mt-2 font-mono text-xl font-bold text-neon">
                  {formatCurrency(settlementPreviewQuery.data?.expectedCash ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {settlementPreviewQuery.data?.cashPaymentCount ?? 0} giao dịch thẻ tập và nước đã
                  thanh toán
                </p>
              </div>
              <div className="rounded-xl border border-line bg-ink/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Tiền mặt thực đếm
                </p>
                <p className="mt-2 font-mono text-xl font-bold text-chalk">
                  {countedCash === null ? '—' : formatCurrency(countedCash)}
                </p>
                <p className="mt-1 text-xs text-muted">Nhập số tiền trong ngăn kéo quầy</p>
              </div>
              <div className="rounded-xl border border-line bg-ink/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Chuyển khoản/CASSO
                </p>
                <p className="mt-2 font-mono text-lg font-bold text-chalk">
                  {formatCurrency(settlementPreviewQuery.data?.bankTransferExpected ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {settlementPreviewQuery.data?.bankTransferPaymentCount ?? 0} giao dịch · không
                  cộng vào tiền mặt
                </p>
              </div>
            </div>

            <Input
              type="number"
              label="Số tiền mặt thực đếm (VND)"
              min="0"
              max="9999999999.99"
              step="0.01"
              value={cashCounted}
              onChange={(event) => setCashCounted(event.target.value)}
              required
            />

            {cashDifference !== null && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  cashDifference === 0
                    ? 'border-neon/30 bg-neon/5 text-neon'
                    : 'border-danger/30 bg-danger/5 text-danger'
                }`}
              >
                Chênh lệch: <strong>{formatCurrency(cashDifference)}</strong>
                {cashDifference === 0
                  ? ' · Tiền khớp với hệ thống.'
                  : ' · Ghi rõ lý do trước khi chốt.'}
              </div>
            )}

            {(settlementPreviewQuery.data?.pendingCashCount ?? 0) > 0 && (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
                Còn {settlementPreviewQuery.data?.pendingCashCount} khoản tiền mặt chưa xác nhận.
                Hãy xử lý các giao dịch này trước khi chốt ca.
              </div>
            )}

            <Textarea
              label={
                hasCashDifference
                  ? 'Lý do chênh lệch (bắt buộc)'
                  : 'Ghi chú bàn giao (không bắt buộc)'
              }
              value={settlementNote}
              onChange={(event) => setSettlementNote(event.target.value)}
              placeholder={
                hasCashDifference
                  ? 'Mô tả nguyên nhân thiếu hoặc thừa quỹ'
                  : 'Ghi chú thêm khi bàn giao ca'
              }
              maxLength={1000}
              required={hasCashDifference}
              rows={3}
            />

            <p className="text-xs leading-relaxed text-muted">
              Chỉ tính các giao dịch tiền mặt đã xác nhận trong ca. Chuyển khoản/CASSO được thống kê
              riêng; các giao dịch tiền mặt đang chờ phải xử lý trước khi chốt.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettlingShift(null)}
                disabled={endMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                isLoading={endMutation.isPending}
                disabled={
                  !settlementPreviewQuery.data ||
                  settlementPreviewQuery.data.pendingCashCount > 0 ||
                  (hasCashDifference && !settlementNote.trim())
                }
              >
                <Check className="size-4" /> Xác nhận chốt ca
              </Button>
            </div>
          </form>
        )}
      </Dialog>
      <CreateStaffAccountDialog
        open={staffAccountOpen}
        onClose={() => setStaffAccountOpen(false)}
      />
      <WeeklyShiftTemplatesDialog
        open={templatesOpen}
        staff={optionsQuery.data?.staff ?? []}
        onClose={() => setTemplatesOpen(false)}
        onGenerated={refresh}
      />
    </div>
  );
}
