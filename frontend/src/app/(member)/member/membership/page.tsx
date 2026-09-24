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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Gói tập của tôi
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
            <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Bạn chưa có gói tập nào</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của bạn.
            </p>
            <Link href="/packages" className="mt-6 inline-block">
              <Button>
                Chọn gói tập
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Expiring warning */}
          {expiringSoon && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Gói tập của bạn sắp hết hạn.</p>
                <p className="text-xs mt-0.5">
                  Còn {remainingDays} ngày ({formatDate(current.endDate)}). Gia hạn ngay để tiếp tục tập luyện không gián đoạn.
                </p>
              </div>
            </div>
          )}

          {/* Current membership */}
          <Card className="overflow-hidden border-0">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="absolute -top-12 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 opacity-80" />
                    <p className="text-xs uppercase tracking-widest opacity-80 font-bold">Gói tập hiện tại</p>
                  </div>
                  <h2 className="mt-2 text-2xl font-black">{current.package?.name || 'Gói tập'}</h2>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Giá</p>
                      <p className="font-bold">{formatCurrency(current.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Bắt đầu</p>
                      <p className="font-bold">{formatDate(current.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Hết hạn</p>
                      <p className="font-bold">{formatDate(current.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-80">Trạng thái</p>
                      <p className="font-bold text-emerald-200">{current.status}</p>
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl shrink-0"
                  onClick={openRenew}
                >
                  <RefreshCw className="w-4 h-4" />
                  Gia hạn
                </Button>
              </div>

              <div className="relative mt-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="opacity-80 font-semibold">Thời gian còn lại</span>
                  <span className="font-black">{remainingDays} ngày</span>
                </div>
                <Progress value={progress} className="bg-white/25" barClassName="bg-white" />
              </div>
            </div>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Lịch sử gói tập
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Chưa có gói tập nào trong lịch sử.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((m) => (
                    <div key={m.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {m.package?.name || 'Gói tập'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDate(m.startDate)} → {formatDate(m.endDate)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
                        className="shrink-0 w-fit"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Chọn gói</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {packages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      selectedPackageId === p.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{p.name}</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatCurrency(p.price)}
                    </p>
                    <p className="text-[10px] text-slate-500">{p.durationDays} ngày</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Phương thức thanh toán
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMethod(m.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    selectedMethod === m.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${selectedMethod === m.value ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.label}</p>
                    <p className="text-[11px] text-slate-500">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setRenewOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              isLoading={renewMutation.isPending}
              disabled={!selectedPackageId}
              onClick={() => renewMutation.mutate()}
            >
              <RefreshCw className="w-4 h-4" />
              Xác nhận gia hạn
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}