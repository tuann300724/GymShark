'use client';

import React, { useState, useCallback, createContext, useContext, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type ConfirmType = 'success' | 'danger' | 'info';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description?: string;
  type: ConfirmType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  description?: string;
  type?: ConfirmType;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const TYPE_META: Record<
  ConfirmType,
  { icon: typeof Info; iconClass: string; confirmVariant: 'primary' | 'danger' }
> = {
  success: { icon: CheckCircle2, iconClass: 'text-neon', confirmVariant: 'primary' },
  danger: { icon: AlertTriangle, iconClass: 'text-danger', confirmVariant: 'danger' },
  info: { icon: Info, iconClass: 'text-neon', confirmVariant: 'primary' },
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    type: 'info',
  });

  const close = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  const confirm = useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        title: options?.title || 'Xác nhận',
        description: options?.description,
        type: options?.type || 'info',
        onConfirm: () => {
          options?.onConfirm?.();
          resolve(true);
          setState((prev) => ({ ...prev, open: false }));
        },
        onCancel: () => {
          options?.onCancel?.();
          resolve(false);
          setState((prev) => ({ ...prev, open: false }));
        },
      });
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);
  const meta = TYPE_META[state.type];
  const Icon = meta.icon;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onClose={() => {
          // Escape / click overlay === Hủy → resolve(false) để caller không treo Promise
          if (state.onCancel) state.onCancel();
          else close();
        }}
        title={state.title}
        className="max-w-md"
      >
        <div className="mt-1 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface',
                meta.iconClass,
              )}
            >
              <Icon className="size-5" />
            </div>
            {state.description ? (
              <p className="pt-1.5 text-sm leading-relaxed text-muted">{state.description}</p>
            ) : (
              <p className="pt-1.5 text-sm leading-relaxed text-muted">
                Bạn có chắc chắn muốn tiếp tục?
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => state.onCancel?.()}>
              Hủy
            </Button>
            <Button variant={meta.confirmVariant} size="sm" onClick={() => state.onConfirm?.()}>
              Xác nhận
            </Button>
          </div>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
