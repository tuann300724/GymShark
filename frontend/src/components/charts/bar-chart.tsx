import React from 'react';
import { cn } from '@/lib/utils';

export interface BarDatum {
  label: string;
  value: number;
}

/** Biểu đồ cột dọc đơn giản (dark neon) — không thư viện ngoài */
export function BarChart({
  data,
  height = 180,
  unit = '',
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: height - 24 }}>
        {data.map((d, i) => (
          <div
            key={`${d.label}-${i}`}
            className="group relative flex h-full flex-1 items-end"
            title={`${d.label}: ${d.value.toLocaleString('vi-VN')}${unit}`}
          >
            <div
              className={cn(
                'w-full rounded-t-sm transition-colors',
                d.value > 0 ? 'bg-neon/75 group-hover:bg-neon' : 'bg-line/50',
              )}
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 1.5)}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-neon opacity-0 transition-opacity group-hover:opacity-100">
              {d.value.toLocaleString('vi-VN')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={`${d.label}-${i}`}
            className="flex-1 truncate text-center text-[10px] text-muted"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Thanh ngang: hạng mục + giá trị (phương thức thanh toán, gói tập...) */
export function MethodBars({ data, unit = 'đ' }: { data: BarDatum[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <EmptyChart height={120} />;
  }

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-muted">{d.label}</span>
            <span className="shrink-0 font-semibold text-chalk">
              {d.value.toLocaleString('vi-VN')}
              {unit}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-neon transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ height = 160 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-line text-xs text-muted"
      style={{ height }}
    >
      Chưa có dữ liệu trong khoảng thời gian này
    </div>
  );
}
