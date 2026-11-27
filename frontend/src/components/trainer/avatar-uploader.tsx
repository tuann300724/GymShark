'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { compressImage } from '@/components/partner/facility-photo-uploader';
import { cn } from '@/lib/utils';

/** Ảnh đại diện nén cạnh dài ≤ 512px (~30–80KB) — khớp MAX_AVATAR_DATA_URL_LENGTH ở backend */
const AVATAR_MAX_SIDE = 512;

/**
 * Ô tải ảnh đại diện: chọn ảnh từ máy, nén ở trình duyệt và trả về data URL.
 * `value` có thể là data URL vừa chọn hoặc link ảnh hiện có.
 */
export function AvatarUploader({
  value,
  onChange,
  name,
  label = 'Ảnh đại diện',
}: {
  value: string;
  onChange: (next: string) => void;
  /** Tên để hiện chữ cái đầu khi chưa có ảnh */
  name?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    setBusy(true);
    try {
      onChange(await compressImage(file, AVATAR_MAX_SIDE));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xử lý được ảnh.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Chọn ảnh đại diện"
          className={cn(
            'relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-ink text-muted transition-colors hover:border-neon/60',
            error ? 'border-danger' : 'border-line',
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Ảnh đại diện đã chọn" className="size-full object-cover" />
          ) : name?.trim() ? (
            <span className="font-display text-2xl font-bold uppercase text-neon">
              {name.trim().charAt(0)}
            </span>
          ) : (
            <Camera className="size-6" />
          )}
        </button>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-xs font-semibold text-chalk transition-colors hover:border-neon/50"
            >
              <Camera className="size-3.5 text-neon" /> {value ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger"
              >
                <Trash2 className="size-3.5" /> Xoá
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted">
            Ảnh chân dung rõ mặt, JPG/PNG/WEBP — tự động thu nhỏ trước khi gửi.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
