'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';

/**
 * Bọc toàn bộ app để framer-motion tự tôn trọng `prefers-reduced-motion`
 * của người dùng (tắt transform/animation chuyển động, giữ opacity/color).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
