'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark, Loader2, QrCode, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { compressImage } from '@/components/partner/facility-photo-uploader';
import { VN_BANKS, bankNameOf, vietQrUrl } from '@/lib/banks';
import { formatDate } from '@/lib/utils';
import {
  payoutBankApi,
  type PayoutBankInput,
  type PayoutBankOwner,
} from '@/services/payout-bank.service';

/** Ảnh QR nén cạnh dài ≤ 720px — đủ nét để quét, dưới giới hạn 400KB ở backend */
const QR_MAX_SIDE = 720;

const EMPTY: PayoutBankInput = {
  bankCode: '',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
  bankQrImage: '',
};

const COPY: Record<PayoutBankOwner, string> = {
  trainer: 'Gym Master chuyển phần tiền buổi PT của bạn vào tài khoản này.',
  partner: 'Gym Master chuyển hoa hồng lượt tập của hội viên vào tài khoản này.',
};

/** Thẻ cập nhật tài khoản nhận tiền (STK ngân hàng và/hoặc ảnh QR) — dùng cho PT và đối tác */
export function BankAccountCard({
  owner,
  readOnly = false,
}: {
  owner: PayoutBankOwner;
  /** Nhân viên đối tác chỉ xem, chủ tài khoản mới được sửa */
  readOnly?: boolean;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<PayoutBankInput>(EMPTY);
  const [busyImg, setBusyImg] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payout-bank', owner],
    queryFn: () => payoutBankApi.get(owner),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      bankCode: data.bankCode ?? '',
      bankName: data.bankName ?? '',
      bankAccountNumber: data.bankAccountNumber ?? '',
      bankAccountName: data.bankAccountName ?? '',
      bankQrImage: data.bankQrImage ?? '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => payoutBankApi.update(owner, form),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.setQueryData(['payout-bank', owner], res.bank);
    },
    onError: (e: any) => {
      const m = e?.response?.data?.message;
      toast.error('Không lưu được', Array.isArray(m) ? m.join(', ') : m);
    },
  });

  const set = (patch: Partial<PayoutBankInput>) => setForm((f) => ({ ...f, ...patch }));

  const pickQr = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    setBusyImg(true);
    try {
      set({ bankQrImage: await compressImage(file, QR_MAX_SIDE) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xử lý được ảnh.');
    } finally {
      setBusyImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.bankAccountNumber && !form.bankCode) {
      setError('Vui lòng chọn ngân hàng cho số tài khoản.');
      return;
    }
    if (!form.bankAccountNumber && !form.bankQrImage) {
      setError('Nhập số tài khoản hoặc tải ảnh QR nhận tiền.');
      return;
    }
    setError('');
    save.mutate();
  };

  const preview =
    form.bankCode && form.bankAccountNumber
      ? vietQrUrl({
          bankCode: form.bankCode,
          accountNumber: form.bankAccountNumber,
          accountName: form.bankAccountName,
        })
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Landmark className="size-4 text-neon" />
          Tài khoản nhận tiền
        </CardTitle>
        <p className="text-[11px] text-muted">
          {COPY[owner]}
          {data?.bankUpdatedAt && ` Cập nhật lần cuối ${formatDate(data.bankUpdatedAt)}.`}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-[1fr_auto]">
            <fieldset disabled={readOnly || save.isPending} className="grid gap-3 sm:grid-cols-2">
              <Select
                id={`${owner}-bank-code`}
                label="Ngân hàng"
                value={form.bankCode}
                onChange={(e) =>
                  set({ bankCode: e.target.value, bankName: bankNameOf(e.target.value) })
                }
                options={[
                  { value: '', label: 'Chọn ngân hàng' },
                  ...VN_BANKS.map((b) => ({ value: b.code, label: `${b.name} (${b.code})` })),
                ]}
              />
              <Input
                id={`${owner}-bank-number`}
                label="Số tài khoản"
                inputMode="numeric"
                autoComplete="off"
                value={form.bankAccountNumber}
                onChange={(e) => set({ bankAccountNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="VD: 0123456789"
                maxLength={30}
              />
              <div className="sm:col-span-2">
                <Input
                  id={`${owner}-bank-holder`}
                  label="Tên chủ tài khoản"
                  value={form.bankAccountName}
                  onChange={(e) => set({ bankAccountName: e.target.value.toUpperCase() })}
                  placeholder="VD: NGUYEN VAN A"
                  maxLength={200}
                />
              </div>
              {error && <p className="text-xs font-medium text-danger sm:col-span-2">{error}</p>}
              {!readOnly && (
                <div className="sm:col-span-2">
                  <Button type="submit" size="sm" isLoading={save.isPending}>
                    Lưu tài khoản
                  </Button>
                </div>
              )}
            </fieldset>

            {/* Ảnh QR: tải ảnh QR của ngân hàng, hoặc xem QR tự sinh từ STK */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Mã QR</p>
              <div className="flex size-40 items-center justify-center overflow-hidden rounded-xl border border-line bg-ink">
                {busyImg ? (
                  <Loader2 className="size-5 animate-spin text-muted" />
                ) : form.bankQrImage || preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.bankQrImage || preview!}
                    alt="Mã QR nhận tiền"
                    className="size-full object-contain"
                  />
                ) : (
                  <QrCode className="size-8 text-muted" />
                )}
              </div>
              {!readOnly && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={busyImg}
                  >
                    <Upload className="size-3.5" /> {form.bankQrImage ? 'Đổi ảnh' : 'Tải ảnh QR'}
                  </Button>
                  {form.bankQrImage && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => set({ bankQrImage: '' })}
                      aria-label="Xoá ảnh QR"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
              <p className="max-w-40 text-[11px] text-muted">
                {form.bankQrImage
                  ? 'Ảnh QR bạn tải lên.'
                  : preview
                    ? 'QR tự sinh từ số tài khoản.'
                    : 'Chưa có mã QR.'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => void pickQr(e.target.files?.[0])}
              />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
