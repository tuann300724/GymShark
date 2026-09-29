'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { trainerApi } from '@/services/trainer.service';
import { TRAINER_STATUS_META, ASSIGNMENT_STATUS_META } from '@/lib/status';
import { SessionDetailDialog } from '@/components/training/session-detail-dialog';
import { SessionStatusBadge, SessionTypeBadge } from '@/components/training/session-badges';
import { TrainerFormDialog } from '@/components/training/trainer-form-dialog';
import { formatDate, formatDateTime } from '@/lib/utils';
import apiClient from '@/lib/axios';
import type { TrainingSession, TrainerAssignment } from '@/services/types';
import {
  UserCheck,
  Pencil,
  Power,
  Users,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  Mail,
  Phone,
  Award,
  Briefcase,
  MapPin,
  GraduationCap,
  Star,
  UserPlus,
  UserMinus,
  Search,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'overview' | 'members' | 'schedule' | 'history';

export default function TrainerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const {
    data: trainer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['trainer-detail', id],
    queryFn: () => trainerApi.detail(id),
    enabled: !!id,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => trainerApi.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động HLV', 'Lịch sử được giữ lại.');
      queryClient.invalidateQueries({ queryKey: ['trainer-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (e: any) => toast.error('Thao tác thất bại', e?.response?.data?.message),
  });

  const activeAssignments = (trainer?.trainerMembers || []).filter((a) => a.status === 'ACTIVE');
  const upcoming = (trainer?.schedules || [])
    .filter((s) => s.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const history = (trainer?.schedules || []).filter((s) => s.status !== 'SCHEDULED');

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'members', label: 'Hội viên', count: activeAssignments.length },
    { key: 'schedule', label: 'Lịch dạy sắp tới', count: upcoming.length },
    { key: 'history', label: 'Lịch sử buổi tập', count: history.length },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !trainer) {
    return (
      <div className="py-20 text-center text-xs text-danger">
        Không tải được thông tin huấn luyện viên. Có thể HLV đã bị xóa hoặc ID không đúng.
      </div>
    );
  }

  const statusMeta = TRAINER_STATUS_META[trainer.status] || {
    label: trainer.status,
    variant: 'outline' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {trainer.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trainer.user.avatarUrl} alt="" className="size-16 rounded-2xl object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-2xl border border-neon/40 bg-neon/10 text-2xl font-bold uppercase text-neon">
              {trainer.user.fullName?.charAt(0)}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-chalk">
                {trainer.user.fullName}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-neon font-semibold">{trainer.specialization}</p>
            <p className="mt-0.5 text-xs text-muted">
              Email: {trainer.user.email} {trainer.user.phone ? ` · ${trainer.user.phone}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Chỉnh sửa
          </Button>
          {trainer.status !== 'INACTIVE' && (
            <Button
              variant="danger"
              size="md"
              isLoading={deactivateMutation.isPending}
              onClick={() => {
                if (window.confirm('Ngừng hoạt động HLV này? Tài khoản đăng nhập sẽ bị khóa.'))
                  deactivateMutation.mutate();
              }}
            >
              <Power className="size-4" /> Ngừng hoạt động
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label="Hội viên phụ trách"
          value={trainer.stats?.activeMembers || 0}
          accent="neon"
        />
        <StatTile
          icon={CalendarDays}
          label="Tổng số buổi"
          value={trainer.stats?.totalSessions || 0}
          accent="sky"
        />
        <StatTile
          icon={TrendingUp}
          label="Buổi sắp tới"
          value={trainer.stats?.upcomingSessions || 0}
          accent="amber"
        />
        <StatTile
          icon={CheckCircle2}
          label="Đã hoàn thành"
          value={trainer.stats?.completedSessions || 0}
          accent="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors',
              tab === t.key
                ? 'border-neon text-neon'
                : 'border-transparent text-muted hover:text-chalk',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  tab === t.key ? 'bg-neon/15 text-neon' : 'bg-line text-muted',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-4 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Thông tin liên hệ
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem icon={Mail} label="Email" value={trainer.user.email || '--'} />
                <InfoItem icon={Phone} label="Số điện thoại" value={trainer.user.phone || '--'} />
                <InfoItem
                  icon={UserCheck}
                  label="Giới tính"
                  value={
                    trainer.gender === 'MALE'
                      ? 'Nam'
                      : trainer.gender === 'FEMALE'
                        ? 'Nữ'
                        : trainer.gender === 'OTHER'
                          ? 'Khác'
                          : '--'
                  }
                />
                <InfoItem
                  icon={MapPin}
                  label="Ngày sinh"
                  value={trainer.dateOfBirth ? formatDate(trainer.dateOfBirth) : '--'}
                />
              </div>

              <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-muted">
                Chuyên môn & Kinh nghiệm
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem icon={Briefcase} label="Chuyên môn" value={trainer.specialization} />
                <InfoItem icon={Award} label="Chứng chỉ" value={trainer.certification || '--'} />
                <InfoItem
                  icon={GraduationCap}
                  label="Kinh nghiệm"
                  value={`${trainer.experienceYears} năm`}
                />
                <InfoItem
                  icon={Star}
                  label="Đánh giá"
                  value={`${trainer.rating} / 5.0`}
                  valueClass="text-amber-400"
                />
              </div>

              {trainer.bio && (
                <>
                  <h3 className="pt-2 text-sm font-bold uppercase tracking-wider text-muted">
                    Giới thiệu
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{trainer.bio}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Tóm tắt</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <SummaryRow label="Hội viên đang phụ trách" value={activeAssignments.length} />
                <SummaryRow
                  label="Tổng số buổi đã lên lịch"
                  value={trainer.stats?.totalSessions || 0}
                />
                <SummaryRow label="Buổi chờ diễn ra" value={trainer.stats?.upcomingSessions || 0} />
                <SummaryRow
                  label="Buổi đã hoàn thành"
                  value={trainer.stats?.completedSessions || 0}
                />
              </ul>
              {trainer.hourlyRate && (
                <div className="mt-4 rounded-xl border border-neon/30 bg-neon/5 p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Phí kèm riêng
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-neon">
                    {Number(trainer.hourlyRate).toLocaleString('vi-VN')} ₫{' '}
                    <span className="text-xs font-medium">/ buổi</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'members' && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                Phân công HLV ↔ Hội viên ({activeAssignments.length} đang hoạt động)
              </h3>
              <Button variant="primary" size="sm" onClick={() => setAssignOpen(true)}>
                <UserPlus className="size-3.5" /> Gán hội viên
              </Button>
            </div>

            {trainer.trainerMembers && trainer.trainerMembers.length > 0 ? (
              <div className="mt-4 space-y-2">
                {trainer.trainerMembers.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between',
                      a.status === 'ACTIVE' ? 'border-neon/30 bg-neon/5' : 'border-line bg-ink/40',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex size-10 items-center justify-center rounded-full text-sm font-bold uppercase',
                          a.status === 'ACTIVE' ? 'bg-neon/15 text-neon' : 'bg-line text-muted',
                        )}
                      >
                        {a.member?.fullName?.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-chalk">{a.member?.fullName}</p>
                        <p className="text-xs text-muted">
                          {a.member?.code} · {a.member?.phone || '--'}
                          {a.member?.memberships?.some((m) => m.status === 'ACTIVE') && (
                            <span className="ml-1 text-neon">
                              ·{' '}
                              {
                                a.member.memberships.find((m) => m.status === 'ACTIVE')?.package
                                  ?.name
                              }
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ASSIGNMENT_STATUS_META[a.status]?.variant || 'outline'}>
                        {ASSIGNMENT_STATUS_META[a.status]?.label || a.status}
                      </Badge>
                      {a.startDate && (
                        <span className="text-[10px] text-muted">
                          từ {formatDate(a.startDate)}
                          {a.endDate ? ` → ${formatDate(a.endDate)}` : ''}
                        </span>
                      )}
                      {a.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Kết thúc phân công với ${a.member?.fullName}?`))
                              unassign(id, a.memberId, toast, queryClient);
                          }}
                        >
                          <UserMinus className="size-3.5" /> Kết thúc
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 py-10 text-center text-xs text-muted">
                <UserPlus className="mx-auto size-7 text-muted/50" />
                <p className="mt-2">HLV chưa được gán cho hội viên nào.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'schedule' && (
        <SessionList
          sessions={upcoming}
          emptyText="Hiện chưa có buổi tập sắp tới."
          onOpen={(s) => setSessionId(s.id)}
        />
      )}

      {tab === 'history' && (
        <SessionList
          sessions={history}
          emptyText="Chưa có lịch sử buổi tập."
          onOpen={(s) => setSessionId(s.id)}
        />
      )}

      {/* Dialogs */}
      <TrainerFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['trainer-detail', id] })}
        editing={trainer as any}
      />
      <AssignMemberDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        trainerId={id}
        trainerName={trainer.user.fullName}
        existingActive={activeAssignments.map((a) => a.memberId)}
      />
      <SessionDetailDialog
        sessionId={sessionId}
        onClose={() => setSessionId(null)}
        canManage
        onChanged={() => queryClient.invalidateQueries({ queryKey: ['trainer-detail', id] })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: 'neon' | 'sky' | 'amber' | 'purple';
}) {
  const accentMap = {
    neon: 'bg-neon/10 text-neon border-neon/25',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl border',
            accentMap[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-2xl font-bold text-chalk font-display">{value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-neon" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={cn('truncate text-sm font-medium text-chalk', valueClass)}>{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-bold text-chalk">{value}</span>
    </li>
  );
}

function SessionList({
  sessions,
  emptyText,
  onOpen,
}: {
  sessions: TrainingSession[];
  emptyText: string;
  onOpen: (s: TrainingSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted">{emptyText}</CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s)}
          className="flex w-full flex-col gap-2 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-neon/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-chalk">{s.title}</span>
              <SessionTypeBadge type={s.type} />
              <SessionStatusBadge status={s.status} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {formatDateTime(s.startTime)}
              {s.member && ` · ${s.member.fullName} (${s.member.code})`}
              {s.room && ` · Phòng ${s.room.name}`}
            </p>
            {s.cancellationNote && (
              <p className="mt-1 text-xs text-danger">Hủy: {s.cancellationNote}</p>
            )}
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted" />
        </button>
      ))}
    </div>
  );
}

async function unassign(
  trainerId: string,
  memberId: string,
  toast: ReturnType<typeof useToast>,
  queryClient: any,
) {
  try {
    await trainerApi.unassignMember(trainerId, memberId);
    toast.success('Đã kết thúc phân công');
    queryClient.invalidateQueries({ queryKey: ['trainer-detail', trainerId] });
  } catch (e: any) {
    toast.error('Không thể kết thúc phân công', e?.response?.data?.message);
  }
}

// ---------------------------------------------------------------------------
// Assign member dialog
// ---------------------------------------------------------------------------

function AssignMemberDialog({
  open,
  onClose,
  trainerId,
  trainerName,
  existingActive,
}: {
  open: boolean;
  onClose: () => void;
  trainerId: string;
  trainerName: string;
  existingActive: string[];
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const search = async (q: string) => {
    setSearching(true);
    try {
      const res = await apiClient.get('/members', {
        params: { search: q, limit: 8, status: 'ACTIVE' },
      });
      setMembers(res.data?.data || []);
    } catch {
      setMembers([]);
    } finally {
      setSearching(false);
    }
  };

  const assignment = useMutation({
    mutationFn: () => trainerApi.assignMember(trainerId, selected.id),
    onSuccess: () => {
      toast.success('Đã gán huấn luyện viên cho hội viên');
      queryClient.invalidateQueries({ queryKey: ['trainer-detail', trainerId] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setSelected(null);
      setQuery('');
      onClose();
    },
    onError: (e: any) => toast.error('Không gán được', e?.response?.data?.message),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Gán hội viên cho HLV"
      description={`Chọn hội viên để ${trainerName} phụ trách. Mỗi hội viên chỉ có 1 HLV đang hoạt động.`}
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              search(e.target.value);
            }}
            placeholder="Tìm hội viên theo tên, mã, SĐT..."
            className="h-11 w-full rounded-sm border border-line bg-ink pl-9 pr-3.5 text-sm text-chalk placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70"
          />
        </div>

        {searching && <p className="text-xs text-muted">Đang tìm...</p>}

        {selected ? (
          <div className="rounded-xl border border-neon/40 bg-neon/5 p-3">
            <p className="text-sm font-bold text-chalk">{selected.fullName}</p>
            <p className="text-xs text-muted">
              {selected.code} · {selected.phone || '--'}
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Chọn lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={assignment.isPending}
                onClick={() => assignment.mutate()}
              >
                <UserPlus className="size-3.5" /> Xác nhận gán
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-auto">
            {members.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">Nhập từ khóa để tìm hội viên.</p>
            ) : (
              members.map((m) => {
                const assigned = existingActive.includes(m.id);
                const hasMembership = m.memberships?.some((ms: any) => ms.status === 'ACTIVE');
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={assigned}
                    onClick={() => setSelected(m)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line bg-ink/40 p-2.5 text-left transition-colors hover:border-neon/40 disabled:opacity-40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neon/10 text-xs font-bold text-neon">
                      {m.fullName?.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-chalk">
                        {m.fullName}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {m.code} ·{' '}
                        {hasMembership
                          ? m.memberships.find((ms: any) => ms.status === 'ACTIVE')?.package?.name
                          : 'Không có gói ACTIVE'}
                      </span>
                    </span>
                    {assigned ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                        <AlertTriangle className="size-3" /> Đã được gán
                      </span>
                    ) : hasMembership ? (
                      <span className="text-[10px] font-bold text-neon">CÓ GÓI</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400">HẾT HẠN</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
