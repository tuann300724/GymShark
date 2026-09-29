import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Trang 404 toàn cục — theo DESIGN_SYSTEM.md (dark neon, tiếng Việt) */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-display text-[clamp(110px,22vw,220px)] leading-none font-extrabold text-neon drop-shadow-[0_0_30px_rgba(183,255,0,0.35)]">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-chalk">
        Trang không tồn tại
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Đường dẫn bạn vừa truy cập không có trong hệ thống hoặc đã bị di chuyển. Kiểm tra lại địa
        chỉ hoặc quay về trang chủ nhé.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" passHref>
          <Button variant="primary" size="lg">
            <Home className="size-4" /> Về trang chủ
          </Button>
        </Link>
        <Link href="/login" passHref>
          <Button variant="outline" size="lg">
            <Compass className="size-4" /> Đăng nhập
          </Button>
        </Link>
      </div>
    </div>
  );
}
