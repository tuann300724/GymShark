'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { equipmentApi } from '@/services/equipment.service';
import { branchApi } from '@/services/branch.service';
import { getStoredUser } from '@/lib/auth';
import {
  EQUIPMENT_STATUS_META,
  EQUIPMENT_CONDITION_META,
  EQUIPMENT_CATEGORY_META,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_TYPE_META,
} from '@/lib/status';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Dumbbell,
  Wrench,
  CheckCircle2,
  XCircle,
  Crown,
  PackageX,
  ShieldCheck,
  CalendarClock,
  Building2,
  MapPin,
  Hourglass,
  Hash,
} from 'lucide-react';
import type { EquipmentMaintenance } from '@/services/types';

const canManage = () => {
  const user = getStoredUser();
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
};

const canRequestMaintenance = () => {
  const user = getStoredUser();
  return canManage() || user?.role === 'STAFF';
};

const MAINTENANCE_TYPE_OPTIONS = Object.entries(MAINTENANCE_TYPE_META).map(([value, label]) => ({
  value,
  label,
}));

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const toast = useToast();
  const queryClient = useQueryClient();
  const [manage] = useState(canManage);
  const [canMaintenance] = useState(canRequestMaintenance);

  // Maintenance request dialog
  const [mtOpen, setMtOpen] = useState(false);
  const [mtForm, setMtForm] = useState({
    type: 'ROUTINE',
    maintenanceDate: '',
    cost: '',
    description: '',
    performedBy: '',
    nextDueDate: '',
  });
  const [mtError, setMtError] = useState('');

  // Complete dialog
  const [completeItem, setCompleteItem] = useState<EquipmentMaintenance | null>(null);
  const [completeForm, setCompleteForm] = useState({
    cost: '',
    nextDueDate: '',
    performedBy: '',
    description: '',
    markBroken: false,
  });
  const [completeError, setCompleteError] = useState('');

  const {
    data: eq,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['equipment-detail', id],
    queryFn: () => equipmentApi.detail(id),
    enabled: !!id,
  });

  const { data: branches } = useQuery({ queryKey: ['branches-list'], queryFn: branchApi.list });
  const { data: branchRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['detail-rooms', eq?.branchId],
    queryFn: () => branchApi.rooms(eq?.branchId || ''),
    enabled: false,
  });

  useEffect(() => {
    if (eq?.branchId) refetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eq?.branchId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: async (status: any) => equipmentApi.setStatus(id, status),
    onSuccess: (data) => {
      toast.success(data?.message || 'Đã cập nhật trạng thái.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      toast.error('Không đổi được trạng thái', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const mtSaveMutation = useMutation({
    mutationFn: async () => {
      if (!mtForm.description.trim()) throw new Error('Nhập mô tả công việc bảo trì.');
      return equipmentApi.createMaintenance({
        equipmentId: id,
        type: mtForm.type,
        maintenanceDate: mtForm.maintenanceDate || undefined,
        cost: mtForm.cost ? Number(mtForm.cost) : undefined,
        description: mtForm.description.trim(),
        performedBy: mtForm.performedBy.trim() || undefined,
        nextDueDate: mtForm.nextDueDate || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success('Đã ghi nhận phiếu bảo trì', data?.message);
      setMtOpen(false);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      setMtError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!completeItem) throw new Error('Thiếu phiếu bảo trì.');
      return equipmentApi.completeMaintenance(completeItem.id, {
        cost: completeForm.cost ? Number(completeForm.cost) : undefined,
        nextDueDate: completeForm.nextDueDate || undefined,
        performedBy: completeForm.performedBy.trim() || undefined,
        description: completeForm.description.trim() || undefined,
        markBroken: completeForm.markBroken,
      });
    },
    onSuccess: (data) => {
      toast.success(
        completeForm.markBroken
          ? 'Đã hoàn tất — thiết bị đánh dấu HỎNG'
          : 'Đã hoàn tất bảo trì — thiết bị SẴN SÀNG',
        data?.message,
      );
      setCompleteItem(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      setCompleteError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (mtId: string) => equipmentApi.cancelMaintenance(mtId),
    onSuccess: (data) => {
      toast.success('Đã hủy phiếu bảo trì', data?.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      toast.error('Không hủy được phiếu', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  if (isLoading || !eq) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <div className="py-20 text-center text-xs text-danger">Lỗi tải thông tin thiết bị.</div>;
  }

  const sMeta = EQUIPMENT_STATUS_META[eq.status] || { label: eq.status, variant: 'outline' };
  const cMeta = EQUIPMENT_CONDITION_META[eq.condition] || {
    label: eq.condition,
    variant: 'outline',
  };
  const maintenances = eq.maintenances || [];

  const infoItems = [
    { label: 'Nhóm thiết bị', value: EQUIPMENT_CATEGORY_META[eq.category] || eq.category },
    { label: 'Hãng', value: eq.brand || '—' },
    { label: 'Model', value: eq.model || '—' },
    { label: 'Số serial', value: eq.serialNumber || '—', mono: true },
    { label: 'Ngày mua', value: eq.purchaseDate ? formatDate(eq.purchaseDate) : '—' },
    { label: 'Giá mua', value: eq.purchasePrice ? formatCurrency(Number(eq.purchasePrice)) : '—' },
    {
      label: 'Bảo hành đến',
      value: eq.warrantyExpiry ? formatDate(eq.warrantyExpiry) : '—',
      highlight:
        eq.warrantyExpiry && new Date(eq.warrantyExpiry) < new Date(Date.now() + 30 * 86400000)
          ? 'text-amber-400'
          : '',
    },
    {
      label: 'Bảo trì tiếp theo',
      value: eq.nextMaintenanceAt ? formatDate(eq.nextMaintenanceAt) : '—',
      highlight:
        eq.nextMaintenanceAt && new Date(eq.nextMaintenanceAt) < new Date() ? 'text-danger' : '',
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/equipment"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-neon transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Quay lại danh sách thiết bị
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl border border-neon/25 bg-neon/10 shrink-0">
                <Dumbbell className="size-8 text-neon" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                    {eq.name}
                  </h1>
                  <Badge variant={sMeta.variant as any}>{sMeta.label}</Badge>
                  <Badge variant={cMeta.variant as any}>{cMeta.label}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-neon">{eq.code}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" /> {eq.branch?.name || '—'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {eq.room?.name || 'Chưa gán phòng'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canMaintenance && eq.status !== 'RETIRED' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMtOpen(true)}
                >
                  <Wrench className="size-3.5 mr-1.5" /> Yêu cầu bảo trì
                </Button>
              )}
              {manage && eq.status === 'BROKEN' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs"
                  isLoading={statusMutation.isPending === true}
                  onClick={() => statusMutation.mutate('AVAILABLE')}
                >
                  <Crown className="size-3.5 mr-1.5" /> Sửa xong • Sẵn sàng
                </Button>
              )}
              {manage && eq.status !== 'RETIRED' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Thanh lý thiết bị ${eq.name}? Không thể tạo phiếu bảo trì mới sau khi thanh lý.`,
                      )
                    ) {
                      statusMutation.mutate('RETIRED');
                    }
                  }}
                >
                  <PackageX className="size-3.5 mr-1.5" /> Thanh lý
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Hash className="size-4 text-neon" /> Thông số thiết bị
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {infoItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-ink p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted">{item.label}</p>
                <p
                  className={`font-semibold mt-0.5 ${item.mono ? 'font-mono text-xs text-neon' : 'text-sm text-chalk'} ${item.highlight || ''}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
            {eq.description && (
              <div className="sm:col-span-2 rounded-xl border border-line bg-ink p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted">Ghi chú</p>
                <p className="text-sm text-muted mt-0.5">{eq.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="size-4 text-neon" /> Trạng thái hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
              <span>Trạng thái</span>
              <Badge variant={sMeta.variant as any}>{sMeta.label}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
              <span>Tình trạng vật lý</span>
              <Badge variant={cMeta.variant as any}>{cMeta.label}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2">
              <span>Lần bảo trì cuối</span>
              <span className="text-chalk">
                {eq.lastMaintenanceAt ? formatDate(eq.lastMaintenanceAt) : '—'}
              </span>
            </div>
            {manage && (
              <div className="pt-2 border-t border-line flex flex-wrap gap-2">
                {eq.status !== 'AVAILABLE' && eq.status !== 'RETIRED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => statusMutation.mutate('AVAILABLE')}
                  >
                    Đánh dấu Sẵn sàng
                  </Button>
                )}
                {eq.status !== 'BROKEN' && eq.status !== 'RETIRED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-danger"
                    onClick={() => {
                      if (window.confirm(`Đánh dấu ${eq.name} bị HỎNG?`))
                        statusMutation.mutate('BROKEN');
                    }}
                  >
                    Đánh dấu Hỏng
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Maintenance history */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="size-4 text-neon" /> Lịch sử bảo trì
            </CardTitle>
            <CardDescription>{maintenances.length} phiếu bảo trì của thiết bị</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {maintenances.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              <Wrench className="mx-auto size-8 text-muted/40 mb-2" />
              Chưa có phiếu bảo trì nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-2.5 px-4">Ngày</th>
                    <th className="py-2.5 px-4">Loại</th>
                    <th className="py-2.5 px-4">Mô tả</th>
                    <th className="py-2.5 px-4">Chi phí</th>
                    <th className="py-2.5 px-4">Người thực hiện</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {maintenances.map((mt) => {
                    const meta = MAINTENANCE_STATUS_META[mt.status] || {
                      label: mt.status,
                      variant: 'outline',
                    };
                    const pending = mt.status === 'IN_PROGRESS' || mt.status === 'SCHEDULED';
                    return (
                      <tr key={mt.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-2.5 px-4 text-muted">
                          {formatDateTime(mt.maintenanceDate)}
                          {mt.nextDueDate && (
                            <p className="text-[10px] text-amber-400">
                              Tiếp: {formatDate(mt.nextDueDate)}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-muted">
                          {MAINTENANCE_TYPE_META[mt.type] || mt.type}
                        </td>
                        <td className="py-2.5 px-4 text-muted max-w-[260px]">{mt.description}</td>
                        <td className="py-2.5 px-4 text-chalk">
                          {mt.cost ? formatCurrency(Number(mt.cost)) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-muted">{mt.performedBy || '—'}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={meta.variant as any}>{meta.label}</Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {pending && canManage() && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-xs text-neon"
                                  title="Hoàn tất phiếu"
                                  onClick={() => {
                                    setCompleteItem(mt);
                                    setCompleteForm({
                                      cost: mt.cost ? String(mt.cost) : '',
                                      nextDueDate: mt.nextDueDate
                                        ? mt.nextDueDate.slice(0, 10)
                                        : '',
                                      performedBy: mt.performedBy || '',
                                      description: '',
                                      markBroken: false,
                                    });
                                    setCompleteError('');
                                  }}
                                >
                                  <CheckCircle2 className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-xs text-danger"
                                  title="Hủy phiếu"
                                  onClick={() => {
                                    if (window.confirm('Hủy phiếu bảo trì này?'))
                                      cancelMutation.mutate(mt.id);
                                  }}
                                >
                                  <XCircle className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance request dialog */}
      <Dialog
        open={mtOpen}
        onClose={() => !mtSaveMutation.isPending && setMtOpen(false)}
        title="Yêu cầu bảo trì thiết bị"
        description={`Tạo phiếu bảo trì cho ${eq.name} (${eq.code}). Trạng thái IN_PROGRESS sẽ chuyển thiết bị sang MAINTENANCE.`}
        className="max-w-2xl"
      >
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Loại bảo trì"
            value={mtForm.type}
            onChange={(e) => setMtForm((f) => ({ ...f, type: e.target.value }))}
            options={MAINTENANCE_TYPE_OPTIONS}
          />
          <Input
            label="Ngày thực hiện"
            type="date"
            value={mtForm.maintenanceDate}
            onChange={(e) => setMtForm((f) => ({ ...f, maintenanceDate: e.target.value }))}
          />
          <Input
            label="Chi phí (VNĐ)"
            type="number"
            value={mtForm.cost}
            onChange={(e) => setMtForm((f) => ({ ...f, cost: e.target.value }))}
            placeholder="500000"
          />
          <Input
            label="Người thực hiện"
            value={mtForm.performedBy}
            onChange={(e) => setMtForm((f) => ({ ...f, performedBy: e.target.value }))}
            placeholder="Nội bộ / đối tác"
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Mô tả công việc *"
              rows={3}
              value={mtForm.description}
              onChange={(e) => setMtForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="VD: Thay băng tải, vệ sinh động cơ..."
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Bảo trì lần sau"
              type="date"
              value={mtForm.nextDueDate}
              onChange={(e) => setMtForm((f) => ({ ...f, nextDueDate: e.target.value }))}
            />
          </div>
        </div>
        {mtError && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {mtError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMtOpen(false)}
            disabled={mtSaveMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={mtSaveMutation.isPending}
            onClick={() => mtSaveMutation.mutate()}
          >
            Gửi yêu cầu
          </Button>
        </div>
      </Dialog>

      {/* Complete dialog */}
      <Dialog
        open={!!completeItem}
        onClose={() => !completeMutation.isPending && setCompleteItem(null)}
        title="Hoàn tất phiếu bảo trì"
        description="Chọn kết quả: thiết bị hoạt động tốt (AVAILABLE) hoặc vẫn hỏng (BROKEN)."
        className="max-w-2xl"
      >
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Chi phí thực tế (VNĐ)"
            type="number"
            value={completeForm.cost}
            onChange={(e) => setCompleteForm((f) => ({ ...f, cost: e.target.value }))}
          />
          <Input
            label="Bảo trì lần sau"
            type="date"
            value={completeForm.nextDueDate}
            onChange={(e) => setCompleteForm((f) => ({ ...f, nextDueDate: e.target.value }))}
          />
          <Input
            label="Người thực hiện"
            value={completeForm.performedBy}
            onChange={(e) => setCompleteForm((f) => ({ ...f, performedBy: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Kết quả xử lý"
              rows={2}
              value={completeForm.description}
              onChange={(e) => setCompleteForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Replaced belt, motor ok..."
            />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={completeForm.markBroken}
              onChange={(e) => setCompleteForm((f) => ({ ...f, markBroken: e.target.checked }))}
              className="accent-neon"
            />
            <span className="text-xs font-semibold text-danger">
              Thiết bị vẫn hỏng — đánh dấu BROKEN
            </span>
          </label>
        </div>
        {completeError && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {completeError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCompleteItem(null)}
            disabled={completeMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            {completeForm.markBroken ? 'Hoàn tất • Hỏng' : 'Hoàn tất • Sẵn sàng'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
