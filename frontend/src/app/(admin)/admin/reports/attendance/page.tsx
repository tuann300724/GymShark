'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { checkinApi } from '@/services/checkin.service';
import { reportApi } from '@/services/report.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select } from '@/components/ui/select';
import { formatDate, formatDuration } from '@/lib/utils';
import { GYM_TIERS, gymTierLabel } from '@/lib/package-options';
import type { AttendanceTierFilter } from '@/services/types';
import {
  CalendarRange,
  Users,
  QrCode,
  LogOut,
  UserCheck,
  Search,
  BarChart3,
  ArrowRight,
  ScanFace,
  Building2,
} from 'lucide-react';

/** Bộ lọc hạng cơ sở — hạng cao trước (khớp thứ tự backend trả về facilityOptions) */
const TIER_FILTER_OPTIONS: { value: '' | AttendanceTierFilter; label: string }[] = [
  { value: '', label: 'Tất cả hạng cơ sở' },
  ...[...GYM_TIERS].reverse().map((t) => ({ value: t.value, label: `Hạng ${t.shortLabel}` })),
  { value: 'NONE', label: 'Cơ sở chưa xếp hạng' },
  { value: 'SYSTEM', label: 'Phòng hệ thống Gym Master' },
];

/** Nhãn hình thức check-in (thống kê KPI) */
const CHECKIN_METHOD_LABEL: Record<string, string> = {
  MANUAL: 'Tự check-in',
  STAFF: 'Lễ tân',
  QR_CODE: 'Quét QR',
  FACE_ID: 'Khuôn mặt',
};

function daysAgoKey(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function todayKey(): string {
  return daysAgoKey(0);
}

export default function AttendanceReportPage() {
  const [from, setFrom] = useState(daysAgoKey(13));
  const [to, setTo] = useState(todayKey());
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<'' | AttendanceTierFilter>('');
  const [partnerId, setPartnerId] = useState('');

  const {
    data: daily,
    isLoading: dailyLoading,
    isError: dailyError,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['att-report-daily', from, to],
    queryFn: () => checkinApi.getDailyReport(from || undefined, to || undefined),
    retry: 0,
  });

  const {
    data: members,
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['att-report-members', from, to, search, tier, partnerId],
    queryFn: () =>
      checkinApi.getMemberAttendance({
        from: from || undefined,
        to: to || undefined,
        search: search || undefined,
        tier: partnerId ? undefined : tier || undefined,
        partnerId: partnerId || undefined,
      }),
    retry: 0,
  });

  // KPI theo hình thức check-in (tự quét, lễ tân, QR, khuôn mặt)
  const {
    data: attReport,
    isLoading: attLoading,
    isError: attError,
    refetch: refetchAtt,
  } = useQuery({
    queryKey: ['att-report-methods', from, to],
    queryFn: () => reportApi.attendance({ from: from || undefined, to: to || undefined }),
    retry: 0,
  });

  // Danh sách cơ sở theo hạng đang chọn (đã sắp theo hạng từ backend)
  const facilityOptions = (members?.facilityOptions ?? []).filter(
    (f) => !tier || (tier === 'NONE' ? !f.tier : f.tier === tier),
  );
  const facilityFiltered = Boolean(tier || partnerId);

  const methodTotal = attReport?.byMethod?.reduce((sum, m) => sum + m.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Báo cáo chuyên cần
        </h1>
        <p className="mt-1 text-sm text-muted">
          Thống kê lượt ra vào theo ngày và mức độ chuyên cần của từng hội viên.
        </p>
      </div>

      {/* Date range + search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarRange className="size-4 text-neon" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
              />
              <span className="text-xs text-muted">→</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-sm border border-line bg-ink px-2.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-neon/60"
              />
            </div>
            <div className="relative lg:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hội viên theo tên / mã / SĐT..."
                className="h-9 w-full rounded-sm border border-line bg-ink pl-9 pr-3 text-xs text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Tổng Lượt Check-in"
          value={daily?.summary?.totalCheckIns ?? 0}
          subtitle={`Trong khoảng ${formatDate(from)} → ${formatDate(to)}`}
          icon={QrCode}
          colorScheme="neon"
        />
        <StatCard
          title="Tổng Lượt Check-out"
          value={daily?.summary?.totalCheckOuts ?? 0}
          subtitle="Phiên tập đã kết thúc"
          icon={LogOut}
          colorScheme="amber"
        />
        <StatCard
          title="Đang Trong Phòng"
          value={daily?.summary?.currentlyInside ?? 0}
          subtitle="Tại thời điểm hiện tại"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Hội viên ghé thăm"
          value={members?.data?.length ?? 0}
          subtitle="Trong khoảng thời gian chọn"
          icon={UserCheck}
          colorScheme="purple"
        />
      </div>

      {/* KPI theo hình thức check-in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanFace className="size-4 text-neon" />
            Check-in theo hình thức
          </CardTitle>
          <CardDescription>
            Số lượt và tỷ lệ từng hình thức trong khoảng thời gian đã chọn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : attError ? (
            <ErrorState
              title="Không tải được số liệu"
              description="Không tải được thống kê theo hình thức check-in. Vui lòng thử lại."
              onRetry={() => refetchAtt()}
            />
          ) : !attReport?.byMethod?.length ? (
            <EmptyState
              icon={QrCode}
              title="Chưa có dữ liệu check-in"
              description="Khoảng thời gian này chưa ghi nhận lượt check-in nào."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {attReport.byMethod.map((m) => {
                const pct = methodTotal > 0 ? Math.round((m.count / methodTotal) * 100) : 0;
                return (
                  <div key={m.method} className="rounded-xl border border-line bg-ink p-4">
                    <p className="text-xs text-muted">
                      {CHECKIN_METHOD_LABEL[m.method] || m.method}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-chalk">
                      {m.count.toLocaleString('vi-VN')}
                      <span className="ml-1 text-xs font-medium text-muted">lượt</span>
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full ${m.method === 'FACE_ID' ? 'bg-neon' : 'bg-muted/60'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-neon">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-neon" />
            Check-in theo ngày
          </CardTitle>
          <CardDescription>Số lượt vào/ra mỗi ngày trong khoảng thời gian đã chọn</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dailyLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : dailyError ? (
            <ErrorState
              className="m-3"
              title="Không tải được báo cáo"
              description="Không tải được số liệu check-in theo ngày. Vui lòng thử lại."
              onRetry={() => refetchDaily()}
            />
          ) : !daily || daily.data.length === 0 ? (
            <EmptyState
              className="m-3"
              icon={BarChart3}
              title="Không có dữ liệu"
              description="Không có dữ liệu check-in trong khoảng thời gian này."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Ngày</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Tổng Check-in</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Tổng Check-out</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      Chênh lệch (đang ở lại)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {daily.data.map((d) => (
                    <tr key={d.date} className="transition-colors hover:bg-line/30">
                      <td className="py-2.5 px-4 font-semibold text-chalk">{formatDate(d.date)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-neon">{d.checkIns}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-muted">{d.checkOuts}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant={d.checkIns - d.checkOuts > 0 ? 'info' : 'outline'}>
                          {d.checkIns - d.checkOuts}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member attendance */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="size-4 text-neon" />
            Chuyên cần theo hội viên
          </CardTitle>
          <CardDescription>
            Hội viên đã tập ở cơ sở nào, số lượt, thời gian tập trung bình và lần tập gần nhất
          </CardDescription>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Select
              aria-label="Lọc theo hạng cơ sở"
              value={tier}
              onChange={(e) => {
                setTier(e.target.value as '' | AttendanceTierFilter);
                setPartnerId('');
              }}
              options={TIER_FILTER_OPTIONS}
            />
            <Select
              aria-label="Lọc theo cơ sở"
              value={partnerId}
              disabled={tier === 'SYSTEM'}
              onChange={(e) => setPartnerId(e.target.value)}
              options={[
                { value: '', label: 'Tất cả cơ sở' },
                ...facilityOptions.map((f) => ({
                  value: f.id,
                  label: `${f.name} · ${gymTierLabel(f.tier)}`,
                })),
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {membersLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : membersError ? (
            <ErrorState
              className="m-3"
              title="Không tải được báo cáo"
              description="Không tải được danh sách chuyên cần hội viên. Vui lòng thử lại."
              onRetry={() => refetchMembers()}
            />
          ) : !members || members.data.length === 0 ? (
            <EmptyState
              className="m-3"
              icon={Users}
              title="Không có hội viên"
              description={
                facilityFiltered
                  ? 'Không có hội viên nào tập ở cơ sở đã chọn trong khoảng thời gian này.'
                  : 'Không có hội viên nào tập trong khoảng thời gian này.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Hội viên</th>
                    <th className="py-2.5 px-4 font-semibold">Cơ sở đã tập</th>
                    <th className="py-2.5 px-4 font-semibold text-right">
                      {facilityFiltered ? 'Lượt tại cơ sở' : 'Tổng lượt'}
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-right">Thời gian TB/lượt</th>
                    <th className="py-2.5 px-4 font-semibold">Lần tập gần nhất</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {members.data.map((row) => (
                    <tr key={row.member.id} className="transition-colors hover:bg-line/30">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neon/30 bg-neon/10 text-[10px] font-bold uppercase text-neon">
                            {(row.member.fullName || '?').charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-chalk">
                              {row.member.fullName}
                            </p>
                            <p className="font-mono text-[10px] text-muted">{row.member.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {row.facilities.length === 0 ? (
                          <span className="text-xs text-muted">Chưa tập</span>
                        ) : (
                          <ul className="flex max-w-sm flex-wrap gap-1.5">
                            {row.facilities.map((f) => (
                              <li
                                key={f.id ?? 'SYSTEM'}
                                title={`Lần gần nhất: ${formatDate(f.lastVisit)}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink px-2.5 py-1 text-[11px] text-chalk"
                              >
                                <Building2 className="size-3 shrink-0 text-muted" />
                                <span className="max-w-[140px] truncate">{f.name}</span>
                                {f.id && (
                                  <span className="font-semibold text-neon">
                                    {gymTierLabel(f.tier)}
                                  </span>
                                )}
                                <span className="font-mono text-muted">×{f.visits}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant="outline">{row.totalVisits}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-chalk">
                        {formatDuration(row.avgDuration)}
                      </td>
                      <td className="whitespace-nowrap py-2.5 px-4 text-muted">
                        {formatDate(row.lastVisit)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/admin/members/${row.member.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline"
                        >
                          Xem <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
