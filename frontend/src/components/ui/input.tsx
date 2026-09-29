import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      // min-w-0: cho phép co lại trong grid/flex (input type=date có min-content ~165px,
      // nếu thiếu min-w-0 sẽ đẩy vỡ layout ở viewport hẹp)
      <div className="w-full min-w-0 space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-muted"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-11 w-full min-w-0 rounded-[10px] border border-line bg-ink px-3.5 py-2 text-sm text-chalk placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-danger focus:ring-danger/70 focus:border-danger',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger font-medium">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
