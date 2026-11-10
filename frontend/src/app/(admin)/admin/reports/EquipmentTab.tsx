import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Search,
  Filter,
  History,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Info,
  CalendarCheck2,
  CalendarClock,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import apiClient from '@/lib/axios';

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED' | string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  code: string;
  type?: string;
  status?: 'AVAILABLE' | 'MAINTENANCE' | 'BROKEN' | 'INACTIVE' | string;
  capacity?: number;
  createdAt?: string;
  maintenance?: MaintenanceRecord[];
}

/** Tính toán số ngày còn lại hoặc quá hạn dự kiến sửa xong */
function getTargetDateDiff(endDateString: string | null | undefined): {
  days: number;
  isOverdue: boolean;
  isToday: boolean;
  label: string;
} {
  if (!endDateString) {
    return { days: 0, isOverdue: false, isToday: false, label: 'Chưa đặt ngày dự kiến' };
  }
  const end = new Date(endDateString);
  const now = new Date();

  const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffDays = Math.round((endMid - nowMid) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, isOverdue: false, isToday: true, label: 'Dự kiến xong hôm nay' };
  }
  if (diffDays > 0) {
    return { days: diffDays, isOverdue: false, isToday: false, label: `Còn ${diffDays} ngày nữa` };
  }
  const overdueDays = Math.abs(diffDays);
  return {
    days: overdueDays,
    isOverdue: true,
    isToday: false,
    label: `Quá hạn ${overdueDays} ngày`,
  };
}

/** Trả về chuỗi ngày YYYY-MM-DD sau N ngày */
function getFutureDateString(addDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  return d.toISOString().split('T')[0];
}

const COMMON_ISSUES = [
  'Kẹt dây curoa / đứt cáp kéo ròng rọc',
  'Màn hình cảm ứng & bảng điều khiển không lên nguồn',
  'Phát ra tiếng kêu lạ, rung lắc bất thường khi tập',
  'Mòn đệm ghế / lỏng ốc vít khung chịu lực',
  'Bảo dưỡng định kỳ & thay nhớt bôi trơn trục bi',
];

export function EquipmentTab() {
  const toast = useToast();
  // Bộ lọc & tìm kiếm
  const [activeTab, setActiveTab] = useState<'ALL' | 'MAINTENANCE' | 'AVAILABLE' | 'INACTIVE'>(
    'ALL',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal Thêm thiết bị mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    type: 'CARDIO',
    status: 'AVAILABLE',
    capacity: 1,
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal Báo sửa chữa / Bảo trì
  const [maintenanceTarget, setMaintenanceTarget] = useState<EquipmentItem | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: getFutureDateString(3),
    notes: '',
  });
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);

  // Modal Gia hạn / Cập nhật ngày sửa xong
  const [extendTarget, setExtendTarget] = useState<{
    equipment: EquipmentItem;
    record: MaintenanceRecord;
  } | null>(null);
  const [extendForm, setExtendForm] = useState({
    endDate: '',
    notes: '',
  });
  const [savingExtend, setSavingExtend] = useState(false);

  // Modal Lịch sử bảo trì
  const [historyTarget, setHistoryTarget] = useState<EquipmentItem | null>(null);

  // Loading khi thao tác hoàn tất nhanh
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Fetch dữ liệu từ API
  const listQ = useQuery({
    queryKey: ['equipment-list'],
    queryFn: async () => {
      const res = await apiClient.get('/equipment');
      return res.data;
    },
    retry: 1,
  });

  const rawDevices = listQ.data;
  const devices: EquipmentItem[] = useMemo(() => {
    if (Array.isArray(rawDevices)) return rawDevices;
    if (
      rawDevices &&
      typeof rawDevices === 'object' &&
      Array.isArray((rawDevices as { data?: EquipmentItem[] }).data)
    ) {
      return (rawDevices as { data: EquipmentItem[] }).data;
    }
    return [];
  }, [rawDevices]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let available = 0;
    let maintenance = 0;
    let broken = 0;
    let inactive = 0;

    for (const d of devices) {
      if (d.status === 'AVAILABLE') available++;
      else if (d.status === 'MAINTENANCE') maintenance++;
      else if (d.status === 'BROKEN') broken++;
      else if (d.status === 'INACTIVE') inactive++;
      else available++;
    }

    const total = devices.length;
    const activeMaintenanceCount = maintenance + broken;
    const activeRate = total > 0 ? Math.round((available / total) * 100) : 100;

    return {
      total,
      available,
      maintenance,
      broken,
      inactive,
      activeMaintenanceCount,
      activeRate,
    };
  }, [devices]);

  // Danh sách các máy đang cần bảo trì/sửa chữa (để hiển thị thẻ nổi bật)
  const urgentEquipments = useMemo(() => {
    return devices.filter((d) => d.status === 'MAINTENANCE' || d.status === 'BROKEN');
  }, [devices]);

  // Danh sách sau khi lọc
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Lọc theo tab
      if (activeTab === 'AVAILABLE' && d.status !== 'AVAILABLE') return false;
      if (activeTab === 'MAINTENANCE' && d.status !== 'MAINTENANCE' && d.status !== 'BROKEN')
        return false;
      if (activeTab === 'INACTIVE' && d.status !== 'INACTIVE') return false;

      // Lọc theo loại
      if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = d.name.toLowerCase().includes(q);
        const matchCode = d.code.toLowerCase().includes(q);
        const matchDesc = d.maintenance?.[0]?.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchCode && !matchDesc) return false;
      }

      return true;
    });
  }, [devices, activeTab, typeFilter, searchTerm]);

  // ==================== HÀNH ĐỘNG ====================

  /** Thêm thiết bị mới */
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.code.trim()) {
      setAddError('Vui lòng nhập tên và mã thiết bị.');
      return;
    }
    setSavingAdd(true);
    setAddError(null);
    try {
      await apiClient.post('/equipment', {
        name: addForm.name.trim(),
        code: addForm.code.trim().toUpperCase(),
        type: addForm.type,
        status: addForm.status,
        capacity: Number(addForm.capacity) || 1,
      });
      await listQ.refetch();
      setAddForm({ name: '', code: '', type: 'CARDIO', status: 'AVAILABLE', capacity: 1 });
      setShowAddModal(false);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string | string[] } } };
      const msg = errorResponse?.response?.data?.message || 'Có lỗi xảy ra khi lưu thiết bị.';
      setAddError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingAdd(false);
    }
  };

  /** Mở form báo bảo trì cho một máy */
  const openMaintenanceModal = (eq: EquipmentItem) => {
    setMaintenanceTarget(eq);
    setMaintenanceForm({
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: getFutureDateString(3),
      notes: '',
    });
    setMaintenanceError(null);
  };

  /** Gửi yêu cầu đưa máy vào bảo trì */
  const handleSubmitMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTarget) return;
    if (!maintenanceForm.description.trim()) {
      setMaintenanceError('Vui lòng nhập mô tả sự cố hoặc nội dung cần sửa.');
      return;
    }
    setSavingMaintenance(true);
    setMaintenanceError(null);
    try {
      await apiClient.post(`/equipment/${maintenanceTarget.id}/maintenance`, {
        description: maintenanceForm.description.trim(),
        startDate: maintenanceForm.startDate
          ? new Date(maintenanceForm.startDate).toISOString()
          : undefined,
        endDate: maintenanceForm.endDate
          ? new Date(maintenanceForm.endDate).toISOString()
          : undefined,
        notes: maintenanceForm.notes.trim() || undefined,
      });
      await listQ.refetch();
      setMaintenanceTarget(null);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string | string[] } } };
      const msg = errorResponse?.response?.data?.message || 'Không thể tạo đợt bảo trì.';
      setMaintenanceError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingMaintenance(false);
    }
  };

  /** Hoàn tất sửa chữa (Chuyển máy về SẴN SÀNG) */
  const handleCompleteMaintenance = async (equipmentId: string, equipmentName: string) => {
    if (
      !window.confirm(`Xác nhận máy "${equipmentName}" đã sửa chữa xong và đưa vào sử dụng lại?`)
    ) {
      return;
    }
    setCompletingId(equipmentId);
    try {
      await apiClient.post(`/equipment/${equipmentId}/complete-maintenance`);
      await listQ.refetch();
    } catch {
      toast.error('Không thể hoàn tất bảo trì', 'Vui lòng kiểm tra lại kết nối.');
    } finally {
      setCompletingId(null);
    }
  };

  /** Mở modal gia hạn ngày sửa */
  const openExtendModal = (eq: EquipmentItem) => {
    const activeRec =
      eq.maintenance?.find((m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING') ||
      eq.maintenance?.[0];
    if (!activeRec) {
      openMaintenanceModal(eq);
      return;
    }
    setExtendTarget({ equipment: eq, record: activeRec });
    setExtendForm({
      endDate: activeRec.endDate
        ? new Date(activeRec.endDate).toISOString().split('T')[0]
        : getFutureDateString(3),
      notes: activeRec.notes || '',
    });
  };

  /** Lưu cập nhật ngày dự kiến sửa xong */
  const handleSaveExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setSavingExtend(true);
    try {
      await apiClient.patch(
        `/equipment/${extendTarget.equipment.id}/maintenance/${extendTarget.record.id}`,
        {
          endDate: extendForm.endDate ? new Date(extendForm.endDate).toISOString() : null,
          notes: extendForm.notes,
        },
      );
      await listQ.refetch();
      setExtendTarget(null);
    } catch {
      toast.error('Không thể cập nhật ngày dự kiến sửa xong.');
    } finally {
      setSavingExtend(false);
    }
  };

  /** Xóa thiết bị */
  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn thiết bị "${name}" khỏi hệ thống?`)) return;
    try {
      await apiClient.delete(`/equipment/${id}`);
      await listQ.refetch();
    } catch {
      toast.error('Không thể xóa thiết bị', 'Vui lòng thử lại.');
    }
  };

  if (listQ.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (listQ.isError) {
    return (
      <ErrorState
        title="Không tải được dữ liệu thiết bị"
        description="Không thể kết nối đến máy chủ quản lý thiết bị. Vui lòng kiểm tra lại API."
        onRetry={() => listQ.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ==================== 1. KPI CARDS ==================== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className="text-left transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            title="Tổng thiết bị"
            value={stats.total}
            subtitle={`${stats.activeRate}% sẵn sàng phục vụ`}
            icon={Sparkles}
            colorScheme="blue"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AVAILABLE')}
          className="text-left transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            title="Sẵn sàng hoạt động"
            value={stats.available}
            subtitle="Hội viên tập bình thường"
            icon={CheckCircle}
            colorScheme="neon"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MAINTENANCE')}
          className="text-left transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            title="Đang bảo trì / Sửa"
            value={stats.maintenance}
            subtitle={
              stats.maintenance > 0 ? 'Có máy đang theo dõi lịch' : 'Tất cả máy hoạt động tốt'
            }
            icon={Wrench}
            colorScheme="amber"
          />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MAINTENANCE')}
          className="text-left transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            title="Báo hỏng / Chờ sửa"
            value={stats.broken}
            subtitle={stats.broken > 0 ? 'Cần lên lịch kỹ thuật sửa' : 'Không có sự cố khẩn'}
            icon={AlertTriangle}
            colorScheme={stats.broken > 0 ? 'rose' : 'blue'}
          />
        </button>
      </div>

      {/* ==================== 2. KHU VỰC CẢNH BÁO MÁY ĐANG SỬA ==================== */}
      {urgentEquipments.length > 0 && (
        <div className="rounded-xl border border-line bg-surface p-5 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg border border-line bg-ink text-neon">
                <Wrench className="size-4 text-neon" />
              </span>
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-chalk font-display">
                  Đang sửa chữa & Theo dõi hạn bảo trì ({urgentEquipments.length} máy)
                </h3>
                <p className="text-xs text-muted">
                  Theo dõi tình trạng hỏng hóc, đơn vị phụ trách và hạn dự kiến sửa xong để đảm bảo
                  vận hành phòng tập
                </p>
              </div>
            </div>
            <span className="text-xs text-muted">Bấm Hoàn tất khi máy đã sửa xong</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {urgentEquipments.map((eq) => {
              const activeRec = eq.maintenance?.[0];
              const dateDiff = getTargetDateDiff(activeRec?.endDate);

              return (
                <div
                  key={eq.id}
                  className="relative flex flex-col justify-between rounded-lg border border-line bg-ink/70 p-4 transition-colors hover:border-line"
                >
                  <div className="space-y-3">
                    {/* Header card máy */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-neon bg-neon/10 px-1.5 py-0.5 rounded-sm border border-neon/20">
                            {eq.code}
                          </span>
                          <h4 className="text-sm font-bold text-chalk">{eq.name}</h4>
                        </div>
                        <span className="mt-1 inline-block text-[11px] text-muted">
                          Phân loại: {eq.type || 'Thiết bị tập'}
                        </span>
                      </div>

                      {/* Badge trạng thái sửa */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold border',
                          eq.status === 'BROKEN'
                            ? 'border-danger/30 bg-danger/10 text-danger'
                            : 'border-line bg-surface text-chalk',
                        )}
                      >
                        <Wrench className="size-3 text-neon" />
                        {eq.status === 'BROKEN' ? 'Hỏng nặng' : 'Đang sửa chữa'}
                      </span>
                    </div>

                    {/* Nội dung sự cố / lý do sửa */}
                    <div className="rounded-md border border-line/60 bg-surface/50 p-2.5 text-xs text-chalk leading-relaxed">
                      <div className="flex items-center gap-1 font-semibold text-muted mb-1 text-[11px]">
                        <AlertCircle className="size-3 text-danger" />
                        Tình trạng / Sự cố ghi nhận:
                      </div>
                      <p>{activeRec?.description || 'Chưa cập nhật chi tiết sự cố hỏng hóc.'}</p>
                    </div>

                    {/* Hạn dự kiến hoàn thành & Đơn vị phụ trách */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1 text-xs">
                      <div className="rounded border border-line/50 bg-ink p-2">
                        <div className="flex items-center gap-1 text-[11px] text-muted mb-0.5">
                          <CalendarClock className="size-3 text-neon" />
                          Dự kiến sửa xong:
                        </div>
                        <div className="font-semibold text-chalk">
                          {formatDate(activeRec?.endDate)}
                        </div>
                        <div
                          className={cn(
                            'mt-1 inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-sm border',
                            dateDiff.isOverdue
                              ? 'border-danger/40 bg-danger/15 text-danger font-bold'
                              : dateDiff.isToday
                                ? 'border-neon/40 bg-neon/15 text-neon'
                                : 'border-line bg-surface text-muted',
                          )}
                        >
                          {dateDiff.label}
                        </div>
                      </div>

                      <div className="rounded border border-line/50 bg-ink p-2">
                        <div className="flex items-center gap-1 text-[11px] text-muted mb-0.5">
                          <Info className="size-3 text-muted" />
                          Đơn vị / Kỹ thuật:
                        </div>
                        <div className="text-chalk text-[11px] line-clamp-2">
                          {activeRec?.notes || 'Chưa phân công đơn vị sửa'}
                        </div>
                        <div className="mt-1 text-[10px] text-muted">
                          Bắt đầu: {formatDate(activeRec?.startDate || eq.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động trực tiếp */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        disabled={completingId === eq.id}
                        onClick={() => handleCompleteMaintenance(eq.id, eq.name)}
                        className="text-xs"
                      >
                        <Check className="size-3" />
                        {completingId === eq.id ? 'Đang cập nhật...' : 'Đã sửa xong (Sẵn sàng)'}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openExtendModal(eq)}
                        className="text-xs"
                      >
                        <Calendar className="size-3" />
                        Dời ngày / Cập nhật
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHistoryTarget(eq)}
                      className="inline-flex items-center gap-1 text-xs text-muted hover:text-chalk transition-colors"
                    >
                      <History className="size-3" />
                      Lịch sử
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 3. THANH ĐIỀU KHIỂN & BỘ LỌC ==================== */}
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs bộ lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-1 border border-line bg-ink p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                activeTab === 'ALL'
                  ? 'bg-surface text-chalk shadow-sm border border-line'
                  : 'text-muted hover:text-chalk',
              )}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MAINTENANCE')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                activeTab === 'MAINTENANCE'
                  ? 'bg-surface text-chalk shadow-sm border border-line'
                  : 'text-muted hover:text-chalk',
              )}
            >
              <Wrench className="size-3 text-neon" />
              Đang bảo trì & Hỏng ({stats.activeMaintenanceCount})
              {stats.activeMaintenanceCount > 0 && (
                <span className="size-1.5 rounded-full bg-neon animate-pulse" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AVAILABLE')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                activeTab === 'AVAILABLE'
                  ? 'bg-surface text-chalk shadow-sm border border-line'
                  : 'text-muted hover:text-chalk',
              )}
            >
              Sẵn sàng ({stats.available})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INACTIVE')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                activeTab === 'INACTIVE'
                  ? 'bg-surface text-chalk shadow-sm border border-line'
                  : 'text-muted hover:text-chalk',
              )}
            >
              Tạm ngưng ({stats.inactive})
            </button>
          </div>

          {/* Nút thêm thiết bị mới */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setShowAddModal(true);
              setAddError(null);
            }}
            className="shrink-0"
          >
            <Plus className="size-4" />
            Thêm thiết bị mới
          </Button>
        </div>

        {/* Thanh tìm kiếm & lọc theo loại */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên máy, mã thiết bị (vd: EQ-001, Máy chạy bộ, Tạ đòn)..."
              className="w-full rounded-md border border-line bg-ink pl-9 pr-3 py-2 text-xs text-chalk outline-none focus:border-neon placeholder:text-muted"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-md border border-line bg-ink px-3 py-2 text-xs text-chalk outline-none focus:border-neon"
            >
              <option value="ALL">Tất cả phân loại máy</option>
              <option value="CARDIO">CARDIO (Tim mạch/Chạy bộ/Xe đạp)</option>
              <option value="WEIGHT">WEIGHT (Tạ đòn/Tạ tay/Kháng lực)</option>
              <option value="MACHINE">MACHINE (Máy tập khối/Dây cáp)</option>
              <option value="GROUP_CLASS">GROUP_CLASS (Lớp nhóm)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== 4. BẢNG DANH SÁCH THIẾT BỊ ==================== */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-chalk font-display">
              Danh sách trang thiết bị ({filteredDevices.length})
            </h3>
            <p className="text-xs text-muted">
              Kiểm tra tình trạng thiết bị, hạn sửa chữa và thực hiện chuyển trạng thái vận hành
            </p>
          </div>
          {listQ.isFetching && <span className="text-xs text-muted">Đang đồng bộ...</span>}
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-ink/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Tên thiết bị & Mã</th>
                <th className="px-3 py-2.5 font-semibold">Phân loại</th>
                <th className="px-3 py-2.5 font-semibold">Trạng thái vận hành</th>
                <th className="px-3 py-2.5 font-semibold">Hiện trạng & Hạn sửa chữa</th>
                <th className="px-3 py-2.5 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredDevices.map((eq) => {
                const activeRec = eq.maintenance?.[0];
                const isUnderRepair = eq.status === 'MAINTENANCE' || eq.status === 'BROKEN';
                const dateDiff = isUnderRepair ? getTargetDateDiff(activeRec?.endDate) : null;

                return (
                  <tr key={eq.id} className="transition-colors hover:bg-ink/40">
                    {/* Tên & Mã */}
                    <td className="p-3">
                      <div className="font-medium text-chalk">{eq.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-muted bg-ink px-1.5 py-0.5 rounded border border-line">
                          {eq.code}
                        </span>
                        {eq.capacity && eq.capacity > 1 && (
                          <span className="text-[11px] text-muted">Sức chứa: {eq.capacity}</span>
                        )}
                      </div>
                    </td>

                    {/* Phân loại */}
                    <td className="p-3 text-xs text-muted">
                      <span className="inline-block rounded-sm border border-line bg-ink px-2 py-0.5 font-mono text-[11px]">
                        {eq.type || 'CARDIO'}
                      </span>
                    </td>

                    {/* Trạng thái vận hành */}
                    <td className="p-3">
                      {eq.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-neon/30 bg-neon/10 px-2 py-0.5 text-xs font-semibold text-neon">
                          <CheckCircle className="size-3" /> Sẵn sàng
                        </span>
                      )}
                      {eq.status === 'MAINTENANCE' && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-chalk">
                          <Wrench className="size-3 text-neon" /> Đang bảo trì
                        </span>
                      )}
                      {eq.status === 'BROKEN' && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-danger/30 bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                          <AlertTriangle className="size-3" /> Hỏng
                        </span>
                      )}
                      {eq.status === 'INACTIVE' && (
                        <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-ink px-2 py-0.5 text-xs font-semibold text-muted">
                          <Clock className="size-3" /> Tạm ngừng
                        </span>
                      )}
                    </td>

                    {/* Tình trạng sửa chữa & Ngày dự kiến xong */}
                    <td className="p-3 text-xs">
                      {isUnderRepair ? (
                        <div className="space-y-1">
                          <div
                            className="line-clamp-1 font-medium text-chalk"
                            title={activeRec?.description || ''}
                          >
                            {activeRec?.description || 'Đang chờ khắc phục sự cố'}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-muted">
                              Dự kiến xong: <strong>{formatDate(activeRec?.endDate)}</strong>
                            </span>
                            {dateDiff && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.5 rounded-sm border text-[10px] font-semibold',
                                  dateDiff.isOverdue
                                    ? 'border-danger/40 bg-danger/15 text-danger'
                                    : dateDiff.isToday
                                      ? 'border-neon/40 bg-neon/15 text-neon'
                                      : 'border-line bg-ink text-muted',
                                )}
                              >
                                {dateDiff.label}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Hoạt động bình thường</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {isUnderRepair ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              disabled={completingId === eq.id}
                              onClick={() => handleCompleteMaintenance(eq.id, eq.name)}
                              className="text-xs h-7 px-2"
                              title="Bấm để đưa máy về trạng thái Sẵn sàng"
                            >
                              <Check className="size-3" />
                              Xong
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openExtendModal(eq)}
                              className="text-xs h-7 px-2"
                              title="Cập nhật ngày dự kiến sửa xong"
                            >
                              <Calendar className="size-3" />
                              Hạn
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openMaintenanceModal(eq)}
                            className="text-xs h-7 px-2 border-line hover:border-neon hover:text-neon"
                            title="Báo máy gặp sự cố cần sửa chữa / bảo trì"
                          >
                            <Wrench className="size-3" />
                            Báo sửa
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => setHistoryTarget(eq)}
                          className="inline-flex items-center justify-center rounded-sm border border-line bg-ink size-7 text-muted hover:text-chalk hover:border-line transition-colors"
                          title="Xem lịch sử bảo trì của máy"
                        >
                          <History className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                          className="inline-flex items-center justify-center rounded-sm border border-line bg-ink size-7 text-muted hover:border-danger hover:text-danger transition-colors"
                          title="Xóa thiết bị"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted">
                    Không tìm thấy thiết bị nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 5. MODAL: THÊM THIẾT BỊ MỚI ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-chalk font-display">
                  Thêm thiết bị mới
                </h3>
                <p className="text-xs text-muted">
                  Nhập thông tin máy móc, dụng cụ trang bị cho phòng gym
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateEquipment} className="mt-4 space-y-3">
              <div>
                <label htmlFor="modal-eq-name" className="mb-1 block text-xs text-muted">
                  Tên thiết bị *
                </label>
                <Input
                  id="modal-eq-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Máy chạy bộ Impulse IT9500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-eq-code" className="mb-1 block text-xs text-muted">
                    Mã thiết bị (duy nhất) *
                  </label>
                  <Input
                    id="modal-eq-code"
                    value={addForm.code}
                    onChange={(e) => setAddForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="VD: TREADMILL-01"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="modal-eq-type" className="mb-1 block text-xs text-muted">
                    Phân loại máy
                  </label>
                  <select
                    id="modal-eq-type"
                    value={addForm.type}
                    onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-md border border-line bg-ink px-3 py-2 text-xs text-chalk outline-none focus:border-neon"
                  >
                    <option value="CARDIO">CARDIO (Tim mạch)</option>
                    <option value="WEIGHT">WEIGHT (Tạ / Kháng lực)</option>
                    <option value="MACHINE">MACHINE (Máy tập khối)</option>
                    <option value="GROUP_CLASS">GROUP_CLASS (Lớp nhóm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modal-eq-status" className="mb-1 block text-xs text-muted">
                    Trạng thái ban đầu
                  </label>
                  <select
                    id="modal-eq-status"
                    value={addForm.status}
                    onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-md border border-line bg-ink px-3 py-2 text-xs text-chalk outline-none focus:border-neon"
                  >
                    <option value="AVAILABLE">Sẵn sàng hoạt động</option>
                    <option value="MAINTENANCE">Đang bảo trì / Lắp đặt</option>
                    <option value="INACTIVE">Tạm ngưng sử dụng</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modal-eq-capacity" className="mb-1 block text-xs text-muted">
                    Sức chứa / Số lượng tập cùng lúc
                  </label>
                  <Input
                    id="modal-eq-capacity"
                    type="number"
                    min={1}
                    value={addForm.capacity}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingAdd}>
                  {savingAdd ? 'Đang lưu...' : 'Lưu thiết bị'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 6. MODAL: BÁO BẢO TRÌ / SỬA CHỮA ==================== */}
      {maintenanceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-chalk font-display flex items-center gap-2">
                  <Wrench className="size-4 text-neon" />
                  Báo sửa chữa: {maintenanceTarget.name}
                </h3>
                <p className="text-xs text-muted">
                  Mã máy:{' '}
                  <span className="font-mono text-neon font-semibold">
                    {maintenanceTarget.code}
                  </span>{' '}
                  — Chuyển máy sang trạng thái bảo trì và theo dõi tiến độ sửa
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceTarget(null)}
                className="text-muted hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            </div>

            {maintenanceError && (
              <div className="mt-3 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {maintenanceError}
              </div>
            )}

            <form onSubmit={handleSubmitMaintenance} className="mt-4 space-y-4">
              {/* Mô tả sự cố */}
              <div>
                <label htmlFor="maint-desc" className="mb-1 block text-xs font-semibold text-chalk">
                  Tình trạng hư hỏng / Sự cố cần sửa *
                </label>
                <textarea
                  id="maint-desc"
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={(e) =>
                    setMaintenanceForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Mô tả chi tiết: máy bị hiện tượng gì, hỏng chi tiết nào..."
                  className="w-full rounded-md border border-line bg-ink p-2.5 text-xs text-chalk outline-none focus:border-neon placeholder:text-muted"
                  required
                />

                {/* Gợi ý lỗi phổ biến */}
                <div className="mt-2">
                  <span className="text-[10px] text-muted block mb-1">
                    Gợi ý sự cố phổ biến (click để điền nhanh):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_ISSUES.map((issue) => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => setMaintenanceForm((f) => ({ ...f, description: issue }))}
                        className="rounded-sm border border-line bg-ink px-2 py-0.5 text-[10px] text-muted hover:border-neon hover:text-neon transition-colors"
                      >
                        {issue}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ngày bắt đầu & Ngày dự kiến sửa xong */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="maint-start" className="mb-1 block text-xs text-muted">
                    Ngày ghi nhận / Bắt đầu sửa
                  </label>
                  <Input
                    id="maint-start"
                    type="date"
                    value={maintenanceForm.startDate}
                    onChange={(e) =>
                      setMaintenanceForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label htmlFor="maint-end" className="mb-1 block text-xs font-semibold text-neon">
                    Thời gian dự kiến sửa xong *
                  </label>
                  <Input
                    id="maint-end"
                    type="date"
                    value={maintenanceForm.endDate}
                    onChange={(e) => setMaintenanceForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Phím tắt chọn ngày nhanh */}
              <div>
                <span className="text-[10px] text-muted block mb-1">
                  Chọn nhanh hạn hoàn thành:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { label: '+1 Ngày (Mai)', days: 1 },
                    { label: '+3 Ngày', days: 3 },
                    { label: '+7 Ngày (1 tuần)', days: 7 },
                    { label: '+14 Ngày', days: 14 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() =>
                        setMaintenanceForm((f) => ({
                          ...f,
                          endDate: getFutureDateString(preset.days),
                        }))
                      }
                      className="rounded border border-line bg-ink px-2 py-1 text-[11px] text-muted hover:border-neon hover:text-neon transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kỹ thuật viên / Đơn vị sửa */}
              <div>
                <label htmlFor="maint-notes" className="mb-1 block text-xs text-muted">
                  Đơn vị sửa chữa / Kỹ thuật viên phụ trách & Ghi chú
                </label>
                <Input
                  id="maint-notes"
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="VD: Kỹ thuật viên Tuấn (0912.345.678) - Chờ phụ tùng Matrix"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMaintenanceTarget(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingMaintenance}>
                  {savingMaintenance ? 'Đang lưu...' : 'Xác nhận đưa vào sửa chữa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 7. MODAL: DỜI NGÀY / GIA HẠN HẠN SỬA ==================== */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-chalk font-display flex items-center gap-2">
                  <CalendarClock className="size-4 text-neon" />
                  Cập nhật hạn hoàn thành
                </h3>
                <p className="text-xs text-muted">
                  {extendTarget.equipment.name} ({extendTarget.equipment.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                className="text-muted hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExtend} className="mt-4 space-y-3">
              <div>
                <label htmlFor="extend-date" className="mb-1 block text-xs font-semibold text-neon">
                  Ngày dự kiến sửa xong mới *
                </label>
                <Input
                  id="extend-date"
                  type="date"
                  value={extendForm.endDate}
                  onChange={(e) => setExtendForm((f) => ({ ...f, endDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <span className="text-[10px] text-muted block mb-1">Gia hạn thêm:</span>
                <div className="flex gap-1.5">
                  {[
                    { label: '+2 ngày', days: 2 },
                    { label: '+5 ngày', days: 5 },
                    { label: '+7 ngày', days: 7 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() =>
                        setExtendForm((f) => ({
                          ...f,
                          endDate: getFutureDateString(p.days),
                        }))
                      }
                      className="rounded border border-line bg-ink px-2 py-1 text-[11px] text-muted hover:border-neon hover:text-neon transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="extend-notes" className="mb-1 block text-xs text-muted">
                  Ghi chú tiến độ / Lý do dời ngày
                </label>
                <textarea
                  id="extend-notes"
                  rows={2}
                  value={extendForm.notes}
                  onChange={(e) => setExtendForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="VD: Đang chờ hãng giao linh kiện mới..."
                  className="w-full rounded-md border border-line bg-ink p-2 text-xs text-chalk outline-none focus:border-neon"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendTarget(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingExtend}>
                  {savingExtend ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 8. MODAL: LỊCH SỬ BẢO TRÌ THIẾT BỊ ==================== */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-chalk font-display flex items-center gap-2">
                  <History className="size-4 text-neon" />
                  Lịch sử bảo trì: {historyTarget.name}
                </h3>
                <p className="text-xs text-muted">
                  Mã thiết bị: <span className="font-mono text-neon">{historyTarget.code}</span> —
                  Toàn bộ các lần ghi nhận sự cố và sửa chữa
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="text-muted hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3 pr-1">
              {historyTarget.maintenance && historyTarget.maintenance.length > 0 ? (
                historyTarget.maintenance.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="rounded-lg border border-line bg-ink/70 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-semibold text-[11px] border',
                          m.status === 'COMPLETE'
                            ? 'border-neon/30 bg-neon/10 text-neon'
                            : 'border-line bg-surface text-chalk',
                        )}
                      >
                        {m.status === 'COMPLETE' ? (
                          <Check className="size-3" />
                        ) : (
                          <Wrench className="size-3 text-neon" />
                        )}
                        {m.status === 'COMPLETE' ? 'Đã sửa xong' : 'Đang xử lý'}
                      </span>
                      <span className="text-[11px] text-muted">
                        Ngày tạo: {formatDateTime(m.createdAt)}
                      </span>
                    </div>

                    <div className="text-chalk leading-relaxed">
                      <strong>Nội dung sự cố:</strong> {m.description || 'Không có mô tả'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted pt-1 border-t border-line/50">
                      <div>
                        Ngày bắt đầu: <span className="text-chalk">{formatDate(m.startDate)}</span>
                      </div>
                      <div>
                        Hạn dự kiến / Xong:{' '}
                        <span className="text-chalk">{formatDate(m.endDate)}</span>
                      </div>
                      {m.notes && (
                        <div className="col-span-2">
                          Kỹ thuật / Ghi chú: <span className="text-chalk">{m.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted">
                  Thiết bị này chưa có lịch sử bảo trì hoặc sửa chữa nào.
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-line pt-3 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setHistoryTarget(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
