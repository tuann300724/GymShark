'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, FileBadge, FilePen, Mail, Phone, UserPlus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import {
  trainerApi,
  type TrainerApplication,
  type TrainerApplicationStatus,
} from '@/services/trainer.service';
import type { TrainerProfileDraft } from '@/services/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

type Tab = 'pending' | 'profile' | 'history';
type ReviewKind = 'application' | 'profile';
type RejectTarget = { kind: ReviewKind; id: string; name: string };

const QUICK_REASONS: Record<ReviewKind, string[]> = {
  application: [
    'Ảnh bằng cấp mờ hoặc không đọc được',
    'Chứng chỉ chưa được công nhận / không xác minh được',
    'Phần giới thiệu quá sơ sài, chưa rõ kinh nghiệm',
    'Thông tin liên hệ chưa chính xác',
  ],
  profile: [
    'Nội dung giới thiệu chứa thông tin quảng cáo / liên hệ ngoài hệ thống',
    'Ảnh đại diện không phù hợp',
    'Thông tin chứng chỉ chưa được xác minh',
    'Mức phí kèm riêng không hợp lý',
  ],
};

const FIELD_LABELS: Record<keyof TrainerProfileDraft, string> = {
  specialization: 'Chuyên môn',
  certification: 'Chứng chỉ',
  experienceYears: 'Kinh nghiệm',
  bio: 'Giới thiệu',
  avatarUrl: 'Ảnh đại diện',
  gender: 'Giới tính',
  dateOfBirth: 'Ngày sinh',
  hourlyRate: 'Phí kèm riêng',
};

const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

/** Hiển thị giá trị field hồ sơ cho bảng so sánh */
function formatField(key: keyof TrainerProfileDraft, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'experienceYears') return `${value} năm`;
  if (key === 'hourlyRate') return `${formatCurrency(Number(value))}/buổi`;
  if (key === 'gender') return GENDER_LABELS[String(value)] ?? String(value);
  if (key === 'dateOfBirth') return formatDate(String(value));
  return String(value);
}

/** Ô giá trị trong bảng so sánh — ảnh đại diện hiện thành ảnh thu nhỏ */
function FieldValue({ field, value }: { field: keyof TrainerProfileDraft; value: unknown }) {
  if (field === 'avatarUrl' && typeof value === 'string' && value) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="Ảnh đại diện" className="size-16 rounded-xl object-cover" />;
  }
  return <>{formatField(field, value)}</>;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Ảnh đại diện ${name}`}
      className="size-14 shrink-0 rounded-xl border border-line object-cover"
    />
  ) : (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-line bg-ink font-display text-xl font-bold text-neon">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Contact({ email, phone }: { email: string; phone?: string | null }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted">
      <p className="flex items-center gap-1.5 truncate">
        <Mail className="size-3.5 shrink-0" /> {email}
      </p>
      {phone && (
        <p className="flex items-center gap-1.5">
          <Phone className="size-3.5 shrink-0" /> {phone}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="whitespace-pre-line text-sm leading-relaxed text-chalk">{children}</dd>
    </div>
  );
}

/** Dialog xem ảnh bằng cấp của một đơn (tải khi mở) */
function DocumentsDialog({
  app,
  onClose,
}: {
  app: TrainerApplication | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trainer-application-docs', app?.id],
    queryFn: () => trainerApi.applicationDocuments(app?.id ?? ''),
    enabled: Boolean(app),
  });
  return (
    <Dialog
      open={Boolean(app)}
      onClose={onClose}
      title="Ảnh bằng cấp / chứng chỉ"
      description={app ? `${app.fullName} — ${app.specialization}` : undefined}
    >
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <p className="text-sm text-danger">Không tải được ảnh bằng cấp.</p>
      ) : (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {(data ?? []).map((doc, i) => (
            <figure key={doc.id} className="space-y-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.dataUrl}
                alt={doc.caption || `Ảnh bằng cấp ${i + 1}`}
                className="w-full rounded-xl border border-line object-contain"
              />
              <figcaption className="text-xs text-muted">
                {doc.caption || `Ảnh ${i + 1}`}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Dialog>
  );
}

export default function TrainerApplicationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [historyStatus, setHistoryStatus] = useState<TrainerApplicationStatus>('APPROVED');
  const [rejecting, setRejecting] = useState<RejectTarget | null>(null);
  const [reason, setReason] = useState('');
  const [viewing, setViewing] = useState<TrainerApplication | null>(null);
  const [createdPassword, setCreatedPassword] = useState<{
    name: string;
    password: string;
  } | null>(null);

  const pendingQuery = useQuery({
    queryKey: ['trainer-applications', 'PENDING'],
    queryFn: () => trainerApi.applications('PENDING'),
    retry: 0,
  });
  const historyQuery = useQuery({
    queryKey: ['trainer-applications', historyStatus],
    queryFn: () => trainerApi.applications(historyStatus),
    enabled: tab === 'history',
    retry: 0,
  });
  const profileQuery = useQuery({
    queryKey: ['trainer-profile-changes'],
    queryFn: trainerApi.profileChanges,
    retry: 0,
  });

  const errMsg = (err: any, fallback: string) => {
    const m = err?.response?.data?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
  };

  const reviewMutation = useMutation({
    mutationFn: async (v: RejectTarget & { approved: boolean; reason?: string }) => {
      const res: { message: string; emailSent: boolean; temporaryPassword?: string } =
        v.kind === 'application'
          ? await trainerApi.reviewApplication(v.id, v.approved, v.reason)
          : await trainerApi.reviewProfileChange(v.id, v.approved, v.reason);
      return res;
    },
    onSuccess: (res, v) => {
      if (res.emailSent) toast.success(res.message, 'Đã gửi email kết quả cho huấn luyện viên.');
      else toast.error(res.message, 'Email chưa gửi được.');
      if (res.temporaryPassword)
        setCreatedPassword({ name: v.name, password: res.temporaryPassword });
      setRejecting(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['trainer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['trainer-profile-changes'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
    onError: (err: any) => toast.error('Thao tác thất bại', errMsg(err, 'Vui lòng thử lại.')),
  });

  const pending = pendingQuery.data?.data ?? [];
  const counts = pendingQuery.data?.counts ?? {};
  const profileChanges = profileQuery.data ?? [];
  const busy = reviewMutation.isPending ? reviewMutation.variables : undefined;

  const actions = (kind: ReviewKind, id: string, name: string, approveLabel: string) => (
    <div className="mt-4 flex gap-2">
      <Button
        className="flex-1"
        size="sm"
        isLoading={busy?.id === id && busy?.kind === kind && busy?.approved}
        disabled={reviewMutation.isPending}
        onClick={() => reviewMutation.mutate({ kind, id, name, approved: true })}
      >
        <Check className="size-3.5" /> {approveLabel}
      </Button>
      <Button
        className="flex-1"
        size="sm"
        variant="danger"
        disabled={reviewMutation.isPending}
        onClick={() => {
          setReason('');
          setRejecting({ kind, id, name });
        }}
      >
        <X className="size-3.5" /> Từ chối
      </Button>
    </div>
  );

  const applicationCard = (app: TrainerApplication, withActions: boolean) => (
    <Card key={app.id}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex gap-4">
          <Avatar name={app.fullName} url={app.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-chalk">{app.fullName}</p>
              {app.status === 'APPROVED' && <Badge variant="success">Đã duyệt</Badge>}
              {app.status === 'REJECTED' && <Badge variant="destructive">Từ chối</Badge>}
            </div>
            <Contact email={app.email} phone={app.phone} />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Chuyên môn" wide>
            {app.specialization}
          </Field>
          <Field label="Kinh nghiệm">{app.experienceYears} năm</Field>
          <Field label="Phí kèm riêng">{formatField('hourlyRate', app.hourlyRate)}</Field>
          <Field label="Chứng chỉ (khai báo)" wide>
            {app.certification || '—'}
          </Field>
          <Field label="Giới thiệu" wide>
            {app.bio}
          </Field>
        </dl>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 self-start"
          onClick={() => setViewing(app)}
        >
          <FileBadge className="size-3.5" /> Xem ảnh bằng cấp ({app._count?.documents ?? 0})
        </Button>
        <p className="mt-3 flex-1 text-xs text-muted">
          Gửi lúc {formatDateTime(app.createdAt)}
          {app.reviewedAt && ` · Xử lý lúc ${formatDateTime(app.reviewedAt)}`}
        </p>
        {app.status === 'REJECTED' && app.rejectReason && (
          <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-chalk">
            <b className="text-danger">Lý do:</b> {app.rejectReason}
          </p>
        )}
        {app.status === 'APPROVED' && app.trainerId && (
          <Link
            href={`/admin/trainers/${app.trainerId}`}
            className="mt-2 text-xs font-semibold text-neon hover:underline"
          >
            Xem hồ sơ PT đã tạo →
          </Link>
        )}
        {withActions && actions('application', app.id, app.fullName, 'Duyệt & tạo tài khoản')}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk">
          <BadgeCheck className="size-6 text-neon" /> Duyệt hồ sơ PT
        </h1>
        <p className="mt-1 text-xs text-muted">
          Huấn luyện viên tự do gửi đơn kèm ảnh bằng cấp (chưa có tài khoản). Duyệt thì hệ thống tạo
          tài khoản PT và gửi mật khẩu tạm qua email; từ chối thì PT nhận lý do qua email. Mọi chỉnh
          sửa hồ sơ công khai của PT cũng được duyệt tại đây.
        </p>
      </div>

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        tabs={[
          { value: 'pending', label: 'Đơn chờ duyệt', count: counts.PENDING ?? pending.length },
          { value: 'profile', label: 'Chỉnh sửa hồ sơ', count: profileChanges.length },
          { value: 'history', label: 'Đơn đã xử lý' },
        ]}
      />

      {tab === 'pending' &&
        (pendingQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : pendingQuery.isError ? (
          <ErrorState onRetry={() => pendingQuery.refetch()} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Không có đơn PT nào chờ duyệt"
            description="Khi huấn luyện viên gửi đơn ở trang công khai, đơn sẽ hiện ở đây."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {pending.map((app) => applicationCard(app, true))}
          </div>
        ))}

      {tab === 'history' && (
        <div className="space-y-4">
          <Tabs
            value={historyStatus}
            onChange={(v) => setHistoryStatus(v as TrainerApplicationStatus)}
            tabs={[
              { value: 'APPROVED', label: 'Đã duyệt', count: counts.APPROVED ?? 0 },
              { value: 'REJECTED', label: 'Đã từ chối', count: counts.REJECTED ?? 0 },
            ]}
          />
          {historyQuery.isLoading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : historyQuery.isError ? (
            <ErrorState onRetry={() => historyQuery.refetch()} />
          ) : (historyQuery.data?.data ?? []).length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Chưa có đơn nào"
              description="Các đơn đã duyệt hoặc từ chối sẽ hiện ở đây."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {(historyQuery.data?.data ?? []).map((app) => applicationCard(app, false))}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' &&
        (profileQuery.isLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : profileQuery.isError ? (
          <ErrorState onRetry={() => profileQuery.refetch()} />
        ) : profileChanges.length === 0 ? (
          <EmptyState
            icon={FilePen}
            title="Không có chỉnh sửa hồ sơ nào chờ duyệt"
            description="Khi PT sửa hồ sơ công khai, bản chỉnh sửa sẽ chờ duyệt ở đây."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {profileChanges.map((item) => {
              const draft = item.pendingProfile ?? {};
              const keys = Object.keys(draft) as (keyof TrainerProfileDraft)[];
              return (
                <Card key={item.id}>
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex gap-4">
                      <Avatar name={item.user.fullName} url={item.user.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/trainers/${item.id}`}
                          className="block truncate font-semibold text-chalk hover:text-neon"
                        >
                          {item.user.fullName}
                        </Link>
                        <Contact email={item.user.email ?? ''} phone={item.user.phone} />
                      </div>
                    </div>
                    <div className="mt-4 flex-1 overflow-x-auto rounded-xl border border-line">
                      <table className="w-full min-w-[420px] text-left text-sm">
                        <thead className="bg-ink text-[11px] uppercase tracking-wider text-muted">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Mục</th>
                            <th className="px-3 py-2 font-semibold">Đang hiển thị</th>
                            <th className="px-3 py-2 font-semibold text-neon">Đề xuất</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line align-top">
                          {keys.map((key) => (
                            <tr key={key}>
                              <td className="whitespace-nowrap px-3 py-2 text-muted">
                                {FIELD_LABELS[key] ?? key}
                              </td>
                              <td className="whitespace-pre-line break-words px-3 py-2 text-muted line-through decoration-muted/50">
                                <FieldValue field={key} value={item.currentProfile[key]} />
                              </td>
                              <td className="whitespace-pre-line break-words px-3 py-2 text-chalk">
                                <FieldValue field={key} value={draft[key]} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      Gửi lúc {formatDateTime(item.profileSubmittedAt)}
                    </p>
                    {actions('profile', item.id, item.user.fullName, 'Duyệt')}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

      <DocumentsDialog app={viewing} onClose={() => setViewing(null)} />

      <Dialog
        open={Boolean(createdPassword)}
        onClose={() => setCreatedPassword(null)}
        title="Chưa gửi được email"
        description={
          createdPassword
            ? `Tài khoản PT của ${createdPassword.name} đã được tạo. Hãy gửi mật khẩu tạm này cho PT.`
            : undefined
        }
      >
        <p className="rounded-lg border border-line bg-ink px-4 py-3 font-mono text-lg text-neon">
          {createdPassword?.password}
        </p>
      </Dialog>

      <Dialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={rejecting?.kind === 'profile' ? 'Từ chối chỉnh sửa hồ sơ' : 'Từ chối đơn đăng ký PT'}
        description={rejecting ? `Lý do sẽ được gửi qua email cho ${rejecting.name}.` : undefined}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(rejecting ? QUICK_REASONS[rejecting.kind] : []).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-neon/40 hover:text-chalk"
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea
            id="trainer-reject-reason"
            label="Lý do từ chối"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Vui lòng bổ sung ảnh chứng chỉ rõ nét hơn."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              isLoading={reviewMutation.isPending}
              onClick={() =>
                rejecting &&
                reviewMutation.mutate({ ...rejecting, approved: false, reason: reason.trim() })
              }
            >
              <X className="size-4" /> Từ chối và gửi email
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
