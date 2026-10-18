'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE, fadeUp, staggerContainer, staggerItem, viewportOnce } from '@/lib/motion';

/**
 * Bản client của scroll-reveal — fade/slide-up khi cuộn vào viewport.
 * Giống `<Reveal>` (CSS) nhưng dùng framer-motion; ưu tiên `<Reveal>` sẵn có,
 * chỉ dùng RevealFx khi cần đồng bộ timing với các motion component khác.
 */
export function RevealFx({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Delay tính bằng ms */
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      transition={{ duration: 0.5, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}

/** Container stagger — bọc nhóm phần tử, mỗi con dùng `<StaggerItem/>`. */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

/** Part tử con của `<StaggerGroup/>`. */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/**
 * Số đếm tăng dần (count-up) khi cuộn vào khung nhìn.
 * Tự tắt khi bật `prefers-reduced-motion` (hiện số cuối ngay).
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  /** customize cách hiển thị — mặc định `toLocaleString('vi-VN')`, làm tròn số nguyên */
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion || !Number.isFinite(value)) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : Math.round(display).toLocaleString('vi-VN')}
    </span>
  );
}
