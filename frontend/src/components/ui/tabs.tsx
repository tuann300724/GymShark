'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/motion';

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
  // layoutId riêng theo từng instance để nhiều thanh tab trên cùng trang không đè nhau
  const layoutId = `gym-tab-${useId().replace(/:/g, '')}`;

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
              'relative flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
              fill && 'min-w-0 flex-1 justify-center whitespace-nowrap',
              active ? 'text-ink' : 'text-muted hover:bg-line/40 hover:text-chalk',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-neon"
                transition={{ type: 'spring', stiffness: 420, damping: 34, ease: EASE }}
                aria-hidden
              />
            )}
            <span className="relative flex items-center gap-1.5">
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
            </span>
          </button>
        );
      })}
    </div>
  );
}
