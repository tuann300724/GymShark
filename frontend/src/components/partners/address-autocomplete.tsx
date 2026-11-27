'use client';

/**
 * Ô nhập có gợi ý: gõ tên (có dấu hoặc không dấu) là hiện danh sách khớp ngay,
 * không phải mở danh sách dài rồi dò. ↑/↓ để chọn, Enter để xác nhận, Esc để đóng.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  value: string;
  label: string;
}

const MAX_SUGGESTIONS = 8;
const LEVEL_PREFIX = /^(tinh|thanh pho|quan|huyen|thi xa|thi tran|phuong|xa)\s+/;

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  className,
}: AddressAutocompleteProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = options.find((option) => option.value === value);

  const indexed = useMemo(
    () =>
      options.map((option) => {
        const full = normalize(option.label);
        return { option, full, short: full.replace(LEVEL_PREFIX, '') };
      }),
    [options],
  );

  const suggestions = useMemo(() => {
    const q = normalize(query).replace(LEVEL_PREFIX, '');
    if (!q) return [];
    // Ưu tiên tên bắt đầu bằng chữ đã gõ, sau đó mới tới tên chứa chữ đó
    const starts = indexed.filter((item) => item.short.startsWith(q));
    const contains = indexed.filter(
      (item) => !item.short.startsWith(q) && (item.full.includes(q) || item.short.includes(q)),
    );
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS).map((item) => item.option);
  }, [indexed, query]);

  const choose = (option: AutocompleteOption) => {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  };

  const showList = open && query.trim() !== '';

  return (
    <div className={cn('relative w-full min-w-0 space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && suggestions[active] ? `${id}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : selected?.label || ''}
          placeholder={selected?.label || placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery('');
            setActive(0);
          }}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((current) => Math.min(current + 1, suggestions.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter') {
              if (!showList) return;
              event.preventDefault();
              const option = suggestions[active];
              if (option) {
                choose(option);
                inputRef.current?.blur();
              }
            } else if (event.key === 'Escape') {
              setQuery('');
              inputRef.current?.blur();
            }
          }}
          className="h-11 w-full rounded-sm border border-line bg-ink pl-3.5 pr-9 text-sm text-chalk placeholder:text-muted focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:opacity-60"
        />
        {selected && !disabled && (
          <button
            type="button"
            aria-label={`Xoá ${label.toLowerCase()}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted hover:text-chalk"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-sm border border-line bg-surface py-1 shadow-xl"
        >
          {suggestions.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-muted">Không có tên nào khớp</li>
          ) : (
            suggestions.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown để chọn trước khi input mất focus
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                  inputRef.current?.blur();
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm text-chalk',
                  index === active && 'bg-ink text-neon',
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="size-3.5 shrink-0" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
