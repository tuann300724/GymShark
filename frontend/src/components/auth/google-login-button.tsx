import React from 'react';
import { Button } from '@/components/ui/button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3001/api';

/** Nút đăng nhập/đăng ký bằng Google — chuyển hướng sang backend OAuth rồi về /auth/callback. */
export function GoogleLoginButton({ label = 'Tiếp tục với Google' }: { label?: string }) {
  return (
    <a href={`${API_BASE}/auth/google`} className="block w-full">
      <Button type="button" variant="secondary" className="h-11 w-full text-sm font-bold">
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.62.75 3.84 3.27 1.92 6.85l3.66 2.84C6.45 7.06 8.98 5.04 12 5.04z"
          />
          <path
            fill="#4285F4"
            d="M23.25 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.15-1.99 3.49-4.9 3.49-8.68z"
          />
          <path
            fill="#FBBC05"
            d="M5.58 14.31c-.22-.66-.35-1.36-.35-2.08s.13-1.43.35-2.08L1.92 6.85C1.34 8.02 1 9.36 1 10.81s.34 2.79.92 3.96l3.66-2.46z"
          />
          <path
            fill="#34A853"
            d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.69-2.86c-1.02.69-2.33 1.1-3.77 1.1-3.02 0-5.55-2.03-6.42-4.46l-3.66 2.46c1.92 3.58 5.7 6.48 9.08 6.48z"
          />
        </svg>
        {label}
      </Button>
    </a>
  );
}
