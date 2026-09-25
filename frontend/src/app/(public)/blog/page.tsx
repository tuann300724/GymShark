import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Reveal } from '@/components/home/reveal';

const ARTICLES = [
  {
    category: 'Dinh dưỡng',
    title: 'Nạp năng lượng đúng lúc, phục hồi nhanh hơn',
    excerpt:
      'Thời điểm nạp carbohydrate và protein quyết định phần lớn hiệu quả phục hồi sau buổi tập.',
    date: '12/09/2026',
    readTime: '5 phút đọc',
    img: '/images/article.jpg',
    alt: 'Vận động viên trong phòng gym với ánh sáng tối',
  },
  {
    category: 'Tập luyện',
    title: 'Xây dựng lịch tập 6 buổi không bị quá tải',
    excerpt:
      'Cách chia nhóm cơ Push — Pull — Legs để khối lượng tập cân bằng, bạn không rơi vào trạng thái tập quá nhiều.',
    date: '05/09/2026',
    readTime: '7 phút đọc',
    img: '/images/pullup.jpg',
    alt: 'Vận động viên tập xà kép',
  },
  {
    category: 'Phong cách sống',
    title: 'Chuỗi ngày kỷ luật: giữ động lực sau tuần thứ ba',
    excerpt:
      'Động lực chỉ đưa bạn đi được một đoạn. Hệ thống — thời điểm cố định, mục tiêu nhỏ, theo dõi tiến độ — mới giữ bạn ở lại.',
    date: '28/08/2026',
    readTime: '6 phút đọc',
    img: '/images/bw-training.jpg',
    alt: 'Vận động viên trong không gian gym tối',
  },
];

export default function BlogPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Blog fitness
            </p>
            <h1 className="section-title mt-4">Articles & Guides</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
              Kiến thức tập luyện, dinh dưỡng và thói quen phục hồi — viết ngắn gọn, áp dụng được
              ngay.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Article list */}
      <section className="py-14 lg:py-16">
        <div className="container-x">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a, i) => (
              <Reveal key={a.title} delay={i * 90}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-300 hover:border-neon/40">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={a.img}
                      alt={a.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-surface/60 via-transparent to-transparent"
                      aria-hidden
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neon">
                      {a.category}
                    </p>
                    <h2 className="mt-2 font-display text-xl font-bold uppercase leading-tight tracking-tight text-chalk transition-colors group-hover:text-neon">
                      {a.title}
                    </h2>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">{a.excerpt}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {a.readTime}
                      </span>
                      <span className="font-semibold text-chalk transition-colors group-hover:text-neon">
                        Đọc thêm →
                      </span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link href="/register">
              <button className="inline-flex h-11 items-center gap-2 rounded-sm border border-line px-5 text-sm font-semibold text-chalk transition-colors hover:border-neon/60 hover:text-neon">
                Đăng ký để theo dõi tiến độ
                <ArrowRight className="size-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
