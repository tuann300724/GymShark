'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { checkinApi, searchMembersForCheckIn } from '@/services/checkin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { FaceScanner } from '@/components/ui/face-scanner';
import { StatCard } from '@/components/ui/stat-card';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatTime, formatDuration, formatDateTime } from '@/lib/utils';
import {
  Users,
  QrCode,
  LogOut,
  Clock4,
  TrendingUp,
  Search,
  UserPlus,
  ScanLine,
  HandMetal,
  UserCheck,
  ScanFace,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Building2,
  RefreshCw,
  UserRound,
} from 'lucide-react';

const METHOD_META: Record<string, { label: string; icon: typeof HandMetal }> = {
  MANUAL: { label: 'Tự check-in', icon: HandMetal },
  QR_CODE: { label: 'Quét QR', icon: ScanLine },
  STAFF: { label: 'Lễ tân', icon: UserCheck },
  FACE_ID: { label: 'Khuôn mặt', icon: ScanFace },
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function AdminCheckinsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const today = todayKey();

  // ------------------ Stats ------------------
  const { data: daily } = useQuery({
    queryKey: ['checkins-daily', today],
    queryFn: () => checkinApi.getDailyReport(today, today),
    retry: 0,
    refetchInterval: 30000,
  });
  const { data: hourly } = useQuery({
    queryKey: ['checkins-hourly', today],
    queryFn: () => checkinApi.getHourlyReport(today),
    retry: 0,
    refetchInterval: 30000,
  });

  // ------------------ Currently inside (live) ------------------
  const {
    data: inside,
    isLoading: insideLoading,
    isRefetching: insideRefetching,
    refetch: refetchInside,
  } = useQuery({
    queryKey: ['checkins-inside'],
    queryFn: checkinApi.getCurrentlyInside,
    retry: 0,
    refetchInterval: 20000,
  });

  // ------------------ Branch options ------------------
  const { data: branches } = useQuery({
    queryKey: ['branches-options'],
    queryFn: async () => {
      const res = await apiClient.get('/branches');
      return res.data as any[];
    },
    retry: 0,
  });

  // ------------------ History list ------------------
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const historyQuery = useQuery({
    queryKey: [
      'checkins-history',
      page,
      search,
      statusFilter,
      branchFilter,
      fromDate,
      toDate,
      sortOrder,
    ],
    queryFn: () =>
      checkinApi.getAdminCheckins({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        branchId: branchFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy: 'checkInTime',
        sortOrder,
      }),
    retry: 0,
  });
  const history = historyQuery.data;
  const totalPages = Math.max(1, Math.ceil((history?.total || 0) / 20));

  // ------------------ Mutations ------------------
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['checkins-history'] });
    queryClient.invalidateQueries({ queryKey: ['checkins-inside'] });
    queryClient.invalidateQueries({ queryKey: ['checkins-daily'] });
    queryClient.invalidateQueries({ queryKey: ['checkins-hourly'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
  };

  const checkoutMutation = useMutation({
    mutationFn: (id: string) => checkinApi.adminCheckOut(id),
    onSuccess: (res) => {
      const name = res.data?.member?.fullName || 'Hội viên';
      toast.success('Check-out thành công', `${name} đã rời phòng gym.`);
      invalidateAll();
      refetchInside();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-out.';
      toast.error('Check-out thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // ------------------ Staff check-in dialog ------------------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!dialogOpen) {
      setMemberSearch('');
      setMemberResults([]);
    }
  }, [dialogOpen]);

  const runMemberSearch = async () => {
    const term = memberSearch.trim();
    if (!term) {
      setMemberResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchMembersForCheckIn(term);
      setMemberResults(res.data || []);
    } catch {
      setMemberResults([]);
    } finally {
      setSearching(false);
    }
  };

  const staffCheckInMutation = useMutation({
    mutationFn: (selectedId: string) => checkinApi.staffCheckIn(selectedId),
    onSuccess: (res, selectedId) => {
      const name = res.data?.member?.fullName || '';
      toast.success(
        'Check-in thành công',
        `${name} đang có mặt trong phòng gym (${res.data?.membership?.packageName || 'gói tập'}).`,
      );
      setDialogOpen(false);
      invalidateAll();
      refetchInside();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không thể check-in cho hội viên này.';
      toast.error('Check-in thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // ------------------ Face scan (1:N) dialog ------------------
  const [faceScanOpen, setFaceScanOpen] = useState(false);
  const [faceScanKey, setFaceScanKey] = useState(0);
  const [faceScanResult, setFaceScanResult] = useState<{
    name: string;
    code?: string;
    similarity: number;
  } | null>(null);

  useEffect(() => {
    if (!faceScanOpen) {
      setFaceScanResult(null);
      setFaceScanKey((k) => k + 1); // lần mở sau quét lại từ đầu
    }
  }, [faceScanOpen]);

  const faceScanMutation = useMutation({
    mutationFn: (embedding: number[]) => checkinApi.faceScan(embedding),
    onSuccess: (res) => {
      const member = res.data?.member;
      setFaceScanResult({
        name: member?.fullName || 'Hội viên',
        code: member?.code,
        similarity: res.face?.similarity ?? 0,
      });
      invalidateAll();
      refetchInside();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không nhận diện được hội viên nào.';
      toast.error('Quét khuôn mặt thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
      // Quét lại từ đầu
      setFaceScanKey((k) => k + 1);
    },
  });

  // ------------------ Peak hour display ------------------
  const peakHour = hourly?.peakHour ?? null;
  const peakCount = hourly?.peakCount ?? 0;

  const statItems = [
    {
      title: 'Lượt Check-in Hôm Nay',
      value: daily?.summary?.totalCheckIns ?? 0,
      subtitle: 'Tính từ 00:00 hôm nay',
      icon: QrCode,
      scheme: 'neon' as const,
    },
    {
      title: 'Đang Trong Phòng',
      value: inside?.length ?? 0,
      subtitle: 'Hội viên chưa check-out',
      icon: Users,
      scheme: 'blue' as const,
    },
    {
      title: 'Check-out Hôm Nay',
      value: daily?.summary?.totalCheckOuts ?? 0,
      subtitle: 'Đã rời phòng hôm nay',
      icon: LogOut,
      scheme: 'amber' as const,
    },
    {
      title: 'Giờ Cao Điểm',
      value: peakHour !== null ? `${String(peakHour).padStart(2, '0')}:00` : '--',
      subtitle: peakCount > 0 ? `${peakCount} lượt check-in` : 'Chưa có dữ liệu',
      icon: TrendingUp,
      scheme: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
            Check-in / Attendance
          </h1>
          <p className="mt-1 text-sm text-muted">
            Theo dõi hội viên đang tập, lịch sử ra vào và điểm danh hàng ngày.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" onClick={() => setFaceScanOpen(true)}>
            <ScanFace className="size-4 mr-1.5" /> Quét khuôn mặt
          </Button>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4 mr-1.5" /> Check-in cho hội viên
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statItems.map((s) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={s.value}
            subtitle={s.subtitle}
            icon={s.icon}
            colorScheme={s.scheme}
          />
        ))}
      </div>

      {/* Card with refresh */}
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="size-4 text-neon" />
              Hội viên đang có mặt trong phòng ({inside?.length ?? 0})
            </CardTitle>
            <CardDescription>Tự động cập nhật mỗi 20 giây • kết thúc khi check-out</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchInside()}
            isLoading={insideLoading || insideRefetching}
          >
            <RefreshCw className="size-3.5 mr-1.5" /> Làm mới
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {insideLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !inside || inside.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              Không có hội viên nào đang ở trong phòng. Hãy chờ lượt check-in đầu tiên!
            </div>
          ) : (
            <div className="divide-y divide-line">
              {inside.map((c) => {
                const member = c.member;
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-line/20 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {member?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatarUrl}
                          alt={member?.fullName || 'avatar'}
                          className="size-10 shrink-0 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                          {(member?.fullName || '?').charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-chalk">
                          {member?.fullName}
                          <span className="ml-2 font-mono text-[11px] text-neon">
                            {member?.code}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted">
                          {c.packageName ? (
                            <Badge variant="outline" className="mr-1.5">
                              {c.packageName}
                            </Badge>
                          ) : null}
                          Vào lúc {formatTime(c.checkInTime)} • {formatDuration(c.durationMinutes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/admin/members/${c.memberId}`}>
                        <Button variant="outline" size="sm">
                          <UserRound className="size-3.5 mr-1" /> Hội viên
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={
                          checkoutMutation.isPending && checkoutMutation.variables === c.id
                        }
                        onClick={() => checkoutMutation.mutate(c.id)}
                      >
                        <LogOut className="size-3.5 mr-1" /> Check-out
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock4 className="size-4 text-neon" />
            Lịch sử check-in
          </CardTitle>
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo tên / mã / SĐT..."
                  className="h-9 w-full rounded-sm border border-line bg-ink pl-9 pr-3 text-xs text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/60"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="CHECKED_IN">Đang tập</option>
                  <option value="CHECKED_OUT">Đã hoàn tất</option>
                </select>
                <select
                  value={branchFilter}
                  onChange={(e) => {
                    setBranchFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
                >
                  <option value="">Tất cả chi nhánh</option>
                  {(branches || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
                />
                <span className="text-xs text-muted">→</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
              >
                <option value="desc">Mới nhất trước</option>
                <option value="asc">Cũ nhất trước</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !history || history.data.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted">
              Không có bản ghi check-in nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2.5 px-4">Hội viên</th>
                    <th className="py-2.5 px-4">Ngày</th>
                    <th className="py-2.5 px-4">Check-in</th>
                    <th className="py-2.5 px-4">Check-out</th>
                    <th className="py-2.5 px-4">Thời lượng</th>
                    <th className="py-2.5 px-4">Chi nhánh</th>
                    <th className="py-2.5 px-4">Hình thức</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {history.data.map((c) => {
                    const methodMeta = METHOD_META[c.method || 'MANUAL'] || METHOD_META.MANUAL;
                    return (
                      <tr key={c.id} className="transition-colors hover:bg-line/20">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neon/30 bg-neon/10 text-[10px] font-bold uppercase text-neon">
                              {(c.member?.fullName || '?').charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-chalk">
                                {c.member?.fullName}
                              </p>
                              <p className="font-mono text-[10px] text-muted">{c.member?.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-muted">
                          {formatDate(c.checkInTime)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 font-mono text-chalk">
                          {formatTime(c.checkInTime)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 font-mono text-muted">
                          {c.checkOutTime ? formatTime(c.checkOutTime) : '--'}
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-chalk">
                          {formatDuration(c.durationMinutes)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3.5" />
                            {c.branch?.name || '--'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <methodMeta.icon className="size-3.5" />
                            {methodMeta.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4">
                          <Badge variant={c.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                            {c.status === 'CHECKED_OUT' ? 'Hoàn tất' : 'Đang tập'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-right">
                          <Link
                            href={`/admin/members/${c.memberId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline"
                          >
                            Xem <ArrowRight className="size-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(history?.total || 0) > 0 && (
            <div className="flex items-center justify-between border-t border-line p-4">
              <p className="text-xs text-muted">
                Trang {page}/{totalPages} • {history?.total} bản ghi
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || historyQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || historyQuery.isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff check-in dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Check-in cho hội viên"
        description="Tìm hội viên theo tên, mã thẻ hoặc số điện thoại rồi xác nhận check-in."
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runMemberSearch()}
                placeholder="VD: Trần Minh Quân / MEM-0001 / 0987..."
                className="h-10 w-full rounded-sm border border-line bg-ink pl-9 pr-3 text-sm text-chalk placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-neon/70"
              />
            </div>
            <Button variant="primary" size="sm" onClick={runMemberSearch} isLoading={searching}>
              Tìm
            </Button>
          </div>

          {memberResults.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {memberResults.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-neon/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-neon/40 bg-neon/10 text-xs font-bold uppercase text-neon">
                    {(m.fullName || '?').charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-chalk">{m.fullName}</p>
                    <p className="text-[11px] text-muted">
                      {m.code} • {m.phone || 'Chưa có SĐT'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={
                      staffCheckInMutation.isPending && staffCheckInMutation.variables === m.id
                    }
                    onClick={() => staffCheckInMutation.mutate(m.id)}
                  >
                    <QrCode className="size-3.5 mr-1" /> Check-in
                  </Button>
                </div>
              ))}
            </div>
          )}

          {memberSearch.trim() && !searching && memberResults.length === 0 && (
            <p className="py-4 text-center text-xs text-muted">Không tìm thấy hội viên phù hợp.</p>
          )}
        </div>
      </Dialog>

      {/* Face scan dialog (1:N) */}
      <Dialog
        open={faceScanOpen}
        onClose={() => setFaceScanOpen(false)}
        title="Quét khuôn mặt 1:N"
        description="Hệ thống tự nhận diện hội viên trong dữ liệu đã đăng ký rồi check-in ngay tại quầy."
      >
        {faceScanResult ? (
          <div className="text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-neon bg-neon/10">
              <UserCheck className="size-8 text-neon" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-chalk">
              {faceScanResult.name}
            </h3>
            {faceScanResult.code && (
              <p className="mt-1 font-mono text-xs text-neon">{faceScanResult.code}</p>
            )}
            <p className="mt-3 text-sm text-muted">
              Độ khớp:{' '}
              <strong className="font-mono text-chalk">
                {(faceScanResult.similarity * 100).toFixed(1)}%
              </strong>{' '}
              • Đã ghi nhận check-in.
            </p>
            <Button
              variant="primary"
              className="mt-5 w-full"
              onClick={() => setFaceScanOpen(false)}
            >
              Hoàn tất
            </Button>
          </div>
        ) : (
          <>
            <FaceScanner
              key={faceScanKey}
              mode="verify"
              onCapture={(embedding) => faceScanMutation.mutate(embedding)}
              onError={(msg) => toast.error('Không mở được camera', msg)}
            />
            <p className="mt-3 text-center text-[11px] text-muted">
              Chỉ hội viên đã đăng ký khuôn mặt mới nhận diện được • đối sánh phía máy chủ.
            </p>
          </>
        )}
      </Dialog>
    </div>
  );
}
