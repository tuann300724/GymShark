import type { Variants } from 'framer-motion';

/** Ease chuẩn của design system (khớp cubic-bezier trong globals.css). */
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Fade + trượt lên nhẹ — dùng cho section/card khi cuộn tới. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Container cho stagger — kết hợp với `staggerItem` cho từng phần tử con. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Phần tử lọt vào stagger container. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** Viewport mặc định: chỉ animate một lần, bắt đầu khi element vào ~15% khung nhìn. */
export const viewportOnce = { once: true, amount: 0.15 } as const;
