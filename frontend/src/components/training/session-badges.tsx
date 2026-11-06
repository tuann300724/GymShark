import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getSessionDisplayStatus, SESSION_TYPE_META } from '@/lib/status';

/**
 * Badge trạng thái buổi tập — tự tính "Đang diễn ra"/"Đã kết thúc"
 * từ startTime/endTime khi status còn là SCHEDULED (buổi đã qua giờ
 * không được hiện "Chờ diễn ra").
 */
export function SessionStatusBadge({
  status,
  startTime,
  endTime,
  className,
}: {
  status: string;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  className?: string;
}) {
  const meta = getSessionDisplayStatus(status, startTime, endTime);
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

export function SessionTypeBadge({ type, className }: { type: string; className?: string }) {
  const meta = SESSION_TYPE_META[type] || { label: type, variant: 'outline' as const };
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}
