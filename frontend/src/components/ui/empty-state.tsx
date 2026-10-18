import React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon minh hoạ (mặc định Inbox) */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Nút hành động tuỳ chọn (vd `<Button>`) */
  action?: React.ReactNode;
  className?: string;
}

/** Trạng thái rỗng thống nhất — thay cho các đoạn "Chưa có ..." rải rác trong trang. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl border border-line bg-ink text-muted">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-display text-lg font-bold uppercase tracking-wide text-chalk">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
