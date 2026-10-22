'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { RefreshCw } from 'lucide-react';
import { paymentApi } from '@/services/payment.service';

interface Props {
  paymentId: string;
  amount: number;
  content: string; // nội dung chuyển khoản (đã chứa GYM + mã HV + mã đơn / tên gói)
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

export function PaymentQrBlock({ paymentId, amount, content, bankName = 'MB Bank', accountName = 'GYM SHARK', accountNumber = '0799951104' }: Props) {
  const toast = useToast();
  const [polling, setPolling] = useState(false);

  const qrUrl = `https://img.vietqr.io/image/MB-0799951104-compact2.svg?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;

  // Tự động poll khi PENDING
  useEffect(() => {
    if (!polling) return;
    const iv = setInterval(() => {
      paymentApi.checkCasso(paymentId)
        .then((res: any) => {
          if (res.matched || res.status === 'PAID') {
            toast.success('CASSO khớp!', 'Thanh toán đã xác nhận — gói sẽ kích hoạt.');
            clearInterval(iv);
            setPolling(false);
          }
        })
        .catch(() => {
          // im lặng
        });
    }, 6000);
    return () => clearInterval(iv);
  }, [polling, paymentId, toast]);

  return (
    <div className="space-y-3 rounded-xl border border-line bg-ink p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-chalk">
        <span className="inline-block size-2 rounded-full bg-neon" />
        Quét QR chuyển khoản
        <span className="ml-auto text-xs text-muted font-normal">{bankName}</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="VietQR" className="h-36 w-auto rounded-xl border border-line shadow-lg" />
        </a>
        <div className="min-w-0 flex-1 space-y-2 text-xs text-muted">
          <p><b className="text-chalk">Nội dung:</b> <span className="font-mono text-chalk">{content}</span></p>
          <p><b className="text-chalk">Số tài khoản:</b> <span className="font-mono text-neon">{accountNumber}</span> · {accountName}</p>
          <p><b className="text-chalk">Số tiền:</b> <span className="font-mono text-chalk">{amount.toLocaleString('vi')}</span> đ</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => setPolling((p) => !p)} className={polling ? 'bg-neon/20 text-neon border-neon' : ''}>
          <RefreshCw className={`size-3 mr-1 ${polling ? 'animate-spin' : ''}`} />
          {polling ? 'Đang tự động kiểm tra...' : 'Kiểm tra CASSO'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(content); toast.success('Đã sao chép nội dung'); }}>
          Sao chép nội dung
        </Button>
      </div>
    </div>
  );
}
