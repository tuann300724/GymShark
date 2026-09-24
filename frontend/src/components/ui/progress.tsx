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
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-line', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-neon transition-all duration-700 ease-out',
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
