'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { membershipApi } from '@/services/membership.service';
import { packageApi } from '@/services/package.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  CreditCard,
  AlertTriangle,
  RefreshCw,
  CalendarDays,
  Wallet,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt', desc: 'Thanh toán tại quầy lễ tân' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', desc: 'Momo / VCB / ACB...' },
  { value: 'MOMO', label: 'Ví MoMo', desc: 'Thanh toán nhanh qua ví điện tử' },
  { value: 'VNPAY', label: 'VNPay', desc: 'Cổng thanh toán VNPay' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng / ghi nợ', desc: 'Visa, Mastercard...' },
];

const EXPIRING_SOON_DAYS = 30;

export default function MemberMembershipPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [renewOpen, setRenewOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const { data: membershipData, isLoading } = useQuery({
    queryKey: ['member-memberships'],
    queryFn: membershipApi.getMyMemberships,
    retry: 0,
  });

  const { data: packages } = useQuery({
    queryKey: ['public-packages'],
    queryFn: packageApi.getPublicPackages,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const current = membershipData?.current;
  const history = membershipData?.history || [];

  const remainingDays = current
    ? Math.max(0, Math.ceil((new Date(current.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  const expiringSoon = !!current && remainingDays <= EXPIRING_SOON_DAYS;

  const progress = current
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((Date.now() - new Date(current.startDate).getTime()) /
              (new Date(current.endDate).getTime() - new Date(current.startDate).getTime())) *
              100,
          ),
        ),
      )
    : 0;

  const renewMutation = useMutation({
    mutationFn: () =>
      membershipApi.renew({ packageId: selectedPackageId || current?.packageId || '', paymentMethod: selectedMethod }),
    onSuccess: (res: any) => {
      toast.success('Gia hạn thành công!', `Gói tập đã được gia hạn thêm ${res.membership?.package?.durationDays || ''} ngày.`);
      setRenewOpen(false);
      queryClient.invalidateQueries({ queryKey: ['member-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gia hạn thất bại';
      toast.error('Gia hạn thất bại', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openRenew = () => {
    setSelectedPackageId(current?.packageId || '');
    setSelectedMethod('CASH');
    setRenewOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-chalk sm:text-3xl">
          Gói tập của tôi
        </h1>
        <p className="mt-1 text-sm text-muted">
          Theo dõi gói tập hiện tại và lịch sử đăng ký của bạn.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : !current ? (
        <Card>
          <CardContent className="p-10 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted" />
            <h2 className="mt-4 text-lg font-bold text-chalk">Bạn chưa có gói tập nào</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của bạn.
            </p>
            <Link href="/packages" className="mt-6 inline-block">
              <Button>
                Chọn gói tập
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Expiring warning */}
          {expiringSoon && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Gói tập của bạn sắp hết hạn.</p>
                <p className="mt-0.5 text-xs">
                  Còn {remainingDays} ngày ({formatDate(current.endDate)}). Gia hạn ngay để tiếp tục tập luyện không gián đoạn.
                </p>
              </div>
            </div>
          )}

          {/* Current membership */}
          <Card className="overflow-hidden border-neon/30">
            <div className="relative p-6 text-chalk sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-neon" />
                    <p className="meta-label">Gói tập hiện tại</p>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold uppercase">
                    {current.package?.name || 'Gói tập'}
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Giá</p>
                      <p className="font-bold text-chalk">{formatCurrency(current.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Bắt đầu</p>
                      <p className="font-bold text-chalk">{formatDate(current.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Hết hạn</p>
                      <p className="font-bold text-chalk">{formatDate(current.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Trạng thái</p>
                      <p className="font-bold text-neon">{current.status}</p>
                    </div>
                  </div>
                </div>
                <Button className="shrink-0" onClick={openRenew}>
                  <RefreshCw className="h-4 w-4" />
                  Gia hạn
                </Button>
              </div>

              <div className="relative mt-6">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted">Thời gian còn lại</span>
                  <span className="font-display font-bold text-neon">{remainingDays} ngày</span>
                </div>
                <Progress value={progress} />
              </div>
            </div>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-neon" />
                Lịch sử gói tập
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Chưa có gói tập nào trong lịch sử.</p>
              ) : (
                <div className="divide-y divide-line">
                  {history.map((m) => (
                    <div key={m.id} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-chalk">
                          {m.package?.name || 'Gói tập'}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDate(m.startDate)} → {formatDate(m.endDate)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-neon">
                        {formatCurrency(m.price)}
                      </p>
                      <Badge
                        variant={
                          m.status === 'ACTIVE'
                            ? 'success'
                            : m.status === 'EXPIRED'
                              ? 'warning'
                              : m.status === 'CANCELLED'
                                ? 'destructive'
                                : 'outline'
                        }
                        className="w-fit shrink-0"
                      >
                        {m.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Renew dialog */}
      <Dialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        title="Gia hạn gói tập"
        description="Chọn gói gia hạn và phương thức thanh toán (demo)."
      >
        <div className="space-y-5">
          {packages && packages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Chọn gói</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {packages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selectedPackageId === p.id
                        ? 'border-neon bg-neon/10'
                        : 'border-line hover:border-neon/40'
                    }`}
                  >
                    <p className="line-clamp-1 text-xs font-semibold text-chalk">{p.name}</p>
                    <p className="mt-1 text-sm font-bold text-neon">
                      {formatCurrency(p.price)}
                    </p>
                    <p className="text-[10px] text-muted">{p.durationDays} ngày</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Wallet className="h-3.5 w-3.5" />
              Phương thức thanh toán
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMethod(m.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    selectedMethod === m.value
                      ? 'border-neon bg-neon/10'
                      : 'border-line hover:border-neon/40'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${selectedMethod === m.value ? 'text-neon' : 'text-muted'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-chalk">{m.label}</p>
                    <p className="text-[11px] text-muted">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setRenewOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              isLoading={renewMutation.isPending}
              disabled={!selectedPackageId}
              onClick={() => renewMutation.mutate()}
            >
              <RefreshCw className="h-4 w-4" />
              Xác nhận gia hạn
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
