import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'neon' | 'blue' | 'amber' | 'purple' | 'rose';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'neon',
  className,
}: StatCardProps) {
  const colorMap = {
    neon: 'bg-neon/10 text-neon border-neon/25',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    rose: 'bg-danger/10 text-danger border-danger/25',
  };

  return (
    <Card className={cn('transition-colors hover:border-neon/30 h-full', className)}>
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-xs font-semibold text-muted uppercase tracking-wider truncate"
              title={title}
            >
              {title}
            </p>
            <div className={cn('p-2 rounded-lg border shrink-0', colorMap[colorScheme])}>
              <Icon className="size-4 sm:size-5" />
            </div>
          </div>
          <h4 className="text-xl sm:text-2xl font-bold mt-1 text-chalk tracking-tight font-display truncate">
            {value}
          </h4>
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 min-w-0">
            {subtitle && (
              <p className="text-xs text-muted truncate" title={subtitle}>
                {subtitle}
              </p>
            )}
            {trend && (
              <p className="text-xs mt-1 flex items-center gap-1 font-medium">
                <span className={trend.isPositive ? 'text-neon' : 'text-danger'}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-muted">so với tháng trước</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
