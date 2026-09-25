import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-muted mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-[10px] border border-line bg-ink px-3.5 py-2.5 text-sm text-chalk placeholder:text-muted/70 transition-colors focus:outline-none focus:ring-2 focus:ring-neon/70 focus:border-neon/70',
            error ? 'border-danger focus:ring-danger/70' : '',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
