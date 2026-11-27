'use client';

/**
 * Hiệu ứng trang chủ (không thư viện): đếm số tăng dần, thẻ nghiêng 3D theo chuột, dải chữ chạy.
 * Tất cả tắt khi người dùng bật "giảm chuyển động" (prefers-reduced-motion).
 */
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;
}

/** Số đếm từ 0 lên `value` khi phần tử lọt vào màn hình */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const startAt = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - startAt) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return <span ref={ref}>{shown.toLocaleString('vi-VN')}</span>;
}

/** Thẻ nghiêng 3D theo vị trí chuột + vệt sáng phản chiếu */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    el.style.setProperty('--glare', '1');
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--glare', '0');
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn('tilt-card relative h-full', className)}
    >
      {children}
      <span
        aria-hidden
        className="tilt-glare pointer-events-none absolute inset-0 rounded-[inherit]"
      />
    </div>
  );
}

/** Dải chữ chạy ngang vô tận */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden}>
      {items.map((item) => (
        <span
          key={item}
          className="flex items-center gap-10 font-display text-2xl font-bold uppercase tracking-wide text-chalk sm:text-3xl"
        >
          {item}
          <span className="size-2 rotate-45 bg-neon" aria-hidden />
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee relative flex overflow-hidden border-y border-line bg-surface py-5">
      <div className="marquee-track flex">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
