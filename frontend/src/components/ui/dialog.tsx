'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE } from '@/lib/motion';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Đóng hộp thoại"
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            className={cn(
              'relative w-full max-w-lg rounded-2xl border border-line bg-surface shadow-2xl p-6',
              // Nội dung dài (form nhiều ô, màn quét camera) ở mobile sẽ cao hơn viewport;
              // body đã bị khoá scroll nên bản thân hộp thoại phải cuộn được, nếu không
              // nút đóng và các nút cuối sẽ nằm ngoài màn hình, không bấm được.
              'max-h-[calc(100dvh-2rem)] overflow-y-auto',
              className,
            )}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-muted hover:text-chalk transition-colors"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>
            {title && <h2 className="text-lg font-bold text-chalk">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
