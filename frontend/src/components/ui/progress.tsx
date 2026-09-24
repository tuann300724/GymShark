import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number; // 0 - 100
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500',
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}