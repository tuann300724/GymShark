'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InputProps } from '@/components/ui/input';

/**
 * Input mật khẩu có nút hiện/ẩn (con mắt).
 * Drop-in thay thế `<Input type="password" />` — cùng API label/error.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-muted"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'flex h-11 w-full rounded-[10px] border border-line bg-ink py-2 pl-3.5 pr-11 text-sm text-chalk placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-danger focus:ring-danger/70 focus:border-danger',
              className,
            )}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted transition-colors hover:text-neon focus:text-neon focus:outline-none"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        {error && <p className="text-xs font-medium text-danger">{error}</p>}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
