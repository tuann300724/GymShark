'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { equipmentApi } from '@/services/equipment.service';
import { branchApi } from '@/services/branch.service';
import { getStoredUser } from '@/lib/auth';
import {
  EQUIPMENT_STATUS_META,
  EQUIPMENT_CONDITION_META,
  EQUIPMENT_CATEGORY_META,
  MAINTENANCE_TYPE_META,
} from '@/lib/status';
import { formatDate, formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
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
  Dumbbell,
  Plus,
  Search,
  Pencil,
  Power,
  CalendarClock,
  Wrench,
  AlertTriangle,
  ShieldAlert,
  Crown,
  Boxes,
  Cog,
  XCircle,
  PackageX,
} from 'lucide-react';
import type {
  Equipment,
  EquipmentCategoryValue,
  EquipmentConditionValue,
  EquipmentStatusValue,
} from '@/services/types';

const canManage = () => {
  const user = getStoredUser();
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
};

const canRequestMaintenance = () => {
  const user = getStoredUser();
  return canManage() || user?.role === 'STAFF';
};

const CATEGORY_OPTIONS = Object.entries(EQUIPMENT_CATEGORY_META).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'BROKEN', label: 'Hỏng' },
  { value: 'RETIRED', label: 'Đã thanh lý' },
];

const CONDITION_OPTIONS = Object.entries(EQUIPMENT_CONDITION_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const MAINTENANCE_TYPE_OPTIONS = Object.entries(MAINTENANCE_TYPE_META).map(([value, label]) => ({
  value,
  label,
}));

interface EquipmentFormState {
  code: string;
  name: string;
  category: string;
  branchId: string;
  roomId: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyExpiry: string;
  status: string;
  condition: string;
  nextMaintenanceAt: string;
  description: string;
}

const emptyForm: EquipmentFormState = {
  code: '',
  name: '',
  category: 'CARDIO',
  branchId: '',
  roomId: '',
  brand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  purchasePrice: '',
  warrantyExpiry: '',
  status: 'AVAILABLE',
  condition: 'GOOD',
  nextMaintenanceAt: '',
  description: '',
};

interface MaintenanceFormState {
  equipmentId: string;
  type: string;
  maintenanceDate: string;
  cost: string;
  description: string;
  performedBy: string;
  nextDueDate: string;
}

const emptyMaintenance: MaintenanceFormState = {
  equipmentId: '',
  type: 'ROUTINE',
  maintenanceDate: '',
  cost: '',
  description: '',
  performedBy: '',
  nextDueDate: '',
};

export default function EquipmentPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [manage] = useState(canManage);
  const [canMaintenance] = useState(canRequestMaintenance);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // CRUD dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [formError, setFormError] = useState('');

  // Maintenance dialog
  const [mtDialogOpen, setMtDialogOpen] = useState(false);
  const [mtForm, setMtForm] = useState<MaintenanceFormState>(emptyMaintenance);
  const [mtError, setMtError] = useState('');

  const { data: stats } = useQuery({ queryKey: ['equipment-stats'], queryFn: equipmentApi.stats });
  const { data: alerts } = useQuery({
    queryKey: ['equipment-alerts'],
    queryFn: equipmentApi.alerts,
  });
  const { data: branches } = useQuery({ queryKey: ['branches-list'], queryFn: branchApi.list });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['equipment-list', page, search, category, status, branchFilter],
    queryFn: () =>
      equipmentApi.list({
        page,
        limit: 10,
        search: search || undefined,
        category: category === 'ALL' ? undefined : category,
        status: status === 'ALL' ? undefined : status,
        branchId: branchFilter === 'ALL' ? undefined : branchFilter,
      }),
  });

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;

  // Rooms để chọn theo branch
  const { data: branchRooms, refetch: refetchRooms } = useQuery({
    queryKey: ['dialog-rooms', form.branchId],
    queryFn: () => branchApi.rooms(form.branchId),
    enabled: false,
  });

  useEffect(() => {
    if (form.branchId) refetchRooms();
    else setForm((f) => ({ ...f, roomId: '' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.branchId]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
        category: editing.category,
        branchId: editing.branchId,
        roomId: editing.roomId || '',
        brand: editing.brand || '',
        model: editing.model || '',
        serialNumber: editing.serialNumber || '',
        purchaseDate: editing.purchaseDate ? editing.purchaseDate.slice(0, 10) : '',
        purchasePrice: editing.purchasePrice ? String(editing.purchasePrice) : '',
        warrantyExpiry: editing.warrantyExpiry ? editing.warrantyExpiry.slice(0, 10) : '',
        status: editing.status,
        condition: editing.condition,
        nextMaintenanceAt: editing.nextMaintenanceAt ? editing.nextMaintenanceAt.slice(0, 10) : '',
        description: editing.description || '',
      });
    } else {
      setForm({ ...emptyForm, branchId: branches?.[0]?.id || '' });
    }
    setFormError('');
  }, [dialogOpen, editing, branches]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-list'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['equipment-maintenance'] });
    queryClient.invalidateQueries({ queryKey: ['branch-equipment'] });
    queryClient.invalidateQueries({ queryKey: ['reports-equipment'] });
    queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim() || !form.branchId) {
        throw new Error('Điền đủ mã thiết bị, tên và chi nhánh.');
      }
      const payload: any = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        branchId: form.branchId,
        roomId: form.roomId || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        purchaseDate: form.purchaseDate || undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
        status: form.status,
        condition: form.condition,
        nextMaintenanceAt: form.nextMaintenanceAt || undefined,
        description: form.description.trim() || undefined,
      };
      return editing ? equipmentApi.update(editing.id, payload) : equipmentApi.create(payload);
    },
    onSuccess: (data) => {
      toast.success(editing ? 'Đã cập nhật thiết bị' : 'Đã khai báo thiết bị mới', data?.message);
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thao tác thất bại.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EquipmentStatusValue }) =>
      equipmentApi.setStatus(id, status),
    onSuccess: (data) => {
      toast.success(data?.message || 'Đã cập nhật trạng thái thiết bị.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      toast.error('Không đổi được trạng thái', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => equipmentApi.remove(id),
    onSuccess: (data) => {
      toast.success('Đã thanh lý thiết bị', data?.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể thanh lý.';
      toast.error('Không thể thanh lý', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const mtSaveMutation = useMutation({
    mutationFn: async () => {
      if (!mtForm.equipmentId || !mtForm.description.trim()) {
        throw new Error('Chọn thiết bị và nhập mô tả công việc.');
      }
      return equipmentApi.createMaintenance({
        equipmentId: mtForm.equipmentId,
        type: mtForm.type,
        maintenanceDate: mtForm.maintenanceDate || undefined,
        cost: mtForm.cost ? Number(mtForm.cost) : undefined,
        description: mtForm.description.trim(),
        performedBy: mtForm.performedBy.trim() || undefined,
        nextDueDate: mtForm.nextDueDate || undefined,
      });
    },
    onSuccess: (data) => {
      toast.success('Đã ghi nhận yêu cầu bảo trì', data?.message);
      setMtDialogOpen(false);
      setMtForm(emptyMaintenance);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      setMtError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openMaintenance = (eq: Equipment) => {
    setMtForm({ ...emptyMaintenance, equipmentId: eq.id, type: 'ROUTINE' });
    setMtError('');
    setMtDialogOpen(true);
  };

  const statCards = [
    {
      title: 'Tổng Thiết Bị',
      value: stats?.total ?? 0,
      icon: Boxes,
      color: 'neon' as const,
      subtitle: `${stats?.byCondition?.GOOD ?? 0} thiết bị tình trạng tốt`,
    },
    {
      title: 'Sẵn Sàng',
      value: stats?.available ?? 0,
      icon: Dumbbell,
      color: 'neon' as const,
      subtitle: 'Có thể sử dụng ngay',
    },
    { title: 'Đang Sử Dụng', value: stats?.inUse ?? 0, icon: Power, color: 'blue' as const },
    {
      title: 'Đang Bảo Trì',
      value: stats?.maintenance ?? 0,
      icon: Wrench,
      color: 'amber' as const,
      subtitle: `${stats?.maintenanceThisMonth ?? 0} phiếu trong tháng`,
    },
    {
      title: 'Hỏng',
      value: stats?.broken ?? 0,
      icon: AlertTriangle,
      color: 'rose' as const,
      subtitle: 'Cần sửa chữa gấp',
    },
    { title: 'Đã Thanh Lý', value: stats?.retired ?? 0, icon: PackageX, color: 'purple' as const },
  ];

  const alertCounts = alerts?.counts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-chalk flex items-center gap-2">
            <Dumbbell className="size-6 text-neon" />
            Quản Lý Thiết Bị
          </h1>
          <p className="text-xs text-muted mt-1">
            Thiết bị, vòng đời (AVAILABLE → MAINTENANCE → BROKEN/RETIRED) và lịch bảo trì toàn hệ
            thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canMaintenance && (
            <Button
              variant="secondary"
              size="md"
              className="font-semibold text-xs"
              onClick={() => setMtDialogOpen(true)}
            >
              <Wrench className="size-4 mr-1.5" />
              Yêu Cầu Bảo Trì
            </Button>
          )}
          {manage && (
            <Button
              variant="primary"
              size="md"
              className="font-semibold text-xs"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4 mr-1.5" />
              Khai Báo Thiết Bị
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c) => (
          <StatCard
            key={c.title}
            title={c.title}
            value={c.value}
            icon={c.icon}
            colorScheme={c.color}
            subtitle={c.subtitle}
          />
        ))}
      </div>

      {/* Alerts */}
      {alertCounts && alertCounts.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <AlertCard
            icon={Cog}
            label="Bảo trì quá hạn"
            count={alertCounts.overdue}
            tone="danger"
            href={alertCounts.overdue > 0 ? '/admin/equipment?alert=overdue' : undefined}
          />
          <AlertCard
            icon={CalendarClock}
            label="Bảo trì sắp tới (14 ngày)"
            count={alertCounts.upcoming}
            tone="warning"
            href={alertCounts.upcoming > 0 ? '/admin/equipment?alert=upcoming' : undefined}
          />
          <AlertCard
            icon={AlertTriangle}
            label="Thiết bị hỏng"
            count={alertCounts.broken}
            tone="danger"
            href={alertCounts.broken > 0 ? '/admin/equipment?alert=broken' : undefined}
          />
          <AlertCard
            icon={ShieldAlert}
            label="Sắp hết bảo hành (30 ngày)"
            count={alertCounts.warranty}
            tone="warning"
            href={alertCounts.warranty > 0 ? '/admin/equipment?alert=warranty' : undefined}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Tìm mã hoặc tên thiết bị..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10"
              />
            </div>
            <Select
              label="Nhóm thiết bị"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[{ value: 'ALL', label: 'Tất cả nhóm' }, ...CATEGORY_OPTIONS]}
              className="h-10"
            />
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, ...STATUS_OPTIONS]}
              className="h-10"
            />
            <Select
              label="Chi nhánh"
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'Tất cả chi nhánh' },
                ...(branches || []).map((b) => ({ value: b.id, label: b.name })),
              ]}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-xs text-danger">Lỗi tải danh sách thiết bị.</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">
              <Dumbbell className="mx-auto size-10 text-muted/40 mb-3" />
              Không có thiết bị phù hợp.{manage && ' Nhấn "Khai Báo Thiết Bị" để thêm mới.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                  <tr>
                    <th className="py-3 px-4">Thiết bị</th>
                    <th className="py-3 px-4">Chi nhánh</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Tình trạng</th>
                    <th className="py-3 px-4">Bảo trì tiếp</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((eq) => {
                    const sMeta = EQUIPMENT_STATUS_META[eq.status] || {
                      label: eq.status,
                      variant: 'outline',
                    };
                    const cMeta = EQUIPMENT_CONDITION_META[eq.condition] || {
                      label: eq.condition,
                      variant: 'outline',
                    };
                    return (
                      <tr key={eq.id} className="hover:bg-line/20 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/equipment/${eq.id}`}
                            className="block hover:opacity-90"
                          >
                            <p className="font-semibold text-chalk">{eq.name}</p>
                            <p className="font-mono text-[11px] text-neon">
                              {eq.code}
                              {eq.serialNumber ? ` • SN:${eq.serialNumber}` : ''}
                            </p>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted">{eq.branch?.name || '—'}</td>
                        <td className="py-3 px-4 text-muted">{eq.room?.name || '—'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={sMeta.variant as any}>{sMeta.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={cMeta.variant as any}>{cMeta.label}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {eq.nextMaintenanceAt ? formatDate(eq.nextMaintenanceAt) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/equipment/${eq.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-xs"
                                title="Chi tiết"
                              >
                                <Search className="size-3.5" />
                              </Button>
                            </Link>
                            {canMaintenance && eq.status !== 'RETIRED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-xs text-amber-400"
                                title="Yêu cầu bảo trì"
                                onClick={() => openMaintenance(eq)}
                              >
                                <Wrench className="size-3.5" />
                              </Button>
                            )}
                            {manage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-xs"
                                  title="Chỉnh sửa"
                                  onClick={() => {
                                    setEditing(eq);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                {eq.status === 'BROKEN' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-xs text-neon"
                                    title="Sửa xong → Sẵn sàng"
                                    onClick={() =>
                                      statusMutation.mutate({ id: eq.id, status: 'AVAILABLE' })
                                    }
                                  >
                                    <Crown className="size-3.5" />
                                  </Button>
                                )}
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

          {/* Pagination */}
          {!isLoading && items.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-line">
              <p className="text-[11px] text-muted">
                Trang {data?.page ?? 1}/{totalPages} • {data?.total ?? 0} thiết bị
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRUD Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saveMutation.isPending && setDialogOpen(false)}
        title={editing ? 'Cập nhật thiết bị' : 'Khai báo thiết bị mới'}
        description="Mã thiết bị unique toàn hệ thống; serialNumber (nếu có) cũng phải unique."
        className="max-w-3xl"
      >
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mã thiết bị *"
            value={form.code}
            className="font-mono"
            disabled={!!editing}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="EQ-RUN-02"
          />
          <Input
            label="Tên thiết bị *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Máy chạy bộ điện"
          />
          <Select
            label="Nhóm thiết bị"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={CATEGORY_OPTIONS}
          />
          <Select
            label="Chi nhánh *"
            value={form.branchId}
            onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value, roomId: '' }))}
            options={(branches || []).map((b) => ({ value: b.id, label: `${b.name} (${b.code})` }))}
          />
          <Select
            label="Phòng"
            value={form.roomId}
            onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            options={[
              { value: '', label: '— Không gán phòng —' },
              ...(branchRooms || []).map((r) => ({
                value: r.id,
                label: `${r.name} (${r.code || 'no-code'})`,
              })),
            ]}
          />
          <Input
            label="Mã vạch / Số serial"
            value={form.serialNumber}
            onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
            className="font-mono"
            placeholder="SN-2026-0001 (unique)"
          />
          <Input
            label="Hãng"
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            placeholder="Technogym"
          />
          <Input
            label="Model"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            placeholder="Run Now 500"
          />
          <Input
            label="Ngày mua"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
          />
          <Input
            label="Giá mua (VNĐ)"
            type="number"
            value={form.purchasePrice}
            onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
            placeholder="25000000"
          />
          <Input
            label="Hết hạn bảo hành"
            type="date"
            value={form.warrantyExpiry}
            onChange={(e) => setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))}
          />
          <Input
            label="Bảo trì định kỳ tiếp theo"
            type="date"
            value={form.nextMaintenanceAt}
            onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceAt: e.target.value }))}
          />
          <Select
            label="Trạng thái"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Tình trạng"
            value={form.condition}
            onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            options={CONDITION_OPTIONS}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Ghi chú"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Năm sản xuất, trạm bảo trì, ghi chú khác..."
            />
          </div>
        </div>
        {formError && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {formError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(false)}
            disabled={saveMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {editing ? 'Lưu thay đổi' : 'Tạo thiết bị'}
          </Button>
        </div>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog
        open={mtDialogOpen}
        onClose={() => !mtSaveMutation.isPending && setMtDialogOpen(false)}
        title="Yêu cầu bảo trì thiết bị"
        description="Tạo phiếu bảo trì. IN_PROGRESS sẽ chuyển thiết bị sang trạng thái MAINTENANCE."
        className="max-w-2xl"
      >
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Thiết bị *"
            value={mtForm.equipmentId}
            onChange={(e) => setMtForm((f) => ({ ...f, equipmentId: e.target.value }))}
            options={(items.length ? items : []).map((eq) => ({
              value: eq.id,
              label: `${eq.name} (${eq.code})`,
            }))}
          />
          {mtForm.equipmentId === '' && items.length === 0 && (
            <p className="text-[11px] text-amber-400 self-end">
              Không có thiết bị để chọn — hãy tải danh sách có filter phù hợp hoặc bỏ bớt bộ lọc.
            </p>
          )}
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
          <div className="sm:col-span-2">
            <Textarea
              label="Mô tả công việc *"
              rows={3}
              value={mtForm.description}
              onChange={(e) => setMtForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="VD: Thay băng tải, bơm dầu, kiểm tra động cơ..."
            />
          </div>
          <Input
            label="Người thực hiện"
            value={mtForm.performedBy}
            onChange={(e) => setMtForm((f) => ({ ...f, performedBy: e.target.value }))}
            placeholder="Công ty bảo trì / nội bộ"
          />
          <Input
            label="Bảo trì lần sau"
            type="date"
            value={mtForm.nextDueDate}
            onChange={(e) => setMtForm((f) => ({ ...f, nextDueDate: e.target.value }))}
          />
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
            onClick={() => setMtDialogOpen(false)}
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
    </div>
  );
}

function AlertCard({
  icon: Icon,
  label,
  count,
  tone,
  href,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  tone: 'danger' | 'warning';
  href?: string;
}) {
  const inner = (
    <Card
      className={`${count > 0 ? (tone === 'danger' ? 'border-danger/40' : 'border-amber-500/40') : ''} hover:border-line/80 transition-colors`}
    >
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2 rounded-lg shrink-0 ${tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-amber-500/10 text-amber-400'}`}
          >
            <Icon className="size-4" />
          </div>
          <p className="text-xs font-semibold text-chalk">{label}</p>
        </div>
        <span
          className={`font-display text-xl font-bold ${count > 0 ? (tone === 'danger' ? 'text-danger' : 'text-amber-400') : 'text-muted'}`}
        >
          {count}
        </span>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
