'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '@/services/payment.service';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils';
import { PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/lib/status';
import {
  ArrowLeft,
  Printer,
  Flame,
  Copy,
  Landmark,
  CheckCircle2,
  Hash,
  CreditCard,
  CalendarDays,
  User,
} from 'lucide-react';

export default function MemberPaymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const toast = useToast();

  const {
    data: payment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['member-payment-detail', id],
    queryFn: () => paymentApi.getPaymentDetail(id),
    enabled: !!id,
    retry: 0,
  });

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success('Đã sao chép'));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-danger">Không tìm thấy hóa đơn.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }

  const meta = PAYMENT_STATUS_META[payment.status] || { label: payment.status, variant: 'outline' };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/member/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> In hóa đơn
        </Button>
      </div>

      {/* Receipt */}
      <div
        id="receipt-print"
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
      >
        <div className="border-b border-dashed border-line bg-ink px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border border-neon/25 bg-neon/10 text-neon">
                <Flame className="size-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold uppercase leading-tight text-chalk">
                  GYM<span className="text-neon">MASTER</span> PRO
                </p>
                <p className="text-[11px] text-muted">
                  Hóa đơn thanh toán · LHU Fitness & Gym Center
                </p>
              </div>
            </div>
            <Badge variant={meta.variant as any}>{meta.label}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted">Số hóa đơn</p>
              <p className="font-mono font-bold text-neon">
                {payment.invoice?.invoiceNumber || payment.code}
              </p>
            </div>
            <div>
              <p className="text-muted">Ngày lập</p>
              <p className="font-mono font-semibold text-chalk">
                {formatDateTime(payment.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Khách hàng */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-muted">
                <User className="size-3.5" /> Hội viên
              </p>
              <p className="mt-0.5 text-sm font-semibold text-chalk">{payment.member?.fullName}</p>
              <p className="font-mono text-neon">{payment.member?.code}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-muted">Liên hệ</p>
              <p className="mt-0.5 text-sm text-chalk">{payment.member?.phone}</p>
              <p className="text-chalk">{payment.member?.email || ''}</p>
            </div>
          </div>

          {/* Chi tiết */}
          <div className="mt-5 space-y-3 rounded-xl border border-line bg-ink p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Gói tập</span>
              <span className="font-semibold text-chalk text-right">
                {payment.membership?.package?.name || '--'}
                {payment.membership?.package?.durationDays
                  ? ` (${payment.membership.package.durationDays} ngày)`
                  : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Phương thức thanh toán</span>
              <span className="font-semibold text-chalk">
                {PAYMENT_METHOD_LABEL[payment.method] || payment.method}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Hiệu lực gói tập</span>
              <span className="font-mono text-chalk">
                {payment.membership?.startDate ? formatDate(payment.membership.startDate) : '—'}
                {payment.membership?.endDate ? ` → ${formatDate(payment.membership.endDate)}` : ''}
              </span>
            </div>
            {payment.transactionRef && (
              <div className="flex justify-between">
                <span className="text-muted">Mã giao dịch ngoài</span>
                <button
                  onClick={() => copy(payment.transactionRef!)}
                  className="font-mono font-semibold text-neon hover:underline"
                >
                  {payment.transactionRef} <Copy className="inline size-3" />
                </button>
              </div>
            )}
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted">Ngày thanh toán</span>
                <span className="font-mono text-chalk">{formatDateTime(payment.paidAt)}</span>
              </div>
            )}
            {payment.confirmedBy?.fullName && (
              <div className="flex justify-between">
                <span className="text-muted">Xác nhận bởi</span>
                <span className="text-chalk">{payment.confirmedBy.fullName}</span>
              </div>
            )}
            {payment.promotion && (
              <div className="flex justify-between text-neon">
                <span className="text-muted">Mã khuyến mãi</span>
                <span className="font-semibold">
                  {payment.promotion.code} — {payment.promotion.name}
                </span>
              </div>
            )}
          </div>

          {/* Thành tiền */}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-xs text-muted">
              <span>Tiền gói</span>
              <span className="font-mono">
                {formatCurrency(payment.invoice?.subtotal ?? payment.amount)}
              </span>
            </div>
            {Number(payment.invoice?.discount) > 0 && (
              <div className="flex justify-between text-xs text-neon">
                <span>Giảm giá</span>
                <span className="font-mono">
                  -{formatCurrency(Number(payment.invoice?.discount || 0))}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-dashed border-line pt-2.5">
              <span className="font-semibold text-chalk">Tổng thanh toán</span>
              <span className="font-display text-2xl font-extrabold text-neon">
                {formatCurrency(payment.invoice?.total ?? payment.amount)}
              </span>
            </div>
          </div>

          {/* Bank chưa xác nhận: hướng dẫn chuyển khoản */}
          {payment.method === 'BANK_TRANSFER' &&
            payment.status === 'PENDING' &&
            payment.bankInfo && (
              <div className="mt-5 rounded-xl border border-neon/30 bg-neon/5 p-4 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-neon">
                  <Landmark className="size-4" /> Thanh toán chuyển khoản — chưa xác nhận
                </p>
                <p className="mt-2 text-muted">
                  Ngân hàng: <b className="text-chalk">{payment.bankInfo.bankName}</b>
                </p>
                <p className="mt-1 text-muted">
                  Số tài khoản:{' '}
                  <button
                    onClick={() => copy(payment.bankInfo!.accountNumber)}
                    className="font-mono font-bold text-neon hover:underline"
                  >
                    {payment.bankInfo.accountNumber} <Copy className="inline size-3" />
                  </button>
                  <span className="ml-1 text-chalk">· {payment.bankInfo.accountName}</span>
                </p>
                <div className="mt-2 rounded-lg bg-ink border border-line px-3 py-2">
                  <p className="text-muted mb-1">Nội dung chuyển khoản:</p>
                  <button
                    onClick={() => copy(payment.bankInfo!.transferContent)}
                    className="font-mono font-extrabold text-neon hover:underline"
                  >
                    {payment.bankInfo.transferContent} <Copy className="inline size-3" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Sau khi chuyển, mang sao kê lên quầy hoặc chờ lễ tân đối soát rồi xác nhận. Ghi
                  đúng nội dung để xác nhận nhanh nhất.
                </p>
              </div>
            )}

          {payment.notes && (
            <p className="mt-4 rounded-lg bg-ink border border-line px-3 py-2 text-[11px] text-muted">
              Ghi chú: {payment.notes}
            </p>
          )}

          <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-dashed border-line pt-4 text-[10px] text-muted">
            <Hash className="size-3" /> GymMaster PRO — Biên Hòa, Đồng Nai · Cảm ơn bạn đã đồng hành
            cùng phòng tập!
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print,
          #receipt-print * {
            visibility: visible;
          }
          #receipt-print {
            position: fixed;
            inset: 0;
            margin: 0;
            width: 100%;
            transform: none;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #111 !important;
          }
          #receipt-print * {
            color: #111 !important;
            border-color: rgba(0, 0, 0, 0.2) !important;
            background: #fff !important;
          }
          #receipt-print .text-neon,
          #receipt-print .font-mono.text-neon {
            color: #000 !important;
          }
          #receipt-print .bg-ink {
            background: #fff !important;
          }
          #receipt-print .bg-neon\/5,
          #receipt-print .bg-neon\/10 {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
