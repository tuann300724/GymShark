'use client';

import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Copy, ImageUp, Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { compressImage } from '@/components/partner/facility-photo-uploader';
import { bankNameOf, vietQrUrl } from '@/lib/banks';
import { formatCurrency } from '@/lib/utils';
import { ptSessionApi } from '@/services/pt-session.service';
import { partnerApi } from '@/services/partner.service';
import type { PayoutBank } from '@/services/types';

export interface PayoutTarget {
  kind: 'partner' | 'trainer';
  id: string;
  name: string;
  amount: number;
  bank: PayoutBank | null;
}

/** Nội dung chuyển khoản không dấu, ≤ 50 ký tự (app ngân hàng hay cắt/lỗi tiếng Việt có dấu) */
function transferContent(target: PayoutTarget) {
  const ascii = target.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'D')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase();
  const prefix = target.kind === 'partner' ? 'GYMMASTER HOA HONG' : 'GYMMASTER TRA PT';
  return `${prefix} ${ascii}`.slice(0, 50).trim();
}

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const toast = useToast();
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-sm text-chalk ${mono ? 'font-mono' : 'font-semibold'}`}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            toast.success(`Đã sao chép ${label.toLowerCase()}`);
          }}
          className="shrink-0 rounded-sm p-1 text-muted transition-colors hover:text-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          aria-label={`Sao chép ${label.toLowerCase()}`}
        >
          <Copy className="size-3.5" />
        </button>
      </dd>
    </div>
  );
}

/** Dialog chuyển tiền cho đối tác Gym Cộng đồng / PT: STK, mã QR có sẵn số tiền + nội dung */
export function PayoutDialog({
  target,
  from,
  to,
  onClose,
}: {
  target: PayoutTarget | null;
  /** Khoảng ngày đang lọc — chi hoa hồng đối tác chỉ trong khoảng này */
  from?: string;
  to?: string;
  onClose: () => void;
}) {
  if (!target) return null;
  const bank = target.bank;
  const content = transferContent(target);
  const hasAccount = Boolean(bank?.bankCode && bank?.bankAccountNumber);
  const qrWithAmount = hasAccount
    ? vietQrUrl({
        bankCode: bank!.bankCode!,
        accountNumber: bank!.bankAccountNumber!,
        accountName: bank!.bankAccountName,
        amount: target.amount,
        content,
      })
    : null;
  const who = target.kind === 'partner' ? 'Đối tác' : 'PT';

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Thanh toán cho ${target.name}`}
      description={
        target.kind === 'partner'
          ? 'Hoa hồng lượt tập của hội viên Gym Master tại phòng gym này.'
          : 'Phần tiền buổi PT chưa chi trả cho huấn luyện viên.'
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-line bg-ink p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-muted">Số tiền cần chuyển</p>
          <p className="mt-1 font-display text-3xl font-bold text-neon">
            {formatCurrency(target.amount)}
          </p>
        </div>

        {!hasAccount && !bank?.bankQrImage ? (
          <div className="flex gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <p className="text-chalk">
              {who} chưa cập nhật tài khoản nhận tiền.{' '}
              <span className="text-muted">
                {target.kind === 'partner'
                  ? 'Đối tác cập nhật ở mục Hợp đồng hợp tác trong khu đối tác.'
                  : 'PT cập nhật ở trang Hồ sơ trong khu huấn luyện viên.'}
              </span>
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {qrWithAmount && (
                <figure className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrWithAmount}
                    alt={`Mã VietQR chuyển ${formatCurrency(target.amount)} cho ${target.name}`}
                    className="w-full rounded-xl border border-line"
                  />
                  <figcaption className="text-center text-[11px] text-muted">
                    VietQR đã điền sẵn số tiền + nội dung
                  </figcaption>
                </figure>
              )}
              {bank?.bankQrImage && (
                <figure className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bank.bankQrImage}
                    alt={`Ảnh QR nhận tiền do ${target.name} tải lên`}
                    className="w-full rounded-xl border border-line object-contain"
                  />
                  <figcaption className="text-center text-[11px] text-muted">
                    Ảnh QR {who.toLowerCase()} tải lên — nhập số tiền khi chuyển
                  </figcaption>
                </figure>
              )}
            </div>

            <dl className="divide-y divide-line rounded-xl border border-line px-4">
              {hasAccount && (
                <>
                  <div className="flex items-center justify-between gap-3 py-2">
                    <dt className="text-xs text-muted">Ngân hàng</dt>
                    <dd className="text-sm font-semibold text-chalk">
                      {bank!.bankName || bankNameOf(bank!.bankCode)}
                    </dd>
                  </div>
                  <CopyRow label="Số tài khoản" value={bank!.bankAccountNumber!} />
                  {bank!.bankAccountName && (
                    <CopyRow label="Chủ tài khoản" value={bank!.bankAccountName} mono={false} />
                  )}
                </>
              )}
              <CopyRow label="Số tiền" value={String(Math.round(target.amount))} />
              <CopyRow label="Nội dung" value={content} />
            </dl>
          </>
        )}

        <PayoutConfirm
          key={`${target.kind}-${target.id}`}
          kind={target.kind}
          targetId={target.id}
          amount={target.amount}
          from={from}
          to={to}
          onDone={onClose}
        />
      </div>
    </Dialog>
  );
}

/** Ảnh chụp giao dịch nén cạnh dài ≤ 1080px — đủ đọc mã giao dịch, dưới giới hạn backend */
const PROOF_MAX_SIDE = 1080;

/** Tải ảnh chứng từ chuyển khoản rồi xác nhận đã chi (hoa hồng đối tác / thu nhập PT) */
function PayoutConfirm({
  kind,
  targetId,
  amount,
  from,
  to,
  onDone,
}: {
  kind: PayoutTarget['kind'];
  targetId: string;
  amount: number;
  from?: string;
  to?: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [proof, setProof] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = useMutation({
    mutationFn: (): Promise<{ message: string }> => {
      const extra = { proofImage: proof, note: note.trim() || undefined };
      return kind === 'partner'
        ? partnerApi.adminCreatePayout(targetId, { from, to, ...extra })
        : ptSessionApi.payout(targetId, extra);
    },
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['revenue-breakdown'] });
      onDone();
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Không xác nhận được', Array.isArray(m) ? m.join(', ') : m);
    },
  });

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    setBusy(true);
    try {
      setProof(await compressImage(file, PROOF_MAX_SIDE));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xử lý được ảnh.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (amount <= 0) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-muted">
        <CheckCircle2 className="size-4 text-neon" />
        {kind === 'partner'
          ? 'Đã chi hết hoa hồng trong khoảng này.'
          : 'PT không còn khoản nào chưa chi.'}
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Ảnh chứng từ đã chuyển
      </p>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy || confirm.isPending}
        className="flex min-h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-ink text-sm text-muted transition-colors hover:border-neon/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : proof ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proof} alt="Ảnh chứng từ chuyển khoản" className="max-h-64 object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 p-4">
            <ImageUp className="size-6" />
            Tải ảnh chụp giao dịch chuyển khoản
          </span>
        )}
      </button>
      {proof && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs font-semibold text-chalk hover:text-neon"
        >
          Đổi ảnh khác
        </button>
      )}
      <Input
        id={`${kind}-payout-note`}
        label="Ghi chú (tuỳ chọn)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="VD: mã giao dịch FT2611..."
        maxLength={500}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <Button
        className="w-full"
        disabled={!proof || busy}
        isLoading={confirm.isPending}
        onClick={() => confirm.mutate()}
      >
        {!confirm.isPending && <CheckCircle2 className="size-4" />} Xác nhận đã thanh toán
      </Button>
      <p className="text-center text-[11px] text-muted">
        {kind === 'partner'
          ? `Đánh dấu đã chi mọi lượt có hoa hồng chưa chi${
              from || to ? ' trong khoảng ngày đang lọc' : ''
            }; đối tác nhận thông báo.`
          : 'Đánh dấu đã chi mọi buổi PT đã thanh toán và đã diễn ra của PT này; PT nhận thông báo.'}
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
}
