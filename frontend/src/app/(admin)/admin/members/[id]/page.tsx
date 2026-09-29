'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { FaceScanner } from '@/components/ui/face-scanner';
import { faceApi } from '@/services/face.service';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
} from '@/lib/utils';
import {
  MEMBERSHIP_STATUS_META,
  MEMBER_STATUS_META,
  PAYMENT_STATUS_META,
  PAYMENT_METHOD_LABEL,
} from '@/lib/status';
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  QrCode,
  Receipt,
  Lock,
  Unlock,
  Pencil,
  ShieldCheck,
  CheckCircle2,
  Dumbbell,
  ScanFace,
  Trash2,
} from 'lucide-react';

const SAMPLE_TARGET = 5;

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<'memberships' | 'checkins' | 'payments' | 'schedules'>(
    'memberships',
  );

  const {
    data: member,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['member-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/members/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const invalidateMember = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['member-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    queryClient.invalidateQueries({ queryKey: ['reports-dashboard'] });
  };

  const { data: trainerAssignments } = useQuery({
    queryKey: ['member-trainer', id],
    queryFn: async () => {
      const res = await apiClient.get(`/members/${id}/trainers`);
      return res.data;
    },
    enabled: !!id,
  });

  const activeTrainer = (trainerAssignments || []).find((a: any) => a.status === 'ACTIVE')?.trainer;

  // ------------------ Đăng ký khuôn mặt (sinh trắc học) ------------------
  const [confirmFaceDelete, setConfirmFaceDelete] = useState(false);
  const [faceEnrollOpen, setFaceEnrollOpen] = useState(false);
  const [faceEnrollKey, setFaceEnrollKey] = useState(0);
  const [faceEnrollSamples, setFaceEnrollSamples] = useState<number[][]>([]);
  const [faceEnrollImage, setFaceEnrollImage] = useState<string | null>(null);
  const [faceConsent, setFaceConsent] = useState(false);

  const { data: faceStatus } = useQuery({
    queryKey: ['member-face', id],
    queryFn: () => faceApi.getMemberFace(id),
    enabled: !!id && activeTab === 'checkins',
    retry: 0,
  });

  /** Mở dialog đăng ký khuôn mặt thay hội viên (làm thẻ tại quầy) */
  const openFaceEnroll = () => {
    setFaceEnrollSamples([]);
    setFaceEnrollImage(null);
    setFaceConsent(false);
    setFaceEnrollKey((k) => k + 1);
    setFaceEnrollOpen(true);
  };

  const faceEnrollMutation = useMutation({
    mutationFn: ({ vecs, image }: { vecs: number[][]; image: string | null }) =>
      faceApi.adminEnroll(id, vecs, image),
    onSuccess: () => {
      toast.success('Đã đăng ký khuôn mặt', 'Hội viên có thể check-in bằng khuôn mặt tại quầy.');
      setFaceEnrollOpen(false);
      queryClient.invalidateQueries({ queryKey: ['member-face', id] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không lưu được dữ liệu khuôn mặt.';
      toast.error('Đăng ký thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const faceDeleteMutation = useMutation({
    mutationFn: () => faceApi.adminWithdraw(id),
    onSuccess: (res) => {
      toast.success('Đã xoá dữ liệu khuôn mặt', res.message || 'Dữ liệu đã được xoá vĩnh viễn.');
      setConfirmFaceDelete(false);
      queryClient.invalidateQueries({ queryKey: ['member-face', id] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Không xoá được dữ liệu.';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiClient.patch(`/members/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        'Cập nhật trạng thái thành công',
        statusMutation.variables === 'SUSPENDED'
          ? 'Hội viên đã bị khóa. Họ không thể check-in cho tới khi được kích hoạt lại.'
          : 'Hội viên đã được kích hoạt trở lại.',
      );
      invalidateMember(id);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật trạng thái thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/members/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật thành công', 'Thông tin hội viên đã được lưu.');
      setEditing(false);
      invalidateMember(id);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiClient.patch(`/payments/${paymentId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Xác nhận thanh toán thành công', 'Gói tập đã được kích hoạt.');
      invalidateMember(id);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Xác nhận thất bại';
      toast.error('Thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openEdit = () => {
    setForm({
      fullName: member.fullName || '',
      phone: member.phone || '',
      email: member.email || '',
      gender: member.gender || 'MALE',
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      notes: member.notes || '',
    });
    setEditing(true);
  };

  const submitEdit = () => {
    const payload: any = {};
    Object.keys(form).forEach((k) => {
      if (form[k] !== '' && form[k] !== undefined) payload[k] = form[k];
    });
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-muted">
        Đang tải thông tin chi tiết hội viên...
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="space-y-4">
        <Link href="/admin/members">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-1.5" /> Quay lại danh sách
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-danger text-sm">
            Không tìm thấy thông tin hội viên hoặc có lỗi kết nối đến API.
          </CardContent>
        </Card>
      </div>
    );
  }

  const TABS = [
    {
      key: 'memberships' as const,
      label: 'Gói tập & Thẻ hội viên',
      count: member.memberships?.length || 0,
      icon: CreditCard,
    },
    {
      key: 'checkins' as const,
      label: 'Lịch sử Check-in',
      count: member.checkIns?.length || 0,
      icon: QrCode,
    },
    {
      key: 'payments' as const,
      label: 'Lịch sử Hoá đơn',
      count: member.payments?.length || 0,
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <Link href="/admin/members">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="size-4 mr-1.5" />
            Danh sách hội viên
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={MEMBER_STATUS_META[member.status]?.variant || 'outline'}>
            {MEMBER_STATUS_META[member.status]?.label || member.status}
          </Badge>
          <Button variant="outline" size="sm" className="text-xs" onClick={openEdit}>
            <Pencil className="size-3.5 mr-1 text-muted" /> Sửa thông tin
          </Button>
          {member.status === 'SUSPENDED' ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-neon"
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate('ACTIVE')}
            >
              <Unlock className="size-3.5 mr-1" /> Kích hoạt lại
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-danger"
              isLoading={statusMutation.isPending}
              onClick={() => {
                if (window.confirm(`Khóa tài khoản của ${member.fullName}?`)) {
                  statusMutation.mutate('SUSPENDED');
                }
              }}
            >
              <Lock className="size-3.5 mr-1" /> Khóa tài khoản
            </Button>
          )}
        </div>
      </div>

      {/* Member Profile Overview Header */}
      <Card className="border-neon/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-ink border border-neon/40 text-neon flex items-center justify-center font-bold text-2xl uppercase">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-chalk">{member.fullName}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-neon/10 text-neon border border-neon/40 font-bold">
                    {member.code}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5 text-muted" /> {member.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="size-3.5 text-muted" /> {member.email || 'Chưa cung cấp email'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted" /> {member.branch?.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-line">
              <p className="text-xs text-muted">Ngày tham gia phòng tập</p>
              <p className="text-sm font-bold text-chalk mt-0.5">{formatDate(member.joinedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainer card */}
      <Card className="border-line">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {activeTrainer ? (
                <>
                  {activeTrainer.user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeTrainer.user.avatarUrl}
                      alt=""
                      className="size-11 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-xl bg-neon/15 text-sm font-bold uppercase text-neon">
                      {activeTrainer.user?.fullName?.charAt(0)}
                    </span>
                  )}
                  <div>
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neon">
                      <Dumbbell className="size-3.5" /> HLV phụ trách
                    </p>
                    <p className="text-sm font-bold text-chalk">{activeTrainer.user?.fullName}</p>
                    <p className="text-xs text-muted">{activeTrainer.specialization}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-ink/60 text-muted">
                    <Dumbbell className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      HLV phụ trách
                    </p>
                    <p className="text-sm text-muted">
                      Chưa được gán HLV. Vào trang{' '}
                      <span className="text-neon">Huấn luyện viên</span> để phân công.
                    </p>
                  </div>
                </>
              )}
            </div>
            {activeTrainer && (
              <Link href={`/admin/trainers/${activeTrainer.id}`} className="shrink-0">
                <Button variant="outline" size="sm" className="text-xs">
                  Hồ sơ HLV <ArrowRight className="ml-1 size-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Tabs Navigation */}
      <div className="flex border-b border-line gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'border-neon text-neon'
                  : 'border-transparent text-muted hover:text-chalk'
              }`}
            >
              <Icon className="size-4" />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'memberships' && (
        <div className="space-y-4">
          {member.memberships && member.memberships.length > 0 ? (
            member.memberships.map((m: any) => {
              const msMeta = MEMBERSHIP_STATUS_META[m.status] || {
                label: m.status,
                variant: 'outline',
              };
              const pendingPayment = m.payments?.find((p: any) => p.status === 'PENDING');
              return (
                <Card key={m.id}>
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-chalk">{m.package?.name}</h4>
                        <Badge variant={msMeta.variant as any}>{msMeta.label}</Badge>
                        {m.payments?.length > 0 && (
                          <Badge
                            variant={
                              PAYMENT_STATUS_META[m.payments[0].status]?.variant || 'outline'
                            }
                            className="font-mono text-[10px]"
                          >
                            {m.payments[0].code} •{' '}
                            {PAYMENT_STATUS_META[m.payments[0].status]?.label ||
                              m.payments[0].status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1">
                        Hiệu lực: {formatDate(m.startDate)} đến {formatDate(m.endDate)} •{' '}
                        {PAYMENT_METHOD_LABEL[m.payments?.[0]?.method] || 'Thanh toán tại quầy'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Giá trị hợp đồng</p>
                      <p className="text-base font-bold text-neon">
                        {formatCurrency(m.finalAmount ?? m.price)}
                      </p>
                      {Number(m.discountAmount) > 0 && (
                        <p className="text-[11px] text-muted line-through">
                          {formatCurrency(m.price)}
                        </p>
                      )}
                      {m.status === 'PENDING' && pendingPayment && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs text-neon"
                          isLoading={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(pendingPayment.id)}
                        >
                          <CheckCircle2 className="size-3.5 mr-1" /> Xác nhận thanh toán
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-xs text-muted">
                Hội viên này chưa đăng ký gói tập nào.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'checkins' && (
        <div className="space-y-4">
          {/* Attendance stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Tổng lượt tập
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-chalk">
                  {member.attendanceStats?.totalVisits ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Lần tập gần nhất
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-chalk">
                  {member.attendanceStats?.lastVisit
                    ? formatDateTime(member.attendanceStats.lastVisit)
                    : '--'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">
                  Thời gian TB / lượt
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-chalk">
                  {formatDuration(member.attendanceStats?.avgDuration)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sinh trắc học — trạng thái đăng ký khuôn mặt (lễ tân đăng ký hộ tại quầy) */}
          <Card className="border-line">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {faceStatus?.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faceStatus.imageData}
                    alt={`Ảnh khuôn mặt của ${member?.fullName ?? ''}`}
                    className="size-14 shrink-0 rounded-xl border border-neon/40 object-cover"
                  />
                ) : (
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                      faceStatus?.enrolled
                        ? 'border border-neon/40 bg-neon/10 text-neon'
                        : 'border border-line bg-ink text-muted'
                    }`}
                  >
                    <ScanFace className="size-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-chalk">Đăng ký khuôn mặt</p>
                  <p className="text-xs text-muted">
                    {faceStatus?.enrolled ? (
                      <>
                        Đã lưu{' '}
                        <strong className="font-mono text-neon">{faceStatus.sampleCount}</strong>{' '}
                        mẫu • đồng ý từ{' '}
                        {faceStatus.consentAt ? formatDateTime(faceStatus.consentAt) : '--'}
                      </>
                    ) : (
                      'Chưa đăng ký — có thể quét khuôn mặt cho hội viên ngay tại quầy.'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={openFaceEnroll}>
                  <ScanFace className="size-3.5 mr-1" />
                  {faceStatus?.enrolled ? 'Đăng ký lại' : 'Đăng ký khuôn mặt'}
                </Button>
                {faceStatus?.enrolled && (
                  <Button variant="danger" size="sm" onClick={() => setConfirmFaceDelete(true)}>
                    <Trash2 className="size-3.5 mr-1" /> Xoá đăng ký
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {member.checkIns && member.checkIns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="py-2.5 px-4">Vào lúc</th>
                        <th className="py-2.5 px-4">Ra lúc</th>
                        <th className="py-2.5 px-4">Thời lượng</th>
                        <th className="py-2.5 px-4">Hình thức</th>
                        <th className="py-2.5 px-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-medium">
                      {member.checkIns.map((c: any) => (
                        <tr key={c.id} className="hover:bg-line/20 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-muted">
                            {formatTime(c.checkInTime)}
                            <span className="ml-1.5 text-[10px] text-muted/60">
                              {formatDate(c.checkInTime)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-muted">
                            {c.checkOutTime ? formatTime(c.checkOutTime) : '--'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-chalk">
                            {formatDuration(
                              c.durationMinutes ??
                                (c.checkOutTime
                                  ? Math.round(
                                      (new Date(c.checkOutTime).getTime() -
                                        new Date(c.checkInTime).getTime()) /
                                        60000,
                                    )
                                  : null),
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-muted">
                            {c.method === 'FACE_ID'
                              ? 'Khuôn mặt'
                              : c.method === 'QR_CODE'
                                ? 'Quét QR'
                                : c.method === 'STAFF'
                                  ? 'Lễ tân'
                                  : 'Tự check-in'}
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge variant={c.status === 'CHECKED_OUT' ? 'success' : 'info'}>
                              {c.status === 'CHECKED_OUT' ? 'Hoàn tất' : 'Đang tập'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted">
                  Chưa có lượt quét thẻ check-in nào.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Đăng ký khuôn mặt THAY hội viên — lễ tân quét tại quầy khi làm thẻ */}
      <Dialog
        open={faceEnrollOpen}
        onClose={() => setFaceEnrollOpen(false)}
        title="Đăng ký khuôn mặt cho hội viên"
        description="Quét khuôn mặt hội viên tại quầy để lưu ảnh + vector đối chiếu khi check-in."
      >
        <FaceScanner
          key={faceEnrollKey}
          mode="enroll"
          target={SAMPLE_TARGET}
          withImage
          onSamples={(next, image) => {
            setFaceEnrollSamples(next);
            setFaceEnrollImage(image);
          }}
          onError={(msg) => toast.error('Không mở được camera', msg)}
        />

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink p-3.5 transition-colors hover:border-neon/40">
          <input
            type="checkbox"
            checked={faceConsent}
            onChange={(e) => setFaceConsent(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-neon"
          />
          <span className="text-xs text-chalk">
            Tôi xác nhận hội viên <strong className="text-neon">{member?.fullName ?? ''}</strong> đã
            đồng ý cho GymShark xử lý dữ liệu sinh trắc học (khuôn mặt) theo Nghị định
            13/2023/NĐ-CP.
          </span>
        </label>

        {!faceEnrollImage && faceEnrollSamples.length >= SAMPLE_TARGET && (
          <p className="mt-3 text-center text-[11px] text-danger">
            Chưa chụp được ảnh khuôn mặt — bấm &quot;Hủy&quot; rồi mở lại để quét.
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setFaceEnrollOpen(false)}>
            Hủy
          </Button>
          <Button
            variant="primary"
            isLoading={faceEnrollMutation.isPending}
            disabled={faceEnrollSamples.length < SAMPLE_TARGET || !faceEnrollImage || !faceConsent}
            onClick={() =>
              faceEnrollMutation.mutate({ vecs: faceEnrollSamples, image: faceEnrollImage })
            }
          >
            <ShieldCheck className="size-4 mr-1.5" /> Đăng ký ({faceEnrollSamples.length}/
            {SAMPLE_TARGET})
          </Button>
        </div>
      </Dialog>

      {/* Xác nhận xoá đăng ký khuôn mặt */}
      <Dialog
        open={confirmFaceDelete}
        onClose={() => setConfirmFaceDelete(false)}
        title="Xoá đăng ký khuôn mặt?"
        description="Toàn bộ vector và ảnh khuôn mặt của hội viên sẽ bị xoá vĩnh viễn. Hội viên cần đăng ký lại nếu muốn dùng check-in khuôn mặt."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmFaceDelete(false)}>
            Giữ lại
          </Button>
          <Button
            variant="danger"
            isLoading={faceDeleteMutation.isPending}
            onClick={() => faceDeleteMutation.mutate()}
          >
            <Trash2 className="size-4 mr-1.5" /> Xoá vĩnh viễn
          </Button>
        </div>
      </Dialog>

      {activeTab === 'payments' && (
        <Card>
          <CardContent className="p-0">
            {member.payments && member.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-ink border-b border-line text-[11px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="py-2.5 px-4">Mã hoá đơn</th>
                      <th className="py-2.5 px-4">Số tiền</th>
                      <th className="py-2.5 px-4">Phương thức</th>
                      <th className="py-2.5 px-4">Thời gian</th>
                      <th className="py-2.5 px-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-medium">
                    {member.payments.map((p: any) => {
                      const pMeta = PAYMENT_STATUS_META[p.status] || {
                        label: p.status,
                        variant: 'outline',
                      };
                      return (
                        <tr key={p.id} className="hover:bg-line/20 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-chalk">{p.code}</td>
                          <td className="py-2.5 px-4 font-bold text-neon">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-2.5 px-4 text-muted">
                            {PAYMENT_METHOD_LABEL[p.method] || p.method}
                          </td>
                          <td className="py-2.5 px-4 text-muted">{formatDate(p.createdAt)}</td>
                          <td className="py-2.5 px-4 text-right">
                            <Badge variant={pMeta.variant as any}>{pMeta.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted">
                Chưa có hoá đơn thanh toán nào.
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Edit member dialog */}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Cập nhật thông tin hội viên"
        description={member ? `${member.fullName} (${member.code})` : ''}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Select
              label="Giới tính"
              value={form.gender}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
            <Input
              label="Địa chỉ"
              className="sm:col-span-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Người liên hệ khẩn cấp"
              className="sm:col-span-2"
              value={form.emergencyContact}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
            />
            <Input
              label="Ghi chú nội bộ"
              className="sm:col-span-2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Hủy
            </Button>
            <Button isLoading={updateMutation.isPending} onClick={submitEdit}>
              <ShieldCheck className="size-4" />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
