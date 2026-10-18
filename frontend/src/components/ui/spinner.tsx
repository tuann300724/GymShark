import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Loading spinner nhỏ dùng inline (mặc định 16px, khớp icon trong Button). */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden />;
}
