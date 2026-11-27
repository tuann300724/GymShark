'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { FileBadge, Loader2, X } from 'lucide-react';
import { compressImage } from '@/components/partner/facility-photo-uploader';
import type { TrainerDocumentInput } from '@/services/trainer.service';
import { cn } from '@/lib/utils';

/** Khớp MIN/MAX_TRAINER_DOCUMENTS ở backend */
export const MIN_CERTIFICATES = 1;
const MAX_CERTIFICATES = 4;

/**
 * Tải ảnh bằng cấp / chứng chỉ cho đơn đăng ký PT: tối đa 4 ảnh, nén ở trình duyệt,
 * mỗi ảnh kèm mô tả ngắn (tên chứng chỉ) để admin xác minh.
 */
export function CertificateUploader({
  value,
  onChange,
  error,
}: {
  value: TrainerDocumentInput[];
  onChange: (next: TrainerDocumentInput[]) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLocalError('');
    const room = MAX_CERTIFICATES - value.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setLocalError(`Chỉ nhận tối đa ${MAX_CERTIFICATES} ảnh.`);
    setBusy(true);
    const next = [...value];
    for (const file of picked) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setLocalError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
        continue;
      }
      try {
        next.push({ dataUrl: await compressImage(file), caption: '' });
      } catch (e) {
        setLocalError(e instanceof Error ? e.message : 'Không xử lý được ảnh.');
      }
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shownError = error || localError;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Ảnh bằng cấp / chứng chỉ * ({value.length}/{MAX_CERTIFICATES})
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((doc, index) => (
          <div key={index} className="min-w-0 space-y-1.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-ink">
              <Image
                src={doc.dataUrl}
                alt={`Ảnh bằng cấp ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-ink/80 text-chalk hover:text-danger"
                aria-label={`Xoá ảnh bằng cấp ${index + 1}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
            <input
              value={doc.caption ?? ''}
              maxLength={400}
              onChange={(e) =>
                onChange(value.map((d, i) => (i === index ? { ...d, caption: e.target.value } : d)))
              }
              placeholder="Tên chứng chỉ"
              aria-label={`Mô tả ảnh bằng cấp ${index + 1}`}
              className="h-8 w-full min-w-0 rounded-md border border-line bg-ink px-2 text-xs text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none"
            />
          </div>
        ))}
        {value.length < MAX_CERTIFICATES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              'flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs text-muted transition-colors hover:border-neon/50 hover:text-chalk',
              shownError ? 'border-danger' : 'border-line',
            )}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <FileBadge className="size-5 text-neon" />
            )}
            {busy ? 'Đang xử lý...' : 'Thêm ảnh'}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => void addFiles(e.target.files)}
      />
      <p className="text-[11px] leading-relaxed text-muted">
        Chụp rõ bằng cấp, chứng chỉ huấn luyện (ISSA, NASM, HLV quốc gia...) hoặc giấy chứng nhận
        thành tích. Ảnh chỉ dùng để quản trị viên thẩm định, không hiển thị công khai.
      </p>
      {shownError && <p className="text-xs font-medium text-danger">{shownError}</p>}
    </div>
  );
}
