'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Handshake,
  KeyRound,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  PhoneCall,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  partnerApi,
  type PartnerLeadRecord,
  type PartnerLeadStatus,
} from '@/services/partner.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn, formatDateTime } from '@/lib/utils';
import { gymTierLabel } from '@/lib/package-options';
import { LeadFacilityAssessment } from '@/components/admin/facility-assessment';

// ---------------------------------------------------------------------------
// Quy trình: Mới nhận → Đã liên hệ → Đang tư vấn → Đã chốt hợp tác → Tạo tài khoản
//            (bước nào cũng có thể Đóng; yêu cầu đã đóng có thể Mở lại)
// ---------------------------------------------------------------------------

export const LEAD_STATUS_LABELS: Record<PartnerLeadStatus, string> = {
  NEW: 'Mới nhận',
  CONTACTED: 'Đã liên hệ',
  CONSULTING: 'Đang tư vấn',
  CONVERTED: 'Đã chốt hợp tác',
  CLOSED: 'Đã đóng',
};

export const LEAD_STATUS_HINTS: Record<PartnerLeadStatus, string> = {
  NEW: 'Chờ admin gọi lại',
  CONTACTED: 'Đã gọi, xác nhận nhu cầu',
  CONSULTING: 'Gửi báo giá, hẹn khảo sát',
  CONVERTED: 'Ký hợp đồng, cấp tài khoản',
  CLOSED: 'Không tiếp tục hợp tác',
};

export const LEAD_PIPELINE: PartnerLeadStatus[] = ['NEW', 'CONTACTED', 'CONSULTING', 'CONVERTED'];

export const LEAD_DIRECTION_LABELS = { OWNER: 'Phòng gym riêng', COMMUNITY: 'Gym Cộng đồng' };

export function leadStatusVariant(status: PartnerLeadStatus) {
  if (status === 'NEW') return 'warning' as const;
  if (status === 'CONVERTED') return 'success' as const;
  if (status === 'CLOSED') return 'destructive' as const;
  return 'info' as const;
}

type StepAction = {
  to: PartnerLeadStatus;
  label: string;
  icon: typeof PhoneCall;
  /** Hướng dẫn admin cần làm gì trước khi bấm */
  checklist: string[];
  noteLabel: string;
  notePlaceholder: string;
  noteRequired: boolean;
};

/** Bước tiếp theo (nút chính) cho từng trạng thái */
export const NEXT_STEP: Partial<Record<PartnerLeadStatus, StepAction>> = {
  NEW: {
    to: 'CONTACTED',
    label: 'Đã liên hệ',
    icon: PhoneCall,
    checklist: [
      'Gọi điện hoặc email cho người liên hệ trong 24 giờ',
      'Xác nhận hướng hợp tác, quy mô phòng tập và địa chỉ',
    ],
    noteLabel: 'Kết quả cuộc gọi',
    notePlaceholder: 'VD: Đã gọi lúc 10h, chủ phòng 2 cơ sở, muốn nghe báo giá gói Cộng đồng.',
    noteRequired: false,
  },
  CONTACTED: {
    to: 'CONSULTING',
    label: 'Bắt đầu tư vấn',
    icon: MessageSquareText,
    checklist: ['Gửi báo giá và điều khoản hợp tác', 'Hẹn lịch khảo sát cơ sở / demo hệ thống'],
    noteLabel: 'Nội dung tư vấn',
    notePlaceholder: 'VD: Đã gửi báo giá 799.000đ/tháng, hẹn khảo sát thứ 6.',
    noteRequired: false,
  },
  CONSULTING: {
    to: 'CONVERTED',
    label: 'Chốt hợp tác',
    icon: Handshake,
    checklist: [
      'Hai bên đã thống nhất gói, phí và tỷ lệ hoa hồng',
      'Hợp đồng đã ký — bước sau sẽ tạo tài khoản đối tác',
    ],
    noteLabel: 'Kết quả chốt hợp tác *',
    notePlaceholder: 'VD: Ký HĐ số 12/2026, gói Cộng đồng, hoa hồng 30%, bắt đầu 01/12.',
    noteRequired: true,
  },
  CLOSED: {
    to: 'CONTACTED',
    label: 'Mở lại',
    icon: RotateCcw,
    checklist: ['Yêu cầu sẽ quay về bước "Đã liên hệ" để tiếp tục xử lý'],
    noteLabel: 'Lý do mở lại',
    notePlaceholder: 'VD: Đối tác liên hệ lại, muốn trao đổi tiếp.',
    noteRequired: false,
  },
};

export const CLOSE_ACTION: StepAction = {
  to: 'CLOSED',
  label: 'Đóng yêu cầu',
  icon: XCircle,
  checklist: ['Chỉ đóng khi đối tác từ chối, không liên lạc được hoặc không phù hợp'],
  noteLabel: 'Lý do đóng *',
  notePlaceholder: 'VD: Đã gọi 3 lần không bắt máy / Đối tác chưa có nhu cầu.',
  noteRequired: true,
};

export function canClose(status: PartnerLeadStatus) {
  return status === 'NEW' || status === 'CONTACTED' || status === 'CONSULTING';
}

// ---------------------------------------------------------------------------
// Thanh tiến độ 4 bước
// ---------------------------------------------------------------------------

export function LeadStepper({
  status,
  compact = false,
}: {
  status: PartnerLeadStatus;
  compact?: boolean;
}) {
  const closed = status === 'CLOSED';
  const current = LEAD_PIPELINE.indexOf(status);
  return (
    <ol
      aria-label={`Tiến độ: ${LEAD_STATUS_LABELS[status]}`}
      className={cn('flex items-center', compact ? 'gap-1' : 'gap-2')}
    >
      {LEAD_PIPELINE.map((step, index) => {
        const done = !closed && index <= current;
        const active = !closed && index === current;
        return (
          <li key={step} className={cn('flex items-center', compact ? 'gap-1' : 'flex-1 gap-2')}>
            <span
              title={LEAD_STATUS_LABELS[step]}
              className={cn(
                'grid shrink-0 place-items-center rounded-full border text-[10px] font-bold',
                compact ? 'size-5' : 'size-7',
                done ? 'border-neon/60 bg-neon/10 text-neon' : 'border-line bg-ink text-muted',
                active && 'ring-2 ring-neon/30',
                closed && 'opacity-50',
              )}
            >
              {done && !active ? <CheckCircle2 className="size-3" /> : index + 1}
            </span>
            {!compact && (
              <span
                className={cn(
                  'hidden text-xs font-semibold sm:inline',
                  done ? 'text-chalk' : 'text-muted',
                )}
              >
                {LEAD_STATUS_LABELS[step]}
              </span>
            )}
            {index < LEAD_PIPELINE.length - 1 && (
              <span
                className={cn(
                  'h-px',
                  compact ? 'w-3' : 'min-w-4 flex-1',
                  !closed && index < current ? 'bg-neon/50' : 'bg-line',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Hộp thoại chuyển bước (ghi kết quả của bước)
// ---------------------------------------------------------------------------

export function LeadTransitionDialog({
  lead,
  action,
  onClose,
  onDone,
}: {
  lead: PartnerLeadRecord | null;
  action: StepAction | null;
  onClose: () => void;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [note, setNote] = useState('');
  const [notifyPartner, setNotifyPartner] = useState(true);

  useEffect(() => {
    setNote('');
    setNotifyPartner(true);
  }, [lead?.id, action?.to]);

  const mutation = useMutation({
    mutationFn: () =>
      partnerApi.adminTransitionLead(lead!.id, {
        status: action!.to,
        note: note.trim() || undefined,
        notifyPartner: action!.to === 'CLOSED' ? notifyPartner : undefined,
      }),
    onSuccess: (result) => {
      success(
        `Đã chuyển sang "${LEAD_STATUS_LABELS[action!.to]}".`,
        result.emailSent === false ? 'Chưa gửi được email cho đối tác.' : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-lead-history', lead!.id] });
      onDone?.();
      onClose();
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Không thể cập nhật bước xử lý.';
      error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const open = Boolean(lead && action);
  const missingNote = Boolean(action?.noteRequired && !note.trim());
  // Gym Cộng đồng phải được xếp hạng phòng trước khi chốt hợp tác
  const needsTier = Boolean(
    action?.to === 'CONVERTED' && lead?.direction === 'COMMUNITY' && !lead?.assessedTier,
  );

  return (
    <Dialog
      open={open}
      onClose={() => !mutation.isPending && onClose()}
      title={action ? action.label : ''}
      description={
        lead && action
          ? `${lead.contactName} · ${LEAD_STATUS_LABELS[lead.status]} → ${LEAD_STATUS_LABELS[action.to]}`
          : undefined
      }
    >
      {action && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!missingNote && !needsTier) mutation.mutate();
          }}
        >
          {needsTier && (
            <p
              role="alert"
              className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs font-medium text-danger"
            >
              Phòng gym chưa được xếp hạng. Mở Chi tiết → Đánh giá cơ sở vật chất để chọn hạng
              Standard/Plus/Premium trước khi chốt hợp tác.
            </p>
          )}
          <ul className="space-y-1.5 rounded-xl border border-line bg-ink p-3">
            {action.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-neon" />
                {item}
              </li>
            ))}
          </ul>
          <Textarea
            label={action.noteLabel}
            name="lead-step-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={action.notePlaceholder}
          />
          {action.to === 'CLOSED' && (
            <label className="flex items-start gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="mt-0.5 accent-neon"
                checked={notifyPartner}
                onChange={(event) => setNotifyPartner(event.target.checked)}
              />
              Gửi email báo cho người liên hệ kèm lý do trên
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={action.to === 'CLOSED' ? 'danger' : 'primary'}
              isLoading={mutation.isPending}
              disabled={missingNote || needsTier}
            >
              Xác nhận
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Hộp thoại chi tiết: thông tin, tiến độ, ghi chú nội bộ, lịch sử xử lý
// ---------------------------------------------------------------------------

const HISTORY_LABELS: Record<string, string> = {
  PARTNER_LEAD_CREATED: 'Gửi yêu cầu hợp tác',
  PARTNER_LEAD_NOTE: 'Cập nhật ghi chú nội bộ',
  PARTNER_LEAD_ACCOUNT: 'Tạo tài khoản đối tác',
  PARTNER_LEAD_ASSESS: 'Xếp hạng phòng gym',
};

export function LeadDetailDialog({
  lead,
  onClose,
  onAction,
  onCreateAccount,
}: {
  lead: PartnerLeadRecord | null;
  onClose: () => void;
  onAction: (lead: PartnerLeadRecord, action: StepAction) => void;
  onCreateAccount: (lead: PartnerLeadRecord) => void;
}) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [notes, setNotes] = useState('');

  useEffect(() => setNotes(lead?.notes ?? ''), [lead?.id, lead?.notes]);

  const history = useQuery({
    queryKey: ['admin-partner-lead-history', lead?.id],
    queryFn: () => partnerApi.adminLeadHistory(lead!.id),
    enabled: Boolean(lead),
  });

  const saveNotes = useMutation({
    mutationFn: () => partnerApi.adminUpdateLead(lead!.id, { notes }),
    onSuccess: () => {
      success('Đã lưu ghi chú nội bộ.');
      queryClient.invalidateQueries({ queryKey: ['admin-partner-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-lead-history', lead!.id] });
    },
    onError: () => error('Không lưu được ghi chú. Vui lòng thử lại.'),
  });

  if (!lead) return null;

  const next = NEXT_STEP[lead.status];

  return (
    <Dialog
      open
      onClose={onClose}
      title="Chi tiết yêu cầu hợp tác"
      description={`${LEAD_DIRECTION_LABELS[lead.direction]} · gửi lúc ${formatDateTime(lead.createdAt)}`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <section className="grid gap-3 rounded-xl border border-line bg-ink p-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="font-semibold text-chalk">{lead.contactName}</p>
            {lead.address && (
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {lead.address}
              </p>
            )}
          </div>
          <div className="min-w-0 space-y-1 text-xs">
            <a
              className="flex items-center gap-1.5 text-neon hover:underline"
              href={`tel:${lead.phone}`}
            >
              <Phone className="size-3.5" /> {lead.phone}
            </a>
            <a
              className="flex items-center gap-1.5 break-all text-neon hover:underline"
              href={`mailto:${lead.email}`}
            >
              <Mail className="size-3.5 shrink-0" /> {lead.email}
            </a>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted sm:col-span-2">
            <span className="font-semibold text-chalk">Nội dung: </span>
            {lead.message || 'Chưa có nội dung bổ sung'}
          </p>
        </section>

        {lead.direction === 'COMMUNITY' && <LeadFacilityAssessment lead={lead} />}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Tiến độ</h3>
            <Badge variant={leadStatusVariant(lead.status)}>
              {LEAD_STATUS_LABELS[lead.status]}
            </Badge>
          </div>
          <LeadStepper status={lead.status} />
          <div className="flex flex-wrap gap-2">
            {next && (
              <Button size="sm" onClick={() => onAction(lead, next)}>
                <next.icon className="size-3.5" /> {next.label}
              </Button>
            )}
            {lead.status === 'CONVERTED' &&
              (lead.accountCreated ? (
                <Badge variant="success">Đã có tài khoản đối tác</Badge>
              ) : (
                <Button size="sm" onClick={() => onCreateAccount(lead)}>
                  <KeyRound className="size-3.5" /> Tạo tài khoản đối tác
                </Button>
              ))}
            {canClose(lead.status) && (
              <Button
                size="sm"
                variant="outline"
                className="text-danger"
                onClick={() => onAction(lead, CLOSE_ACTION)}
              >
                <XCircle className="size-3.5" /> Đóng yêu cầu
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-2">
          <Textarea
            label="Ghi chú nội bộ (đối tác không thấy)"
            name="lead-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Thông tin cần nhớ: người quyết định, ngân sách, lịch hẹn..."
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              isLoading={saveNotes.isPending}
              disabled={notes === (lead.notes ?? '')}
              onClick={() => saveNotes.mutate()}
            >
              <FileText className="size-3.5" /> Lưu ghi chú
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Lịch sử xử lý
          </h3>
          {history.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : history.isError ? (
            <p className="text-xs text-danger">Không tải được lịch sử xử lý.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-line pl-5">
              {(history.data ?? []).map((item) => {
                const title =
                  item.action === 'PARTNER_LEAD_STATUS' && item.to
                    ? `${item.from ? LEAD_STATUS_LABELS[item.from] : ''} → ${LEAD_STATUS_LABELS[item.to]}`
                    : item.action === 'PARTNER_LEAD_ASSESS' && item.tier
                      ? `Xếp hạng phòng gym: ${gymTierLabel(item.tier)}`
                      : (HISTORY_LABELS[item.action] ?? item.action);
                const isClose = item.to === 'CLOSED';
                return (
                  <li key={item.id} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[27px] top-0.5 grid size-3.5 place-items-center rounded-full border bg-surface',
                        isClose ? 'border-danger' : 'border-neon',
                      )}
                    >
                      {item.action === 'PARTNER_LEAD_CREATED' ? (
                        <Circle className="size-1.5 fill-neon text-neon" />
                      ) : null}
                    </span>
                    <p className="text-sm font-semibold text-chalk">{title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                      <Clock3 className="size-3" />
                      {formatDateTime(item.at)} · {item.actorName}
                      {item.emailSent ? ' · đã gửi email' : ''}
                    </p>
                    {item.note && (
                      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-muted">
                        {item.note}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </Dialog>
  );
}
