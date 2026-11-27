'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, CreditCard, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import {
  PT_SESSION_STATUS_META,
  ptSessionApi,
  type PtSessionCard as PtSessionCardData,
} from '@/services/pt-session.service';

const fmtRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const t = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${t(s)}–${t(e)}`;
};

/**
 * Thẻ "đề nghị buổi tập" trong chat:
 * - Hội viên: Chấp nhận & thanh toán (tạo hoá đơn → trang thanh toán) hoặc Từ chối.
 * - PT: theo dõi trạng thái, huỷ khi hội viên chưa chấp nhận.
 */
export function PtSessionCard({
  session,
  myRole,
}: {
  session: PtSessionCardData;
  myRole: 'TRAINER' | 'MEMBER';
}) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const meta = PT_SESSION_STATUS_META[session.status];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['chat-messages'] });
    qc.invalidateQueries({ queryKey: ['pt-sessions'] });
  };
  const errMsg = (e: any) => {
    const m = e?.response?.data?.message;
    return Array.isArray(m) ? m.join(', ') : m || 'Vui lòng thử lại.';
  };

  const accept = useMutation({
    mutationFn: () => ptSessionApi.accept(session.id, 'BANK_TRANSFER'),
    onSuccess: (res) => {
      toast.success('Đã chấp nhận buổi tập', 'Chuyển tới hoá đơn để thanh toán.');
      refresh();
      router.push(`/member/payments/${res.payment.id}`);
    },
    onError: (e) => toast.error('Không thể chấp nhận', errMsg(e)),
  });
  const decline = useMutation({
    mutationFn: () => ptSessionApi.decline(session.id, reason.trim() || undefined),
    onSuccess: (res) => {
      toast.success(res.message);
      setDeclineOpen(false);
      refresh();
    },
    onError: (e) => toast.error('Không thể từ chối', errMsg(e)),
  });
  const cancel = useMutation({
    mutationFn: () => ptSessionApi.cancel(session.id),
    onSuccess: (res) => {
      toast.success(res.message);
      refresh();
    },
    onError: (e) => toast.error('Không thể huỷ', errMsg(e)),
  });

  return (
    <div className="mb-2 min-w-[240px] overflow-hidden rounded-sm border border-line/60 bg-ink/60">
      <div className="flex items-start gap-2 border-b border-line/40 p-2.5">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-neon" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Đề nghị buổi tập
          </p>
          <p className="font-semibold text-chalk">{session.title}</p>
          <p className="text-xs text-muted">{fmtRange(session.startTime, session.endTime)}</p>
        </div>
      </div>
      <div className="space-y-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold text-neon">
            {formatCurrency(Number(session.price))}
          </span>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        {session.note && <p className="whitespace-pre-wrap text-xs text-muted">{session.note}</p>}
        {session.status === 'DECLINED' && session.declineReason && (
          <p className="text-xs text-muted">Lý do: {session.declineReason}</p>
        )}

        {myRole === 'MEMBER' && session.status === 'OFFERED' && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              isLoading={accept.isPending}
              disabled={decline.isPending}
              onClick={() => accept.mutate()}
            >
              <Check className="size-3.5" /> Chấp nhận & thanh toán
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={accept.isPending}
              onClick={() => {
                setReason('');
                setDeclineOpen(true);
              }}
            >
              <X className="size-3.5" /> Từ chối
            </Button>
          </div>
        )}
        {myRole === 'MEMBER' && session.status === 'AWAITING_PAYMENT' && session.paymentId && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => router.push(`/member/payments/${session.paymentId}`)}
          >
            <CreditCard className="size-3.5" /> Xem hoá đơn & thanh toán
          </Button>
        )}
        {myRole === 'TRAINER' && session.status === 'OFFERED' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            isLoading={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Huỷ đề nghị
          </Button>
        )}
        {session.status === 'AWAITING_PAYMENT' && (
          <p className="text-[11px] text-muted">
            Buổi tập được xếp lịch khi GymMaster xác nhận thanh toán.
          </p>
        )}
      </div>

      <Dialog
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Từ chối buổi tập"
        description="Lý do (không bắt buộc) sẽ được gửi cho huấn luyện viên."
      >
        <div className="space-y-3">
          <Textarea
            id={`pt-decline-${session.id}`}
            label="Lý do"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: Mình bận giờ này, PT gửi giúp khung giờ khác nhé."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Huỷ
            </Button>
            <Button variant="danger" isLoading={decline.isPending} onClick={() => decline.mutate()}>
              Từ chối
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
