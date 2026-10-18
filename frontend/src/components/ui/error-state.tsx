import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Hiện nút "Thử lại" khi truyền callback */
  onRetry?: () => void;
  className?: string;
}

/** Trạng thái lỗi thống nhất cho các khối tải dữ liệu (query thất bại). */
export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <p className="font-display text-lg font-bold uppercase tracking-wide text-chalk">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-1" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
