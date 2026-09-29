'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '@/services/package.service';
import { membershipApi } from '@/services/membership.service';
import { paymentApi } from '@/services/payment.service';
import { memberApi } from '@/services/member.service';
import { promotionApi } from '@/services/promotion.service';
import type { PromotionValidateResult } from '@/services/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  CreditCard,
  CheckCircle2,
  Wallet,
  Banknote,
  Landmark,
  CalendarDays,
  Package,
  ArrowLeft,
  ArrowRight,
  Tag,
  Sparkles,
  Copy,
  Receipt,
  BadgePercent,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

/** Phương thức thanh toán theo spec: CASH / BANK_TRANSFER hỗ trợ ngay; MOMO/VNPAY chờ cổng thanh toán */
const PAYMENT_METHODS = [
  {
    value: 'CASH',
    label: 'Tiền mặt',
    desc: 'Thanh toán tại quầy lễ tân',
    icon: Banknote,
    disabled: false,
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Chuyển khoản',
    desc: 'Ngân hàng / Internet Banking',
    icon: Landmark,
    disabled: false,
  },
  {
    value: 'CREDIT_CARD',
    label: 'Thẻ ngân hàng',
    desc: 'Visa, Mastercard...',
    icon: CreditCard,
    disabled: true,
  },
  { value: 'MOMO', label: 'Ví điện tử', desc: 'MoMo / VNPay', icon: Wallet, disabled: true },
];

export default function RegisterMembershipPage() {
  const params = useParams();
  const packageId = (params?.packageId as string) || '';
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [method, setMethod] = useState('CASH');
  const [promotionCode, setPromotionCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromotionValidateResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [successPayment, setSuccessPayment] = useState<any>(null);
  const [copied, setCopied] = useState('');

  const { data: bankInfo } = useQuery({
    queryKey: ['bank-info'],
    queryFn: paymentApi.getBankInfo,
    staleTime: 10 * 60 * 1000,
  });

  const { data: me } = useQuery({
    queryKey: ['member-me'],
    queryFn: memberApi.getMe,
    retry: 0,
  });

  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ['public-packages'],
    queryFn: packageApi.getPublicPackages,
    retry: 1,
  });

  const selectedPackage = packages?.find((p) => p.id === packageId);

  const registerMutation = useMutation({
    mutationFn: () =>
      membershipApi.register({
        packageId,
        paymentMethod: method,
        promotionCode: promotionCode.trim() || undefined,
        notes: 'Đăng ký từ trang gói tập',
      }),
    onSuccess: (res: any) => {
      toast.success(
        'Đã gửi yêu cầu đăng ký!',
        `Hóa đơn ${res.payment?.code || ''} đang chờ xác nhận thanh toán. Sau khi lễ tân xác nhận, gói sẽ tự động kích hoạt.`,
      );
      queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
      queryClient.invalidateQueries({ queryKey: ['member-notif-badge'] });
      queryClient.invalidateQueries({ queryKey: ['member-payments'] });
      setSuccessPayment(res);
    },
    onError: (err: any) => {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      toast.error(
        status === 409 ? 'Không thể đăng ký lúc này' : 'Đăng ký thất bại',
        Array.isArray(msg) ? msg.join(', ') : msg,
      );
    },
  });

  const memberCode = me?.member?.code || '';

  // ---- Kiểm tra mã khuyến mãi trước khi đăng ký (backend tự tính giá) ----
  const validateMutation = useMutation({
    mutationFn: () => promotionApi.validate(promotionCode.trim(), packageId),
    onSuccess: (res: PromotionValidateResult) => {
      setPromoError('');
      if (res.valid) {
        setPromoResult(res);
        toast.success('Áp dụng mã thành công!', `Giảm ngay ${formatCurrency(res.discount || 0)}.`);
      } else {
        setPromoResult(null);
        setPromoError(res.message || 'Mã khuyến mãi không áp dụng được.');
        toast.error('Không thể áp dụng mã', res.message || 'Mã khuyến mãi không hợp lệ.');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setPromoResult(null);
      setPromoError(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Có lỗi khi kiểm tra mã khuyến mãi.',
      );
    },
  });

  const handleApplyPromo = () => {
    const code = promotionCode.trim();
    if (!code) {
      toast.error('Chưa nhập mã', 'Vui lòng nhập mã khuyến mãi trước khi áp dụng.');
      return;
    }
    validateMutation.mutate();
  };

  if (pkgLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!selectedPackage) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <Package className="mx-auto size-12 text-muted" />
        <h1 className="mt-4 text-xl font-bold text-chalk">Chưa chọn gói tập</h1>
        <p className="mt-2 text-sm text-muted">Hãy chọn một gói tập trước khi đăng ký.</p>
        <Button className="mt-6" onClick={() => router.push('/packages')}>
          Xem gói tập
        </Button>
      </div>
    );
  }

  const pkg = selectedPackage;
  const originalPrice = parseFloat(pkg.price) || 0;
  const finalPrice =
    promoResult?.valid && promoResult.total != null ? Number(promoResult.total) : originalPrice;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/packages"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon transition-colors hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Quay lại danh sách gói
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Đăng ký gói tập
        </h1>
        <p className="mt-1 text-sm text-muted">
          Gửi yêu cầu đăng ký — gói tập sẽ kích hoạt ngay sau khi lễ tân xác nhận thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Package summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-[10px]">
                {pkg.code}
              </Badge>
              <Badge variant="success">Đang bán</Badge>
            </div>
            <CardTitle className="mt-3 text-lg text-chalk">{pkg.name}</CardTitle>
            <CardDescription className="text-xs">
              {pkg.description || 'Gói tập phù hợp cho người mới bắt đầu'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-line bg-ink p-4">
              <span className="font-display text-3xl font-extrabold text-neon">
                {formatCurrency(originalPrice)}
              </span>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" /> {pkg.durationDays} ngày
                </span>
                {pkg.sessions ? <span>{pkg.sessions} buổi</span> : null}
                <span>{pkg.type === 'FIXED_TERM' ? 'Theo thời hạn' : 'Theo buổi'}</span>
              </div>
            </div>
            <ul className="space-y-2">
              {(pkg.features?.items || []).map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-neon" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment form */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-neon" />
                Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => setMethod(m.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                      m.disabled
                        ? 'cursor-not-allowed border-line/60 opacity-45'
                        : method === m.value
                          ? 'border-neon bg-neon/10'
                          : 'border-line hover:border-neon/40'
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                        method === m.value ? 'border-neon/40 bg-neon/10' : 'border-line bg-ink'
                      }`}
                    >
                      <m.icon
                        className={`size-4 ${method === m.value ? 'text-neon' : 'text-muted'}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-chalk">{m.label}</p>
                      <p className="text-[11px] text-muted">{m.desc}</p>
                    </div>
                    {m.disabled ? (
                      <span className="ml-auto shrink-0 rounded-full bg-line/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                        Sắp ra mắt
                      </span>
                    ) : (
                      <CheckCircle2
                        className={`ml-auto size-4 shrink-0 ${
                          method === m.value ? 'text-neon' : 'text-muted/30'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Hướng dẫn chuyển khoản khi chọn BANK_TRANSFER */}
              {method === 'BANK_TRANSFER' && bankInfo && (
                <div className="mt-4 rounded-xl border border-neon/30 bg-neon/5 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neon">
                    <Landmark className="size-4" /> Chuyển khoản đến tài khoản phòng tập
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-chalk">
                    <p>
                      <span className="text-muted">Ngân hàng: </span>
                      {bankInfo.bankName}
                    </p>
                    <p>
                      <span className="text-muted">Số tài khoản: </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(bankInfo.accountNumber);
                          setCopied('account');
                          toast.success('Đã sao chép số tài khoản');
                        }}
                        className="font-mono font-bold text-neon hover:underline"
                      >
                        {bankInfo.accountNumber} <Copy className="inline size-3" />
                      </button>
                      <span className="ml-2">· {bankInfo.accountName}</span>
                    </p>
                    {me && (
                      <div className="mt-2 rounded-lg border border-line bg-ink px-3 py-2">
                        <p className="text-muted">Nội dung chuyển khoản (bắt buộc ghi đúng):</p>
                        <button
                          onClick={() => {
                            const content = `GYM ${memberCode} ${successPayment?.payment?.code || ''}`;
                            navigator.clipboard?.writeText(content.trim());
                            setCopied('content');
                            toast.success('Đã sao chép nội dung chuyển khoản');
                          }}
                          className="mt-1 font-mono font-extrabold text-neon hover:underline"
                        >
                          GYM {memberCode}
                          {successPayment?.payment?.code
                            ? ` ${successPayment.payment.code}`
                            : ' [mã hóa đơn]'}
                          <Copy className="inline size-3" />
                        </button>
                        <p className="mt-1.5 text-[11px] text-muted">
                          Chuyển khoản KHÔNG tự động kích hoạt — lễ tân đối soát sao kê rồi xác
                          nhận, gói tập sẽ kích hoạt ngay sau đó.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="size-4 text-neon" />
                Mã khuyến mãi (tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã giảm giá (ví dụ: GYM10)"
                  value={promotionCode}
                  disabled={validateMutation.isPending}
                  onChange={(e) => {
                    setPromotionCode(e.target.value);
                    setPromoError('');
                    setPromoResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                />
                <Button
                  variant={promoResult?.valid ? 'secondary' : 'primary'}
                  className="shrink-0 px-4"
                  isLoading={validateMutation.isPending}
                  onClick={handleApplyPromo}
                >
                  {promoResult?.valid ? 'Đã áp dụng' : 'Áp dụng'}
                </Button>
              </div>

              {promoError && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-[11px] text-danger">
                  <XCircle className="mt-0.5 size-3.5 shrink-0" /> {promoError}
                </p>
              )}

              {promoResult?.valid && promoResult.promotion && (
                <div className="mt-3 space-y-2 rounded-xl border border-neon/30 bg-neon/5 p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-muted">
                      <BadgePercent className="size-4 shrink-0 text-neon" />
                      <span className="truncate">{promoResult.promotion.name}</span>
                    </span>
                    <span className="shrink-0 font-mono font-bold text-neon">
                      {promoResult.promotion.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line/60 pt-2">
                    <span className="text-muted">Giá gốc</span>
                    <span className="font-semibold text-chalk">
                      {formatCurrency(promoResult.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">
                      Giảm (
                      {promoResult.promotion.discountType === 'PERCENTAGE'
                        ? `-${String(promoResult.promotion.discountValue)}%`
                        : 'cố định'}
                      )
                    </span>
                    <span className="font-semibold text-neon">
                      -{formatCurrency(promoResult.discount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line/60 pt-2">
                    <span className="font-bold text-chalk">Thành tiền</span>
                    <span className="font-display text-lg font-extrabold text-neon">
                      {formatCurrency(promoResult.total || 0)}
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-2 text-[11px] text-muted">
                Hệ thống tự kiểm tra mã (hiệu lực, giới hạn lượt, giá trị đơn tối thiểu) và tính
                chiết khấu ngay tại đây.
              </p>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-xl border border-neon/30 bg-neon/5 p-4">
            <div>
              <p className="text-xs text-muted">Tổng thanh toán (tạm tính)</p>
              <div className="flex items-baseline gap-2">
                {promoResult?.valid && (
                  <span className="text-sm text-muted line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                <p className="font-display text-2xl font-extrabold text-neon">
                  {formatCurrency(finalPrice)}
                </p>
              </div>
              {promoResult?.valid && (
                <p className="text-[11px] font-semibold text-neon">
                  Được giảm {formatCurrency(promoResult.discount || 0)}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-muted">
              <p>Hội viên: quẹt thẻ tại quầy lễ tân</p>
              <p className="mt-0.5">
                Thanh toán: {PAYMENT_METHODS.find((m) => m.value === method)?.label}
              </p>
            </div>
          </div>

          <Button
            className="w-full h-12"
            isLoading={registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
          >
            <Sparkles className="size-4" />
            Gửi yêu cầu đăng ký
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-[11px] text-muted">
            Bằng cách đăng ký, bạn đồng ý với điều khoản dịch vụ của phòng tập.
          </p>
        </div>
      </div>

      {/* Success dialog */}
      <Dialog
        open={!!successPayment}
        onClose={() => router.push('/member/membership')}
        title="Đã gửi yêu cầu đăng ký gói tập! 🎟️"
        className="max-w-md"
      >
        {successPayment && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-neon/30 bg-neon/5 p-4">
              <div>
                <p className="text-xs text-muted">Mã hóa đơn</p>
                <p className="font-mono text-lg font-extrabold text-neon">
                  {successPayment.payment?.code || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Số tiền</p>
                <p className="font-display text-lg font-extrabold text-chalk">
                  {formatCurrency(successPayment.payment?.amount || 0)}
                </p>
              </div>
            </div>

            {method === 'BANK_TRANSFER' && bankInfo && me && (
              <div className="rounded-xl border border-line bg-ink p-4 text-xs">
                <p className="font-semibold text-chalk">💳 Chuyển khoản để kích hoạt gói:</p>
                <p className="mt-2 text-muted">
                  Ngân hàng: <b className="text-chalk">{bankInfo.bankName}</b>
                </p>
                <p className="mt-1 text-muted">
                  Số tài khoản: <b className="font-mono text-neon">{bankInfo.accountNumber}</b> ·{' '}
                  <span className="text-chalk">{bankInfo.accountName}</span>
                </p>
                <div className="mt-2 rounded-lg border border-dashed border-neon/40 bg-surface px-3 py-2">
                  <p className="text-muted">Nội dung chuyển khoản:</p>
                  <button
                    onClick={() => {
                      const content = `GYM ${memberCode} ${successPayment.payment?.code || ''}`;
                      navigator.clipboard?.writeText(content.trim());
                      setCopied('content');
                      toast.success('Đã sao chép nội dung chuyển khoản');
                    }}
                    className="mt-1 font-mono font-extrabold text-neon hover:underline"
                  >
                    GYM {memberCode} {successPayment.payment?.code || ''}{' '}
                    <Copy className="inline size-3" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Ghi đúng nội dung để lễ tân xác nhận nhanh nhất. Gói tập kích hoạt sau khi thanh
                  toán được xác nhận.
                </p>
              </div>
            )}

            {method === 'CASH' && (
              <div className="rounded-xl border border-line bg-ink p-4 text-xs text-muted">
                💵 Mang mã hóa đơn <b className="text-chalk">{successPayment.payment?.code}</b> ra
                quầy lễ tân để thanh toán tiền mặt — gói tập sẽ được kích hoạt ngay sau đó.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/member/payments/${successPayment.payment?.id}`)}
              >
                <Receipt className="size-4" /> Xem hóa đơn
              </Button>
              <Button className="flex-1" onClick={() => router.push('/member/membership')}>
                <ArrowRight className="size-4" /> Đi tới gói tập
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
