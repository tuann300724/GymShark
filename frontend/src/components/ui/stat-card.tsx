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
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'neon',
}: StatCardProps) {
  const colorMap = {
    neon: 'bg-neon/10 text-neon border-neon/25',
    blue: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    rose: 'bg-danger/10 text-danger border-danger/25',
  };

  return (
    <Card className="hover:border-line/80 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold mt-1 text-chalk tracking-tight font-display">
              {value}
            </h4>
            {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
            {trend && (
              <p className="text-xs mt-1.5 flex items-center gap-1 font-medium">
                <span className={trend.isPositive ? 'text-neon' : 'text-danger'}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-muted">so với tháng trước</span>
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl border shrink-0', colorMap[colorScheme])}>
            <Icon className="size-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
