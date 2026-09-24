import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-line text-chalk',
    success: 'bg-neon/10 text-neon border border-neon/25',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    destructive: 'bg-danger/10 text-danger border border-danger/25',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    outline: 'text-chalk border border-line',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
