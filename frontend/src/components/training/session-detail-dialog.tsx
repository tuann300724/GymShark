'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { trainingApi } from '@/services/training.service';
import { formatDateTime } from '@/lib/utils';
import { SessionStatusBadge, SessionTypeBadge } from './session-badges';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Users,
  Dumbbell,
  CheckCircle2,
  XCircle,
  Pencil,
  ClipboardList,
} from 'lucide-react';

interface SessionDetailDialogProps {
  sessionId: string | null;
  onClose: () => void;
  /** Cho phép thao tác hành động (admin/staff quản lý) */
  canManage?: boolean;
  /** Cho phép trainer ghi chú tiến trình */
  canProgress?: boolean;
  /** Cho phép trainer đánh dấu hoàn thành buổi (không hủy/không sửa) */
  canComplete?: boolean;
  /** Sau khi đổi trạng thái → gọi callback để refresh */
  onChanged?: () => void;
}

export function SessionDetailDialog({
  sessionId,
  onClose,
  canManage = false,
  canProgress = false,
  canComplete = false,
  onChanged,
}: SessionDetailDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [progressOpen, setProgressOpen] = useState(false);
  const [note, setNote] = useState('');
  const [performance, setPerformance] = useState('');
  const [recommendation, setRecommendation] = useState('');

  const { data: session, isLoading } = useQuery({
    queryKey: ['session-detail', sessionId],
    queryFn: () => trainingApi.detail(sessionId!),
    enabled: !!sessionId,
    retry: 0,
  });

  const { data: progressNotes } = useQuery({
    queryKey: ['session-progress', sessionId],
    queryFn: () => trainingApi.getProgress(sessionId!),
    enabled: !!sessionId,
    retry: 0,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['session-detail', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['session-progress', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['training-sessions'] });
    onChanged?.();
  };

  const cancelMutation = useMutation({
    mutationFn: (cancellationNote: string) =>
      trainingApi.cancel(sessionId!, cancellationNote || undefined),
    onSuccess: () => {
      toast.success('Đã hủy buổi tập');
      refresh();
    },
    onError: (e: any) => toast.error('Không thể hủy buổi tập', e?.response?.data?.message),
  });

  const completeMutation = useMutation({
    mutationFn: () => trainingApi.complete(sessionId!),
    onSuccess: () => {
      toast.success('Đã đánh dấu hoàn thành');
      refresh();
    },
    onError: (e: any) => toast.error('Không thể hoàn thành', e?.response?.data?.message),
  });

  const progressMutation = useMutation({
    mutationFn: () => trainingApi.addProgress(sessionId!, { note, performance, recommendation }),
    onSuccess: () => {
      toast.success('Đã lưu ghi chú buổi tập');
      setProgressOpen(false);
      setNote('');
      setPerformance('');
      setRecommendation('');
      refresh();
    },
    onError: (e: any) => toast.error('Không thể lưu ghi chú', e?.response?.data?.message),
  });

  const cancelInProgress = cancelMutation.isPending || completeMutation.isPending;

  return (
    <Dialog
      open={!!sessionId}
      onClose={onClose}
      title={session?.title || 'Chi tiết buổi tập'}
      description={session ? formatDateTime(session.startTime) : undefined}
      className="max-w-2xl"
    >
      {isLoading || !session ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              icon={User}
              label="Huấn luyện viên"
              value={session.trainer?.user.fullName || '--'}
            />
            <InfoRow
              icon={Users}
              label="Hội viên"
              value={
                session.member
                  ? `${session.member.fullName} (${session.member.code})`
                  : 'Lớp công khai'
              }
            />
            <InfoRow icon={CalendarDays} label="Ngày" value={formatDateTime(session.startTime)} />
            <InfoRow icon={Clock} label="Thời lượng" value={`${formatDateTime(session.endTime)}`} />
            <InfoRow icon={MapPin} label="Phòng" value={session.room?.name || '--'} />
            <InfoRow icon={Dumbbell} label="Chi nhánh" value={session.branch?.name || '--'} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SessionTypeBadge type={session.type} />
            <SessionStatusBadge status={session.status} />
            {session.completedAt && (
              <Badge variant="outline">Hoàn thành lúc {formatDateTime(session.completedAt)}</Badge>
            )}
          </div>

          {(session.description || session.notes) && (
            <div className="space-y-2 rounded-xl border border-line bg-ink/60 p-4">
              {session.description && (
                <p className="text-sm text-muted">
                  <span className="font-semibold text-chalk">Mô tả: </span>
                  {session.description}
                </p>
              )}
              {session.notes && (
                <p className="text-sm text-muted">
                  <span className="font-semibold text-chalk">Ghi chú: </span>
                  {session.notes}
                </p>
              )}
              {session.cancellationNote && (
                <p className="text-sm text-danger">
                  <span className="font-semibold">Lý do hủy: </span>
                  {session.cancellationNote}
                </p>
              )}
            </div>
          )}

          {/* Progress notes */}
          {progressNotes && progressNotes.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <ClipboardList className="size-3.5 text-neon" /> Ghi chú tiến trình buổi tập
              </h4>
              <div className="space-y-2">
                {progressNotes.map((p) => (
                  <div key={p.id} className="rounded-xl border border-line bg-surface p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-chalk">{p.trainer?.user.fullName}</span>
                      <span className="text-xs text-muted">{formatDateTime(p.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-muted">{p.note}</p>
                    {p.performance && (
                      <p className="mt-1.5 text-xs text-neon">
                        <span className="font-semibold">Đánh giá: </span>
                        {p.performance}
                      </p>
                    )}
                    {p.recommendation && (
                      <p className="mt-1 text-xs text-sky-400">
                        <span className="font-semibold">Lời khuyên: </span>
                        {p.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress form */}
          {canProgress && session.status === 'COMPLETED' && !progressOpen && (
            <Button variant="secondary" size="sm" onClick={() => setProgressOpen(true)}>
              <Pencil className="size-3.5" /> Ghi chú tiến trình
            </Button>
          )}
          {canProgress && session.status === 'COMPLETED' && progressOpen && (
            <div className="space-y-3 rounded-xl border border-line bg-ink/60 p-4">
              <Textarea
                label="Ghi chú"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Đánh giá chung buổi tập..."
                rows={2}
              />
              <Textarea
                label="Đánh giá (performance)"
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
                placeholder="Ví dụ: Member hoàn thành tốt bài tập chân."
                rows={2}
              />
              <Textarea
                label="Lời khuyên (recommendation)"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Ví dụ: Tăng dần mức tạ trong các buổi tiếp theo."
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setProgressOpen(false)}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={progressMutation.isPending}
                  disabled={!note.trim()}
                  onClick={() => progressMutation.mutate()}
                >
                  Lưu ghi chú
                </Button>
              </div>
            </div>
          )}

          {/* Footer actions */}
          {(canManage || canComplete) && session.status === 'SCHEDULED' && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => completeMutation.mutate()}
                isLoading={completeMutation.isPending}
              >
                <CheckCircle2 className="size-3.5" /> Đánh dấu xong
              </Button>
              {canManage && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const reason = window.prompt('Lý do hủy buổi tập (không bắt buộc):', '');
                    if (reason !== null) cancelMutation.mutate(reason);
                  }}
                  isLoading={cancelInProgress}
                >
                  <XCircle className="size-3.5" /> Hủy buổi tập
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-ink/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-neon" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="truncate text-sm font-medium text-chalk">{value}</p>
      </div>
    </div>
  );
}
