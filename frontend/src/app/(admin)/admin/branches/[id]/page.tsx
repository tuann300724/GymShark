'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { branchApi } from '@/services/branch.service';
import { equipmentApi } from '@/services/equipment.service';
import { trainingApi } from '@/services/training.service';
import { getStoredUser } from '@/lib/auth';
import {
  BRANCH_STATUS_META,
  ROOM_STATUS_META,
  ROOM_TYPE_META,
  SESSION_STATUS_META,
  SESSION_TYPE_META,
  MEMBERSHIP_STATUS_META,
} from '@/lib/status';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
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
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  LayoutGrid,
  Dumbbell,
  CalendarDays,
  QrCode,
  DollarSign,
  Plus,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { Branch, Room } from '@/services/types';

const canManage = () => {
  const user = getStoredUser();
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
};

type TabKey = 'overview' | 'rooms' | 'equipment' | 'schedules' | 'members';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Tổng quan', icon: Building2 },
  { key: 'rooms', label: 'Phòng tập', icon: LayoutGrid },
  { key: 'equipment', label: 'Thiết bị', icon: Dumbbell },
  { key: 'schedules', label: 'Lịch tập', icon: CalendarDays },
  { key: 'members', label: 'Hội viên', icon: Users },
];

export default function BranchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const {
    data: branch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['branch-detail', id],
    queryFn: () => branchApi.detail(id),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['branch-stats', id],
    queryFn: () => branchApi.stats(id),
    enabled: !!id,
  });

  if (isLoading || !branch) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="py-20 text-center text-xs text-danger">Lỗi tải chi nhánh.</div>;
  }

  const meta = BRANCH_STATUS_META[branch.status] || { label: branch.status, variant: 'outline' };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/branches"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-neon transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Quay lại danh sách chi nhánh
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl border border-neon/25 bg-neon/10 shrink-0">
                <Building2 className="size-8 text-neon" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk">
                    {branch.name}
                  </h1>
                  <Badge variant={meta.variant as any}>{meta.label}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-neon">{branch.code}</p>
                <div className="mt-2 space-y-1 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {branch.address}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {branch.phone}
                  </p>
                  {branch.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {branch.email}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {branch.openingHours ||
                      `${branch.openingTime || '--:--'} - ${branch.closingTime || '--:--'}`}
                  </p>
                </div>
              </div>
            </div>
            {canManage() && <BranchActions branch={branch} />}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hội Viên"
          value={stats?.totalMembers ?? branch._count?.members ?? 0}
          subtitle={`${stats?.activeMembers ?? 0} đang có thẻ hiệu lực`}
          icon={Users}
          colorScheme="neon"
        />
        <StatCard
          title="Doanh Thu Tháng"
          value={formatCurrency(stats?.revenueThisMonth ?? 0)}
          subtitle="Hóa đơn PAID trong tháng"
          icon={DollarSign}
          colorScheme="blue"
        />
        <StatCard
          title="Check-in Hôm Nay"
          value={stats?.checkInsToday ?? 0}
          subtitle={`${stats?.upcomingSessions ?? 0} buổi tập sắp diễn ra`}
          icon={QrCode}
          colorScheme="amber"
        />
        <StatCard
          title="Cơ Sở Vật Chất"
          value={`${stats?.roomAvailable ?? 0}/${stats?.roomCount ?? 0}`}
          subtitle={`${stats?.equipmentCount ?? 0} thiết bị • ${stats?.totalTrainers ?? 0} HLV`}
          icon={LayoutGrid}
          colorScheme="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === t.key ? 'bg-neon text-ink' : 'text-muted hover:text-chalk'
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab branch={branch} stats={stats} />}
      {activeTab === 'rooms' && <RoomsTab branchId={id} />}
      {activeTab === 'equipment' && <EquipmentTab branchId={id} />}
      {activeTab === 'schedules' && <ScheduleTab branchId={id} />}
      {activeTab === 'members' && <MembersTab branchId={id} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Branch actions (activate / deactivate / delete)
// ---------------------------------------------------------------------------
function BranchActions({ branch }: { branch: Branch }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['branch-detail'] });
    queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
    queryClient.invalidateQueries({ queryKey: ['branches-list'] });
    queryClient.invalidateQueries({ queryKey: ['reports-branches'] });
  };

  const statusMutation = useMutation({
    mutationFn: async (status: 'ACTIVE' | 'INACTIVE') => branchApi.setStatus(branch.id, status),
    onSuccess: (data) => {
      toast.success(data?.message || 'Đã đổi trạng thái.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      toast.error('Không đổi được trạng thái', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => branchApi.remove(branch.id),
    onSuccess: (data) => {
      toast.success('Đã xóa chi nhánh', data?.message);
      router.push('/admin/branches');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa.';
      toast.error('Không thể xóa', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <div className="flex items-center gap-2">
      {branch.status === 'ACTIVE' ? (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          isLoading={statusMutation.isPending}
          onClick={() => statusMutation.mutate('INACTIVE')}
        >
          <PowerOff className="size-3.5 mr-1.5" />
          Ngừng hoạt động
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs"
          isLoading={statusMutation.isPending}
          onClick={() => statusMutation.mutate('ACTIVE')}
        >
          <Power className="size-3.5 mr-1.5 text-neon" />
          Kích hoạt lại
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-danger"
        isLoading={deleteMutation.isPending}
        onClick={() => {
          if (
            window.confirm(
              `Xóa chi nhánh ${branch.name}? Chỉ thực hiện được khi không còn dữ liệu liên quan (nên dùng INACTIVE).`,
            )
          ) {
            deleteMutation.mutate();
          }
        }}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function OverviewTab({ branch, stats }: { branch: Branch; stats?: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-bold text-chalk">Thông tin chi nhánh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-ink p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">Mã chi nhánh</p>
              <p className="font-mono text-chalk font-semibold mt-0.5">{branch.code}</p>
            </div>
            <div className="rounded-xl border border-line bg-ink p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">Sức chứa phòng</p>
              <p className="text-chalk font-semibold mt-0.5">
                {stats?.roomCount ?? 0} phòng • {stats?.roomAvailable ?? 0} sẵn sàng
              </p>
            </div>
          </div>
          {branch.description && <p className="text-muted leading-relaxed">{branch.description}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-chalk">Cảnh báo thiết bị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(stats?.equipmentByStatus ?? {}).length === 0 ? (
            <p className="text-xs text-muted">Chưa có thiết bị tại chi nhánh.</p>
          ) : (
            Object.entries(stats.equipmentByStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2"
              >
                <span className="text-xs text-muted">{status}</span>
                <span className="font-mono text-sm font-bold text-chalk">{String(count)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rooms tab (CRUD room theo branch)
// ---------------------------------------------------------------------------
interface RoomFormState {
  code: string;
  name: string;
  type: string;
  capacity: string;
  floor: string;
  description: string;
}

const emptyRoom: RoomFormState = {
  code: '',
  name: '',
  type: 'GYM_AREA',
  capacity: '20',
  floor: '',
  description: '',
};

const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_META).map(([value, label]) => ({
  value,
  label,
}));

function RoomsTab({ branchId }: { branchId: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [manage] = useState(canManage);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomFormState>(emptyRoom);
  const [error, setError] = useState('');

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['branch-rooms', branchId],
    queryFn: () => branchApi.rooms(branchId),
    enabled: !!branchId,
  });

  useEffect(() => {
    if (!dialogOpen) return;
    if (editing) {
      setForm({
        code: editing.code || '',
        name: editing.name,
        type: editing.type,
        capacity: String(editing.capacity ?? 20),
        floor: editing.floor || '',
        description: editing.description || '',
      });
    } else {
      setForm(emptyRoom);
    }
    setError('');
  }, [dialogOpen, editing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['branch-rooms', branchId] });
    queryClient.invalidateQueries({ queryKey: ['branch-detail', branchId] });
    queryClient.invalidateQueries({ queryKey: ['branch-stats', branchId] });
    queryClient.invalidateQueries({ queryKey: ['branches-list'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim() || !form.name.trim()) throw new Error('Điền đủ mã phòng và tên phòng.');
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        capacity: parseInt(form.capacity, 10) || 20,
        floor: form.floor.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      return editing
        ? branchApi.updateRoom(branchId, editing.id, payload)
        : branchApi.createRoom(branchId, payload);
    },
    onSuccess: (data) => {
      toast.success(editing ? 'Đã cập nhật phòng' : 'Đã tạo phòng mới', data?.message);
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: string }) =>
      branchApi.setRoomStatus(branchId, roomId, status),
    onSuccess: (data) => {
      toast.success(data?.message || 'Đã đổi trạng thái phòng.');
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Thất bại.';
      toast.error('Không đổi được trạng thái', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => branchApi.removeRoom(branchId, roomId),
    onSuccess: (data) => {
      toast.success('Đã xóa phòng', data?.message);
      invalidate();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa.';
      toast.error('Không thể xóa phòng', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <LayoutGrid className="size-4 text-neon" />
            Phòng tập trong chi nhánh
          </CardTitle>
          <CardDescription>
            Chỉ phòng AVAILABLE mới được đặt lịch tập; mã phòng unique trong chi nhánh
          </CardDescription>
        </div>
        {manage && (
          <Button
            variant="primary"
            size="sm"
            className="text-xs"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1" /> Thêm phòng
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">Đang tải phòng...</div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {rooms.map((room) => {
              const meta = ROOM_STATUS_META[room.status] || {
                label: room.status,
                variant: 'outline',
              };
              return (
                <div
                  key={room.id}
                  className="rounded-xl border border-line bg-ink p-4 hover:border-neon/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-chalk truncate">{room.name}</p>
                      <p className="font-mono text-[11px] text-neon mt-0.5">{room.code}</p>
                    </div>
                    <Badge variant={meta.variant as any}>{meta.label}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted">
                    <span className="rounded bg-line/60 px-2 py-0.5">
                      {ROOM_TYPE_META[room.type] || room.type}
                    </span>
                    <span className="rounded bg-line/60 px-2 py-0.5">Sức chứa {room.capacity}</span>
                    {room.floor && (
                      <span className="rounded bg-line/60 px-2 py-0.5">Tầng {room.floor}</span>
                    )}
                  </div>
                  {manage && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setEditing(room);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {room.status === 'AVAILABLE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-amber-400"
                          title="Đóng phòng (INACTIVE)"
                          onClick={() =>
                            statusMutation.mutate({ roomId: room.id, status: 'INACTIVE' })
                          }
                        >
                          <PowerOff className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-neon"
                          title="Mở phòng (AVAILABLE)"
                          onClick={() =>
                            statusMutation.mutate({ roomId: room.id, status: 'AVAILABLE' })
                          }
                        >
                          <Power className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Xóa phòng ${room.name}? Chỉ khi không còn thiết bị/buổi tập.`,
                            )
                          ) {
                            deleteMutation.mutate(room.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                      <span className="ml-auto text-[10px] text-muted">
                        {room._count?.equipment ?? 0} TB • {room._count?.schedules ?? 0} lịch
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted">
            Chưa có phòng nào trong chi nhánh này.
            {manage && ' Nhấn "Thêm phòng" để khai báo.'}
          </div>
        )}
      </CardContent>

      <Dialog
        open={dialogOpen}
        onClose={() => !saveMutation.isPending && setDialogOpen(false)}
        title={editing ? 'Cập nhật phòng' : 'Thêm phòng mới'}
        description="Mã phòng phải unique trong chi nhánh (VD: BR-BH01-R03)."
      >
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input
            label="Mã phòng *"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="BR-BH01-R03"
            className="font-mono"
          />
          <Input
            label="Tên phòng *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Phòng Group Class"
          />
          <Select
            label="Loại phòng"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            options={ROOM_TYPE_OPTIONS}
          />
          <Input
            label="Sức chứa"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
          <Input
            label="Tầng"
            value={form.floor}
            onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            placeholder="VD: 2"
          />
          <div className="col-span-2">
            <Textarea
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
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
            {editing ? 'Lưu thay đổi' : 'Tạo phòng'}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Equipment tab
// ---------------------------------------------------------------------------
function EquipmentTab({ branchId }: { branchId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-equipment', branchId],
    queryFn: () => equipmentApi.list({ branchId, limit: 100 }),
    enabled: !!branchId,
  });

  const items = data?.data || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Dumbbell className="size-4 text-neon" />
            Thiết bị tại chi nhánh
          </CardTitle>
          <CardDescription>
            <Link href="/admin/equipment" className="text-neon hover:underline">
              Quản lý thiết bị toàn hệ thống →
            </Link>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">Đang tải thiết bị...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            Chi nhánh chưa có thiết bị nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                <tr>
                  <th className="py-2.5 px-4">Mã</th>
                  <th className="py-2.5 px-4">Tên thiết bị</th>
                  <th className="py-2.5 px-4">Nhóm</th>
                  <th className="py-2.5 px-4">Phòng</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right">Lần bảo trì tới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((eq) => (
                  <tr key={eq.id} className="hover:bg-line/20 transition-colors">
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/admin/equipment/${eq.id}`}
                        className="font-mono text-neon hover:underline"
                      >
                        {eq.code}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-chalk">{eq.name}</td>
                    <td className="py-2.5 px-4 text-muted">{eq.category}</td>
                    <td className="py-2.5 px-4 text-muted">{eq.room?.name || '—'}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="capitalize">
                        {eq.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted">
                      {eq.nextMaintenanceAt ? formatDate(eq.nextMaintenanceAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Schedule tab
// ---------------------------------------------------------------------------
function ScheduleTab({ branchId }: { branchId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-schedules', branchId],
    queryFn: () => trainingApi.list({ branchId, limit: 50 }),
    enabled: !!branchId,
  });

  const items = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <CalendarDays className="size-4 text-neon" />
          Lịch tập tại chi nhánh
        </CardTitle>
        <CardDescription>
          <Link href="/admin/schedules" className="text-neon hover:underline">
            Quản lý lịch tập chi tiết →
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">Đang tải lịch tập...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            Chưa có buổi tập nào tại chi nhánh.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                <tr>
                  <th className="py-2.5 px-4">Buổi tập</th>
                  <th className="py-2.5 px-4">HLV</th>
                  <th className="py-2.5 px-4">Phòng</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Loại</th>
                  <th className="py-2.5 px-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((s) => {
                  const sMeta = SESSION_STATUS_META[s.status] || {
                    label: s.status,
                    variant: 'outline',
                  };
                  return (
                    <tr key={s.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-chalk">{s.title}</td>
                      <td className="py-2.5 px-4 text-muted">{s.trainer?.user?.fullName || '—'}</td>
                      <td className="py-2.5 px-4 text-muted">{s.room?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-muted">{formatDateTime(s.startTime)}</td>
                      <td className="py-2.5 px-4 text-muted">
                        {SESSION_TYPE_META[s.type]?.label || s.type}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant={sMeta.variant as any}>{sMeta.label}</Badge>
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
  );
}

// ---------------------------------------------------------------------------
// Members tab
// ---------------------------------------------------------------------------
function MembersTab({ branchId }: { branchId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['branch-members', branchId],
    queryFn: async () => {
      const res = await apiClient.get('/members', { params: { branchId, limit: 100 } });
      return res.data?.data || [];
    },
    enabled: !!branchId,
  });

  const members = data || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="size-4 text-neon" />
            Hội viên của chi nhánh
          </CardTitle>
          <CardDescription>
            <Link href="/admin/members" className="text-neon hover:underline">
              Danh sách hội viên toàn hệ thống →
            </Link>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">Đang tải hội viên...</div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">Chi nhánh chưa có hội viên.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-muted bg-ink border-b border-line">
                <tr>
                  <th className="py-2.5 px-4">Mã</th>
                  <th className="py-2.5 px-4">Họ tên</th>
                  <th className="py-2.5 px-4">SĐT</th>
                  <th className="py-2.5 px-4">Trạng thái hồ sơ</th>
                  <th className="py-2.5 px-4 text-right">Tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((m: any) => {
                  const meta = MEMBERSHIP_STATUS_META[m.status] || {
                    label: m.status,
                    variant: 'outline',
                  };
                  return (
                    <tr key={m.id} className="hover:bg-line/20 transition-colors">
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="font-mono text-neon hover:underline"
                        >
                          {m.code}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-chalk">{m.fullName}</td>
                      <td className="py-2.5 px-4 text-muted">{m.phone}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant={meta.variant as any}>{meta.label}</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted">
                        {m.joinedAt ? formatDate(m.joinedAt) : '—'}
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
  );
}
