'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (t: { type?: ToastType; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
});

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = 'info',
      title,
      description,
    }: {
      type?: ToastType;
      title: string;
      description?: string;
    }) => {
      const id = ++toastId;
      setItems((prev) => [...prev.slice(-3), { id, type, title, description }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ type: 'success', title, description }),
      error: (title, description) => toast({ type: 'error', title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md animate-slide-up',
              'bg-surface/95',
              t.type === 'success' && 'border-neon/40',
              t.type === 'error' && 'border-danger/40',
              t.type === 'info' && 'border-line',
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="size-5 text-neon shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="size-5 text-danger shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="size-5 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-chalk">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted mt-0.5 break-words">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-muted hover:text-chalk shrink-0"
              aria-label="Đóng thông báo"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
