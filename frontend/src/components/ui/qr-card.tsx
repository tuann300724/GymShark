'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Cấu hình màu QR — module đậm trên nền sáng để mọi máy quét đọc được (kể cả khi invert) */
const QR_COLOR = { dark: '#0B0D0F', light: '#FFFFFF' };
const QR_BASE = {
  margin: 1,
  errorCorrectionLevel: 'M' as const,
  color: QR_COLOR,
};

export interface QrCardProps {
  /** Chuỗi mã QR do backend cấp (đã ký HMAC) */
  token: string;
  /** Dùng làm tên tệp khi tải ảnh */
  downloadName?: string;
  className?: string;
}

/**
 * Mã QR hội viên — hiển thị SVG sinh ngay trên trình duyệt bằng gói `qrcode`.
 *
 * Không dùng API ngoài nên chạy được offline, và không gửi token ra bất kỳ đâu.
 * Nền luôn là trắng + module đen (đúng chuẩn ISO/IEC 18004): quét ngược (inverted)
 * nhiều máy vẫn đọc được, nhưng quét đúng thì chắc chắn hơn — nên không tô neon.
 */
export function QrCard({ token, downloadName = 'the-qr-hoi-vien', className }: QrCardProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(null);

    QRCode.toString(token, { ...QR_BASE, type: 'svg' as const })
      .then((result) => {
        if (!cancelled) setSvg(result);
      })
      .catch(() => {
        if (!cancelled) setError('Không sinh được mã QR. Vui lòng tải lại trang.');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const downloadPng = async () => {
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(token, {
        ...QR_BASE,
        type: 'image/png' as const,
        width: 1024,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${downloadName}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setError('Không tải được ảnh QR. Thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className="flex aspect-square w-full max-w-[280px] items-center justify-center rounded-xl bg-white p-3"
        aria-label="Mã QR hội viên"
      >
        {svg ? (
          <div
            className="size-full [&_svg]:block [&_svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <span className="flex items-center gap-2 p-4 text-center text-xs text-ink/70">
            <AlertCircle className="size-4 shrink-0 text-danger" />
            {error}
          </span>
        ) : (
          <Skeleton className="size-full rounded-none bg-ink/10" />
        )}
      </div>

      <button
        type="button"
        onClick={downloadPng}
        disabled={!svg || downloading}
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-neon/40 hover:text-chalk disabled:opacity-50"
      >
        <Download className="size-3.5" />
        Tải ảnh QR (PNG)
      </button>
    </div>
  );
}
