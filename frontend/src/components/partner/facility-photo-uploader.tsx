'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { FacilityPhotoArea, FacilityPhotoInput } from '@/services/partner.service';
import { cn } from '@/lib/utils';

export const FACILITY_AREA_LABELS: Record<FacilityPhotoArea, string> = {
  WEIGHTS: 'Khu tạ / máy tập',
  CARDIO: 'Khu cardio',
  LOCKER: 'Phòng thay đồ, vệ sinh',
  RECEPTION: 'Lễ tân / mặt tiền',
  OTHER: 'Khu vực khác',
};

export const MIN_FACILITY_PHOTOS = 3;
const MAX_FACILITY_PHOTOS = 6;
const MAX_SIDE = 1280;
/** Giới hạn ~500KB/ảnh sau nén — khớp MAX_PHOTO_DATA_URL_LENGTH ở backend */
const MAX_DATA_URL = 680_000;

/** Nén ảnh ở trình duyệt: thu nhỏ cạnh dài ≤ 1280px, xuất JPEG giảm dần chất lượng. */
async function compressImage(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không đọc được ảnh'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Ảnh không hợp lệ'));
    el.src = source;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.58, 0.45]) {
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length <= MAX_DATA_URL) return out;
  }
  throw new Error('Ảnh quá lớn, vui lòng chọn ảnh khác');
}

/**
 * Ô tải ảnh cơ sở vật chất cho hướng Gym Cộng đồng: chọn tối đa 6 ảnh,
 * mỗi ảnh gắn khu vực + mô tả ngắn để admin đánh giá hạng phòng.
 */
export function FacilityPhotoUploader({
  value,
  onChange,
  error,
}: {
  value: FacilityPhotoInput[];
  onChange: (next: FacilityPhotoInput[]) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const defaultAreas: FacilityPhotoArea[] = ['RECEPTION', 'WEIGHTS', 'CARDIO', 'LOCKER'];

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLocalError('');
    const room = MAX_FACILITY_PHOTOS - value.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setLocalError(`Chỉ nhận tối đa ${MAX_FACILITY_PHOTOS} ảnh.`);
    setBusy(true);
    const next = [...value];
    for (const file of picked) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        setLocalError('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        next.push({ area: defaultAreas[next.length] ?? 'OTHER', caption: '', dataUrl });
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Không xử lý được ảnh.');
      }
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const update = (index: number, patch: Partial<FacilityPhotoInput>) =>
    onChange(value.map((photo, i) => (i === index ? { ...photo, ...patch } : photo)));

  const remaining = Math.max(0, MIN_FACILITY_PHOTOS - value.length);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Ảnh phòng tập & cơ sở vật chất *
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tối thiểu {MIN_FACILITY_PHOTOS}, tối đa {MAX_FACILITY_PHOTOS} ảnh: mặt tiền/lễ tân, khu
            tạ, cardio, phòng thay đồ. Admin dùng ảnh để xếp hạng phòng (Standard/Plus/Premium).
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-semibold tabular-nums',
            remaining ? 'text-muted' : 'text-neon',
          )}
        >
          {value.length}/{MAX_FACILITY_PHOTOS}
        </span>
      </div>

      {value.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {value.map((photo, index) => (
            <li
              key={photo.dataUrl.slice(-32) + index}
              className="overflow-hidden rounded-xl border border-line bg-ink"
            >
              <div className="relative aspect-video">
                <Image
                  src={photo.dataUrl}
                  alt={`Ảnh cơ sở vật chất ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Xóa ảnh ${index + 1}`}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink/80 text-chalk hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-2 p-2.5">
                <select
                  aria-label={`Khu vực của ảnh ${index + 1}`}
                  value={photo.area}
                  onChange={(event) =>
                    update(index, { area: event.target.value as FacilityPhotoArea })
                  }
                  className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-xs text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
                >
                  {Object.entries(FACILITY_AREA_LABELS).map(([area, label]) => (
                    <option key={area} value={area}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Mô tả ảnh ${index + 1}`}
                  value={photo.caption ?? ''}
                  maxLength={400}
                  onChange={(event) => update(index, { caption: event.target.value })}
                  placeholder="Mô tả ngắn (không bắt buộc)"
                  className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-xs text-chalk placeholder:text-muted/70 focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length < MAX_FACILITY_PHOTOS && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-ink px-4 py-5 text-xs text-muted transition-colors hover:border-neon/50 hover:text-chalk disabled:opacity-60',
            error && !value.length ? 'border-danger' : 'border-line',
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-neon" />
          ) : (
            <ImagePlus className="size-5 text-neon" />
          )}
          {busy
            ? 'Đang nén ảnh...'
            : remaining
              ? `Chọn ảnh (cần thêm ít nhất ${remaining} ảnh)`
              : 'Thêm ảnh khác'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />
      {(localError || error) && (
        <p className="text-xs font-medium text-danger">{localError || error}</p>
      )}
    </div>
  );
}
