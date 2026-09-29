'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Kéo các tab chia đều chiều ngang khung (segmented control) — mặc định tắt */
  fill?: boolean;
}

/** Tabs dạng pill dark — dùng cho các trang báo cáo / quản lý */
export function Tabs({ tabs, value, onChange, className, fill }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface p-1',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
              fill && 'min-w-0 flex-1 justify-center whitespace-nowrap',
              active ? 'bg-neon text-ink' : 'text-muted hover:bg-line/40 hover:text-chalk',
            )}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  active ? 'bg-ink/15 text-ink' : 'bg-line text-muted',
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
