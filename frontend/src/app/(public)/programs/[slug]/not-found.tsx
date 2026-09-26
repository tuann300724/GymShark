import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProgramNotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <SearchX className="size-12 text-muted" />
      <h1 className="section-title mt-5">Không tìm thấy chương trình</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        Chương trình bạn tìm không tồn tại hoặc đã được đổi tên. Quay lại danh sách để chọn buổi tập
        khác nhé.
      </p>
      <Link href="/#programs" className="mt-7">
        <Button className="h-11 font-bold">
          <ArrowLeft className="size-4" />
          Quay lại danh sách chương trình
        </Button>
      </Link>
    </div>
  );
}
