'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '@/services/audit-log.service';
import type { AuditLogItem } from '@/services/types';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import { AUDIT_ACTION_META, AUDIT_ENTITY_LABEL, AUDIT_ROLE_LABEL } from '@/lib/status';
import { getStoredUser } from '@/lib/auth';
import {
  ScrollText,
  Search,
  FilterX,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  UserRound,
  Wifi,
} from 'lucide-react';

const LIMIT = 20;

const ENTITY_OPTIONS = [
  { value: '', label: 'Tất cả đối tượng' },
  ...Object.entries(AUDIT_ENTITY_LABEL).map(([value, label]) => ({ value, label })),
];

interface Filters {
  search: string;
  action: string;
  entity: string;
  from: string;
  to: string;
  reset: number;
}

const EMPTY_FILTERS: Filters = { search: '', action: '', entity: '', from: '', to: '', reset: 0 };

/** Định dạng metadata dạng key → value gọn cho tooltip/dialog */
function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const METADATA_LABELS: Record<string, string> = {
  from: 'Trạng thái trước',
  to: 'Trạng thái sau',
  reason: 'Lý do',
  fields: 'Trường thay đổi',
  days: 'Số ngày gia hạn',
  amount: 'Số tiền',
  code: 'Mã',
  method: 'Phương thức',
  memberName: 'Hội viên',
  memberCode: 'Mã hội viên',
  packageName: 'Gói tập',
  paymentCode: 'Mã hóa đơn',
  promotionCode: 'Mã khuyến mãi',
  transactionRef: 'Mã giao dịch',
  newEndDate: 'Hạn mới',
  branchName: 'Chi nhánh',
  equipmentCode: 'Mã thiết bị',
  specialization: 'Chuyên môn',
  role: 'Vai trò',
  email: 'Email',
  fullName: 'Họ tên',
  type: 'Loại',
  cost: 'Chi phí',
  markBroken: 'Đánh dấu hỏng',
  deactivateMembership: 'Vô hiệu gói tập',
  title: 'Tiêu đề',
  trainerId: 'Huấn luyện viên',
  startTime: 'Bắt đầu',
  endTime: 'Kết thúc',
  discountType: 'Loại giảm',
  newEquipmentStatus: 'Trạng thái thiết bị mới',
  softDeleted: 'Xóa mềm',
  via: 'Thực hiện qua',
};

function MetadataList({ item }: { item: AuditLogItem }) {
  const entries = useMemo(() => Object.entries(item.metadata || {}), [item.metadata]);
  if (entries.length === 0) {
    return <p className="text-xs text-muted">Không có dữ liệu chi tiết.</p>;
  }
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-line bg-ink/60 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {METADATA_LABELS[key] || key}
          </dt>
          <dd className="mt-0.5 break-words text-xs text-chalk">{formatMetadataValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AuditLogsPage() {
  const user = getStoredUser();
  const canView = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [detail, setDetail] = useState<AuditLogItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, applied],
    queryFn: () =>
      auditLogApi.getAll({
        page,
        limit: LIMIT,
        search: applied.search || undefined,
        action: applied.action || undefined,
        entity: applied.entity || undefined,
        from: applied.from ? new Date(`${applied.from}T00:00:00`).toISOString() : undefined,
        to: applied.to ? new Date(`${applied.to}T23:59:59`).toISOString() : undefined,
      }),
    enabled: canView,
    retry: 1,
  });

  // Đổi bộ lọc → quay về trang 1
  useEffect(() => {
    setPage(1);
  }, [applied]);

  const list = data?.data || [];
  const totalPages = Math.max(1, data?.totalPages || 1);

  // Ưu tiên action có thật trong DB, bổ sung các action đã định nghĩa trong hệ thống
  const actionOptions = useMemo(() => {
    const fromDb = data?.actions || [];
    const merged = Array.from(new Set([...fromDb, ...Object.keys(AUDIT_ACTION_META)]));
    return [
      { value: '', label: 'Tất cả hành động' },
      ...merged.sort().map((a) => ({ value: a, label: AUDIT_ACTION_META[a]?.label || a })),
    ];
  }, [data?.actions]);

  const applyFilters = () =>
    setApplied((f) => ({ search, action, entity, from, to, reset: f.reset + 1 }));

  const resetFilters = () => {
    setSearch('');
    setAction('');
    setEntity('');
    setFrom('');
    setTo('');
    setApplied((f) => ({ ...EMPTY_FILTERS, reset: f.reset + 1 }));
  };

  const actorLabel = (item: AuditLogItem) => {
    if (item.user) {
      return `${item.user.fullName} · ${AUDIT_ROLE_LABEL[item.user.role] || item.user.role}`;
    }
    return 'Hệ thống / không đăng nhập';
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
          <Lock className="size-7 text-danger" />
          <p className="font-display text-lg font-bold uppercase text-chalk">
            Không có quyền truy cập
          </p>
          <p className="max-w-md text-xs text-muted">
            Nhật ký hoạt động chỉ dành cho Quản trị viên và Quản lý. Liên hệ quản trị viên nếu bạn
            cần tra cứu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <ScrollText className="size-6 text-neon" /> Nhật ký hệ thống
        </h1>
        <p className="mt-1 text-xs text-muted">
          Mọi thao tác nhạy cảm (đăng nhập, hồ sơ hội viên, gói tập, thanh toán, check-in, lịch tập,
          thiết bị, khuyến mãi) đều được ghi lại để tra cứu và kiểm toán.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Tổng bản ghi"
          value={data?.total ?? 0}
          icon={ScrollText}
          colorScheme="neon"
          subtitle="Trong bộ lọc hiện tại"
        />
        <StatCard
          title="Loại hành động"
          value={data?.actions?.length ?? 0}
          icon={ShieldCheck}
          colorScheme="blue"
          subtitle="Đang có dữ liệu trong hệ thống"
        />
        <StatCard
          title="Đang hiển thị"
          value={list.length}
          icon={Eye}
          colorScheme="purple"
          subtitle={`Trang ${page}/${totalPages} · ${LIMIT} bản ghi mỗi trang`}
        />
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm theo hành động, đối tượng hoặc mã bản ghi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              options={actionOptions}
            />
            <Select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              options={ENTITY_OPTIONS}
            />
            {/* 2 input date: min-content ~165px mỗi cái → ở md (768px) cho chiếm nguyên hàng
                để không bị đẩy vỡ layout; từ lg mới xếp cạnh 2 cột select. */}
            <div className="flex min-w-0 items-center gap-2 md:col-span-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="Từ ngày"
                className="min-w-0 flex-1"
              />
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="Đến ngày"
                className="min-w-0 flex-1"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={applyFilters}>
              <Search className="size-3.5" /> Áp dụng bộ lọc
            </Button>
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <FilterX className="size-3.5" /> Đặt lại
            </Button>
            <span className="ml-auto self-center text-xs text-muted">
              Tổng cộng <b className="text-neon">{data?.total ?? 0}</b> bản ghi
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bảng dữ liệu */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-danger">Không tải được nhật ký hoạt động.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted">
              Chưa có bản ghi nhật ký nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-ink text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Hành động</th>
                    <th className="px-4 py-3">Đối tượng</th>
                    <th className="px-4 py-3">Người thực hiện</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {list.map((item) => {
                    const actionMeta = AUDIT_ACTION_META[item.action];
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-line/20">
                        <td className="whitespace-nowrap px-4 py-3 text-muted">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={actionMeta?.variant || 'outline'}>
                            {actionMeta?.label || item.action}
                          </Badge>
                          <span className="ml-2 font-mono text-[10px] text-muted/80">
                            {item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-chalk">
                          {AUDIT_ENTITY_LABEL[item.entity] || item.entity}
                          {item.entityId && (
                            <span className="ml-1 font-mono text-[10px] text-muted/70">
                              #{item.entityId.slice(-6)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="size-3.5" />
                            {actorLabel(item)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Wifi className="size-3.5" />
                            {item.ip || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetail(item)}
                            aria-label={`Xem chi tiết hành động ${item.action}`}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {!isLoading && !isError && (data?.total || 0) > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <p className="text-[11px] text-muted">
                Trang {data?.page ?? page}/{totalPages} · {data?.total ?? 0} bản ghi
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" /> Trước
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog chi tiết */}
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết hoạt động"
        description={detail ? `${detail.action} · ${detail.entity}` : undefined}
        className="max-w-2xl"
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Thời điểm
                </p>
                <p className="mt-0.5 text-chalk">{formatDateTime(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Người thực hiện
                </p>
                <p className="mt-0.5 text-chalk">{actorLabel(detail)}</p>
                {detail.user?.email && (
                  <p className="text-[11px] text-muted">{detail.user.email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Đối tượng
                </p>
                <p className="mt-0.5 text-chalk">
                  {AUDIT_ENTITY_LABEL[detail.entity] || detail.entity}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Mã bản ghi đối tượng
                </p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-chalk">
                  {detail.entityId || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Địa chỉ IP
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-chalk">{detail.ip || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Mã bản ghi
                </p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-chalk">{detail.id}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                Dữ liệu chi tiết
              </p>
              <MetadataList item={detail} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
