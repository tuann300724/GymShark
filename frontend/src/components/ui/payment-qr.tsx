'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Maximize2, Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { paymentApi } from '@/services/payment.service';

/** Chu kỳ tự kiểm tra giao dịch (CASSO đối soát qua Google Sheet) */
const AUTO_CHECK_MS = 5_000;
/** Ngừng tự kiểm tra sau 15 phút để không gọi mãi khi người dùng bỏ quên tab */
const AUTO_CHECK_MAX_MS = 15 * 60_000;

interface Props {
  paymentId: string;
  amount: number;
  content: string; // nội dung chuyển khoản (đã chứa GYM + mã HV + mã đơn / tên gói)
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  /** Gọi khi giao dịch đã khớp → trang cha tải lại trạng thái hoá đơn */
  onPaid?: () => void;
}

export function PaymentQrBlock({
  paymentId,
  amount,
  content,
  bankName = 'MB Bank',
  accountName = 'GYM SHARK',
  accountNumber = '0799951104',
  onPaid,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auto, setAuto] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const startedAt = useRef(Date.now());
  const doneRef = useRef(false);

  const qrParams = `amount=${Math.round(amount)}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;
  const qrBase = `https://img.vietqr.io/image/MB-${accountNumber}-compact2`;
  const qrSvg = `${qrBase}.svg?${qrParams}`;
  const qrPng = `${qrBase}.png?${qrParams}`;

  const handlePaid = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setAuto(false);
    toast.success('Đã nhận được thanh toán ✅', 'Giao dịch đã được xác nhận tự động.');
    // Làm mới mọi màn liên quan (chi tiết hoá đơn, danh sách, buổi PT trong chat...)
    queryClient.invalidateQueries();
    onPaid?.();
  }, [onPaid, queryClient, toast]);

  /** auto = true: kiểm tra nền (không báo lỗi); false: người dùng bấm nút */
  const check = useCallback(
    async (isAuto: boolean) => {
      if (doneRef.current) return;
      if (!isAuto) setChecking(true);
      try {
        const res = await paymentApi.checkCasso(paymentId, isAuto);
        setLastCheckedAt(new Date());
        if (res.matched || res.status === 'PAID') handlePaid();
        else if (!isAuto)
          toast.toast({
            type: 'info',
            title: 'Chưa thấy giao dịch',
            description:
              res.message || 'Nếu bạn vừa chuyển khoản, hệ thống sẽ tự kiểm tra lại sau ít giây.',
          });
      } catch (e: any) {
        const status = e?.response?.status;
        // Lỗi nghiệp vụ (giao dịch tại quầy, sai phương thức...) → ngừng tự kiểm tra
        if (status === 400 || status === 403 || status === 404 || status === 409) setAuto(false);
        if (!isAuto) {
          const m = e?.response?.data?.message;
          toast.error('Không kiểm tra được giao dịch', Array.isArray(m) ? m.join(', ') : m);
        }
      } finally {
        if (!isAuto) setChecking(false);
      }
    },
    [handlePaid, paymentId, toast],
  );

  // Tự kiểm tra 5 giây/lần khi tab đang hiển thị
  useEffect(() => {
    if (!auto) return;
    startedAt.current = Date.now();
    const iv = setInterval(() => {
      if (Date.now() - startedAt.current > AUTO_CHECK_MAX_MS) {
        setAuto(false);
        return;
      }
      if (document.visibilityState === 'visible') void check(true);
    }, AUTO_CHECK_MS);
    return () => clearInterval(iv);
  }, [auto, check]);

  const download = async () => {
    setDownloading(true);
    try {
      // Qua route cùng origin /qr-download (img.vietqr.io không cho tải trực tiếp do CORS)
      const fileName = `QR-thanh-toan-${content.split(' ').pop() || paymentId}`;
      const res = await fetch(
        `/qr-download?${new URLSearchParams({
          bank: 'MB',
          account: accountNumber,
          amount: String(Math.round(amount)),
          addInfo: content,
          accountName,
          fileName,
        })}`,
      );
      if (!res.ok) throw new Error('fetch failed');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Trình duyệt chặn tải trực tiếp → mở ảnh ở tab mới để lưu thủ công
      window.open(qrPng, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard?.writeText(content);
    toast.success('Đã sao chép nội dung');
  };

  return (
    <div className="space-y-3 rounded-xl border border-line bg-ink p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-chalk">
        <span className="inline-block size-2 rounded-full bg-neon" />
        Quét QR chuyển khoản
        <span className="ml-auto text-xs font-normal text-muted">{bankName}</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="group relative shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
          aria-label="Phóng to mã QR"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSvg}
            alt="Mã VietQR chuyển khoản"
            className="h-36 w-auto rounded-xl border border-line shadow-lg"
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="size-6 text-chalk" />
          </span>
        </button>
        <div className="min-w-0 flex-1 space-y-2 text-xs text-muted">
          <p>
            <b className="text-chalk">Nội dung:</b>{' '}
            <span className="font-mono text-chalk">{content}</span>
          </p>
          <p>
            <b className="text-chalk">Số tài khoản:</b>{' '}
            <span className="font-mono text-neon">{accountNumber}</span> · {accountName}
          </p>
          <p>
            <b className="text-chalk">Số tiền:</b>{' '}
            <span className="font-mono text-chalk">{amount.toLocaleString('vi')}</span> đ
          </p>
          <p className="text-[11px]">Bấm vào mã QR để phóng to hoặc tải về.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" isLoading={checking} onClick={() => void check(false)}>
          {!checking && <RefreshCw className="size-3.5" />} Kiểm tra giao dịch
        </Button>
        <Button size="sm" variant="outline" onClick={copyContent}>
          <Copy className="size-3.5" /> Sao chép nội dung
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        {auto ? (
          <>
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-neon/60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-neon" />
            </span>
            Đang tự động kiểm tra giao dịch mỗi 5 giây
          </>
        ) : (
          <span>Đã tạm dừng tự động kiểm tra</span>
        )}
        {lastCheckedAt && <span>· lần gần nhất {lastCheckedAt.toLocaleTimeString('vi-VN')}</span>}
        {!doneRef.current && (
          <button
            type="button"
            onClick={() => setAuto((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 font-semibold text-chalk hover:text-neon"
          >
            {auto ? <Pause className="size-3" /> : <Play className="size-3" />}
            {auto ? 'Tạm dừng' : 'Tự động kiểm tra lại'}
          </button>
        )}
      </div>

      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        title="Quét mã QR để chuyển khoản"
        description={`${amount.toLocaleString('vi')} đ · ${content}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-line p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSvg}
              alt="Mã VietQR chuyển khoản (phóng to)"
              className="mx-auto w-full max-w-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" isLoading={downloading} onClick={download}>
              {!downloading && <Download className="size-4" />} Tải mã QR
            </Button>
            <Button className="flex-1" variant="outline" onClick={copyContent}>
              <Copy className="size-4" /> Sao chép nội dung
            </Button>
          </div>
          <p className="text-center text-xs text-muted">
            Mở app ngân hàng → Quét QR, hoặc tải ảnh về rồi chọn “Quét từ ảnh”. Nội dung chuyển
            khoản phải giữ nguyên để hệ thống tự xác nhận.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
