import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SESSION_STATUS_META, SESSION_TYPE_META } from '@/lib/status';
import type { BadgeVariant } from '@/lib/status';

export function SessionStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = SESSION_STATUS_META[status] || { label: status, variant: 'outline' as BadgeVariant };
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

export function SessionTypeBadge({ type, className }: { type: string; className?: string }) {
  const meta = SESSION_TYPE_META[type] || { label: type, variant: 'outline' as BadgeVariant };
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}
