'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard, Package, Wallet } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import apiClient from '@/lib/axios';
import { formatCurrency, cn } from '@/lib/utils';
import {
  adminMemberApi,
  type RegisterCardPayload,
  type RegisterCardResult,
} from '@/services/admin-member.service';
import type { MembershipPackage } from '@/services/types';

/**
 * MemberPackageDialog — đăng ký gói tập cho hội viên ĐÃ CÓ sẵn tại quầy.
 * Dùng trong bảng /admin/members (nút "Thêm gói") cho hội viên chưa có gói.
 *
 * Khác với MemberCreateDialog (tạo hồ sơ mới + làm thẻ), ở đây chỉ làm bước
 * "chọn gói + thanh toán" — gọi POST /members/:id/memberships.
 */

/** Cổng thanh toán thực tế đang dùng — VNPAY đã bỏ khỏi hệ thống. */
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
  { value: 'MOMO', label: 'MoMo' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Hội viên cần đăng ký gói */
  member: { id: string; code: string; fullName: string } | null;
  /** Gọi sau khi tạo thẻ thành công (để refresh danh sách) */
  onSuccess?: (result: RegisterCardResult) => void;
}

export function MemberPackageDialog({ open, onClose, member, onSuccess }: Props) {
  const toast = useToast();

  const [packageId, setPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [promotionCode, setPromotionCode] = useState('');
  const [payNow, setPayNow] = useState(true);
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const { data: packages = [], isLoading: pkgLoading } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get<MembershipPackage[]>('/membership-packages');
      return res.data;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Reset mỗi lần mở lại
  useEffect(() => {
    if (!open) return;
    setPackageId('');
    setPaymentMethod('CASH');
    setPromotionCode('');
    setPayNow(true);
    setTransactionRef('');
    setNotes('');
  }, [open, member?.id]);

  // Gợi ý gói đầu tiên
  useEffect(() => {
    if (!packageId && packages.length > 0) {
      const firstActive = packages.find((p) => p.status === 'ACTIVE') ?? packages[0];
      setPackageId(firstActive.id);
    }
  }, [packages, packageId]);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  );

  // Ví điện tử không thể thu tiền tại quầy (nhân viên không xác nhận được) → chỉ chờ xác nhận
  const isManualMethod = paymentMethod === 'CASH' || paymentMethod === 'BANK_TRANSFER';
  const payNowBlocked = payNow && !isManualMethod;

  useEffect(() => {
    if (payNowBlocked) setPayNow(false);
  }, [payNowBlocked]);

  const mutation = useMutation({
    mutationFn: async (payload: RegisterCardPayload) =>
      adminMemberApi.registerCard(member!.id, payload),
    onSuccess: (res) => {
      toast.success(
        res.activated ? 'Đã kích hoạt gói tập' : 'Đã tạo gói — chờ thanh toán',
        `Hoá đơn ${res.payment?.code || ''} · ${formatCurrency(String(res.payment?.amount ?? 0))}`,
      );
      onSuccess?.(res);
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      toast.error(
        'Không đăng ký được gói',
        Array.isArray(msg) ? msg.join(' · ') : msg || 'Vui lòng thử lại.',
      );
    },
  });

  const submit = () => {
    if (!member) return;
    if (!packageId) {
      toast.error('Chưa chọn gói tập', 'Vui lòng chọn gói tập cho hội viên.');
      return;
    }
    const payload: RegisterCardPayload = {
      packageId,
      paymentMethod: paymentMethod as RegisterCardPayload['paymentMethod'],
      payNow,
    };
    if (promotionCode.trim()) payload.promotionCode = promotionCode.trim().toUpperCase();
    if (transactionRef.trim()) payload.transactionRef = transactionRef.trim();
    if (notes.trim()) payload.notes = notes.trim();
    mutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đăng ký gói tập tại quầy"
      description={member ? `${member.fullName} (${member.code})` : ''}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <Select
          label="Gói tập *"
          value={packageId}
          options={[
            {
              value: '',
              label: pkgLoading
                ? 'Đang tải gói tập...'
                : packages.length
                  ? '— Chọn gói tập —'
                  : 'Chưa có gói tập nào',
            },
            ...packages
              .filter((p) => p.status === 'ACTIVE')
              .map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.durationDays} ngày · ${formatCurrency(p.price)}`,
              })),
          ]}
          onChange={(e) => setPackageId(e.target.value)}
        />

        {selectedPackage && (
          <div className="rounded-lg border border-line bg-surface px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {selectedPackage.name}
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-neon">
              {formatCurrency(selectedPackage.price)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Thời hạn {selectedPackage.durationDays} ngày
              {selectedPackage.sessions ? ` · ${selectedPackage.sessions} buổi` : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Phương thức thanh toán"
            value={paymentMethod}
            options={PAYMENT_METHODS}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <Input
            label="Mã khuyến mãi (tuỳ chọn)"
            placeholder="GYM10..."
            value={promotionCode}
            onChange={(e) => setPromotionCode(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Thanh toán tại quầy
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPayNow(true)}
              disabled={!isManualMethod}
              className={cn(
                'rounded-[10px] border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                <Wallet className="size-3.5 text-neon" /> Thu tiền ngay
              </span>
              <span className="mt-1 block text-[11px] text-muted">
                Kích hoạt thẻ ngay (ACTIVE) — dành cho Tiền mặt / Chuyển khoản
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPayNow(false)}
              className={cn(
                'rounded-[10px] border p-3 text-left transition-colors',
                !payNow ? 'border-neon/70 bg-neon/10' : 'border-line hover:border-neon/40',
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold text-chalk">
                <CreditCard className="size-3.5 text-neon" /> Chờ xác nhận
              </span>
              <span className="mt-1 block text-[11px] text-muted">
                Thẻ PENDING + hoá đơn chờ thu, xác nhận sau ở Hoá đơn
              </span>
            </button>
          </div>
          {!isManualMethod && (
            <p className="text-[11px] text-muted">
              Ví điện tử không thể thu tiền tại quầy — đã tự chuyển sang chế độ chờ xác nhận.
            </p>
          )}
          {payNow && paymentMethod === 'BANK_TRANSFER' && (
            <Input
              label="Mã giao dịch chuyển khoản (tuỳ chọn)"
              placeholder="FT20261022..."
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />
          )}
          <Input
            label="Ghi chú (tuỳ chọn)"
            placeholder="Ghi chú cho hồ sơ thẻ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button isLoading={mutation.isPending} onClick={submit}>
            <Package className="size-4" /> Đăng ký gói
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
