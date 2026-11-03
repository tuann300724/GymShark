'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ArrowRightLeft, Clock3, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import apiClient from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { paymentApi } from '@/services/payment.service';
import {
  adminMemberApi,
  type ChangePackagePayload,
  type ChangePackageResult,
} from '@/services/admin-member.service';
import type { MembershipPackage } from '@/services/types';

interface CurrentMembership {
  id: string;
  packageId: string;
  startDate: string;
  endDate: string;
  price: string | number;
  finalAmount?: string | number | null;
  package?: { name: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberCode: string;
  currentMembership: CurrentMembership;
  onSuccess: (result: ChangePackageResult) => void;
}

const DAY_MS = 86400000;

export function MemberChangePackageDialog({
  open,
  onClose,
  memberId,
  memberCode,
  currentMembership,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [newPackageId, setNewPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [changeResult, setChangeResult] = useState<ChangePackageResult | null>(null);

  const {
    data: packages = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['membership-packages'],
    queryFn: async () => {
      const res = await apiClient.get<MembershipPackage[]>('/membership-packages');
      return res.data.filter((pkg) => pkg.status === 'ACTIVE');
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!open) return;
    setNewPackageId('');
    setPaymentMethod('CASH');
    setChangeResult(null);
  }, [open, currentMembership.id]);

  const {
    data: bankInfo,
    isLoading: bankInfoLoading,
    isError: bankInfoError,
  } = useQuery({
    queryKey: ['bank-info'],
    queryFn: paymentApi.getBankInfo,
    enabled: open && changeResult?.payment?.method === 'BANK_TRANSFER',
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: checkedPayment,
    isError: cassoError,
    isFetching: cassoChecking,
    refetch: checkCasso,
  } = useQuery({
    queryKey: ['change-package-payment', changeResult?.payment?.id],
    queryFn: async () => {
      await paymentApi.checkCasso(changeResult!.payment!.id);
      return paymentApi.getPayment(changeResult!.payment!.id);
    },
    enabled: open && !changeResult?.activated && changeResult?.payment?.method === 'BANK_TRANSFER',
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
    refetchIntervalInBackground: true,
    retry: 1,
  });

  const transferContent = changeResult?.payment && `GYM ${memberCode} ${changeResult.payment.code}`;
  const qrUrl =
    bankInfo && changeResult?.payment && transferContent
      ? `https://img.vietqr.io/image/${encodeURIComponent(bankInfo.shortName)}-${encodeURIComponent(bankInfo.accountNumber)}-qr_only.svg?amount=${Math.round(Number(changeResult.payment.amount))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`
      : null;

  useEffect(() => {
    if (checkedPayment?.status !== 'PAID' || !changeResult || changeResult.activated) return;
    const settled: ChangePackageResult = {
      ...changeResult,
      activated: true,
      membership: { ...changeResult.membership, status: 'ACTIVE' },
      payment: changeResult.payment ? { ...changeResult.payment, status: 'PAID' } : null,
    };
    setChangeResult(settled);
    onSuccess(settled);
    toast.success(
      'Đã nhận thanh toán',
      'Gói mới đã được kích hoạt. Hệ thống gửi hóa đơn đến email hội viên.',
    );
  }, [checkedPayment?.status, changeResult, onSuccess, toast]);

  useEffect(() => {
    if (!newPackageId && packages.length > 0) {
      const firstDifferentPackage = packages.find((pkg) => pkg.id !== currentMembership.packageId);
      if (firstDifferentPackage) setNewPackageId(firstDifferentPackage.id);
    }
  }, [currentMembership.packageId, newPackageId, packages]);

  const selectedPackage = packages.find((pkg) => pkg.id === newPackageId);
  const quote = useMemo(() => {
    if (!selectedPackage) return null;
    const now = Date.now();
    const totalDays = Math.max(
      1,
      Math.ceil(
        (new Date(currentMembership.endDate).getTime() -
          new Date(currentMembership.startDate).getTime()) /
          DAY_MS,
      ),
    );
    const remainingDays = Math.max(
      0,
      Math.min(
        totalDays,
        Math.ceil((new Date(currentMembership.endDate).getTime() - now) / DAY_MS),
      ),
    );
    const creditAmount =
      Math.round(
        (Number(currentMembership.finalAmount ?? currentMembership.price) * remainingDays * 100) /
          totalDays,
      ) / 100;
    const packagePrice = Number(selectedPackage.price);
    return {
      remainingDays,
      creditAmount,
      priceToPay: Math.round(Math.max(0, packagePrice - creditAmount) * 100) / 100,
      refundAmount: Math.round(Math.max(0, creditAmount - packagePrice) * 100) / 100,
    };
  }, [currentMembership, selectedPackage]);

  const mutation = useMutation({
    mutationFn: (payload: ChangePackagePayload) => adminMemberApi.changePackage(memberId, payload),
    onSuccess: (result) => {
      setChangeResult(result);
      onSuccess(result);
      if (result.activated) {
        toast.success(
          'Đã đổi gói tập',
          [
            result.refundAmount > 0
              ? `Đã kích hoạt gói mới. Nhân viên cần hoàn thủ công ${formatCurrency(String(result.refundAmount))}.`
              : 'Gói mới đã được kích hoạt.',
            result.invoiceEmailSent === false
              ? 'Chưa gửi được hóa đơn email; kiểm tra cấu hình SMTP.'
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        );
        onClose();
      } else if (result.payment?.method === 'BANK_TRANSFER') {
        toast.success(
          'Đã tạo thanh toán QR',
          `Quét mã hoặc chuyển khoản ${formatCurrency(String(result.priceToPay))}. CASSO sẽ tự đối soát khi tiền vào.`,
        );
      } else {
        toast.success(
          'Đã tạo yêu cầu đổi gói',
          `Hóa đơn ${result.payment?.code} · ${formatCurrency(String(result.priceToPay))}. Gói hiện tại vẫn hiệu lực đến khi xác nhận thanh toán.`,
        );
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Không thể đổi gói. Vui lòng thử lại.';
      toast.error('Đổi gói thất bại', Array.isArray(message) ? message.join(' · ') : message);
    },
  });

  const submit = () => {
    if (!newPackageId) {
      toast.error('Chưa chọn gói mới', 'Vui lòng chọn gói tập muốn chuyển sang.');
      return;
    }
    mutation.mutate({ newPackageId, paymentMethod });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Đổi gói tập"
      description="Giá trị những ngày chưa sử dụng sẽ được khấu trừ vào gói mới."
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/60 p-3">
          <ArrowRightLeft className="size-5 shrink-0 text-neon" />
          <div className="min-w-0">
            <p className="text-xs text-muted">Gói hiện tại</p>
            <p className="truncate text-sm font-semibold text-chalk">
              {currentMembership.package?.name || 'Gói tập hiện tại'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted">
            <Spinner /> Đang tải danh sách gói...
          </div>
        ) : isError ? (
          <p className="text-sm text-danger">
            Không tải được danh sách gói tập. Vui lòng đóng và thử lại.
          </p>
        ) : (
          <>
            <Select
              label="Chọn gói mới"
              value={newPackageId}
              disabled={!!changeResult?.payment}
              onChange={(event) => setNewPackageId(event.target.value)}
              options={[
                { value: '', label: 'Chọn gói tập' },
                ...packages
                  .filter((pkg) => pkg.id !== currentMembership.packageId)
                  .map((pkg) => ({
                    value: pkg.id,
                    label: `${pkg.name} · ${formatCurrency(pkg.price)} · ${pkg.durationDays} ngày`,
                  })),
              ]}
            />

            {packages.every((pkg) => pkg.id === currentMembership.packageId) && (
              <p className="text-sm text-muted">Hiện không có gói khác đang được mở bán.</p>
            )}

            {quote && (
              <div className="space-y-2 rounded-xl border border-line bg-ink/60 p-4 text-sm">
                <p className="flex items-center justify-between gap-3 text-muted">
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4" /> Ngày còn lại
                  </span>
                  <span className="font-semibold text-chalk">{quote.remainingDays} ngày</span>
                </p>
                <p className="flex items-center justify-between gap-3 text-muted">
                  <span className="flex items-center gap-2">
                    <Wallet className="size-4" /> Giá trị được khấu trừ
                  </span>
                  <span className="font-semibold text-chalk">
                    {formatCurrency(String(quote.creditAmount))}
                  </span>
                </p>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                  <span className="font-semibold text-chalk">Cần thanh toán</span>
                  <span className="font-bold text-neon">
                    {formatCurrency(String(quote.priceToPay))}
                  </span>
                </div>
                {quote.refundAmount > 0 && (
                  <p className="text-xs leading-relaxed text-muted">
                    Gói mới có giá thấp hơn giá trị còn lại. Nhân viên cần hoàn thủ công{' '}
                    <strong className="text-chalk">
                      {formatCurrency(String(quote.refundAmount))}
                    </strong>
                    .
                  </p>
                )}
              </div>
            )}

            {quote && quote.priceToPay > 0 && (
              <>
                <Select
                  label="Phương thức thanh toán"
                  value={paymentMethod}
                  disabled={!!changeResult?.payment}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as 'CASH' | 'BANK_TRANSFER')
                  }
                  options={[
                    { value: 'CASH', label: 'Tiền mặt' },
                    { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
                  ]}
                />
                <p className="text-xs leading-relaxed text-muted">
                  Gói hiện tại tiếp tục có hiệu lực. Gói mới bắt đầu sau khi nhân viên xác nhận hóa
                  đơn thanh toán.
                </p>
              </>
            )}
          </>
        )}

        {changeResult?.payment?.method === 'BANK_TRANSFER' && (
          <div className="space-y-3 rounded-xl border border-line bg-ink/60 p-4">
            <div>
              <p className="text-sm font-semibold text-chalk">Thanh toán QR qua CASSO</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Nội dung chuyển khoản phải đúng để CASSO tự xác nhận: {transferContent}
              </p>
            </div>
            {bankInfoLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Spinner /> Đang tải thông tin ngân hàng...
              </div>
            ) : bankInfoError ? (
              <p className="text-sm text-danger">Không tải được thông tin ngân hàng.</p>
            ) : qrUrl ? (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-chalk p-3">
                <Image
                  src={qrUrl}
                  alt="Mã QR thanh toán nâng cấp gói"
                  width={220}
                  height={220}
                  unoptimized
                />
                <p className="text-center text-xs text-ink">
                  {bankInfo?.bankName} · {bankInfo?.accountNumber}
                  <br />
                  {bankInfo?.accountName}
                </p>
              </div>
            ) : null}
            <p className="text-xs text-muted">
              {cassoChecking
                ? 'Đang kiểm tra giao dịch trên CASSO...'
                : checkedPayment?.status === 'PAID'
                  ? 'Đã nhận tiền và kích hoạt gói mới.'
                  : 'Hệ thống tự kiểm tra thanh toán. Vui lòng giữ nguyên nội dung chuyển khoản.'}
            </p>
            {cassoError && (
              <p className="text-xs text-danger">
                Chưa đối soát được giao dịch. Bạn có thể kiểm tra lại sau khi chuyển khoản.
              </p>
            )}
            {changeResult.activated && (
              <p className="text-sm font-semibold text-neon">
                Đã thanh toán thành công. Hóa đơn đã được gửi về email hội viên.
              </p>
            )}
            {!changeResult.activated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={cassoChecking}
                onClick={() => void checkCasso()}
              >
                Kiểm tra thanh toán
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {changeResult?.payment ? 'Đóng' : 'Hủy'}
          </Button>
          <Button
            onClick={submit}
            isLoading={mutation.isPending}
            disabled={isLoading || isError || !selectedPackage || !!changeResult?.payment}
          >
            Xác nhận đổi gói
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
