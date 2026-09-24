'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/home/reveal';
import { Target, HeartHandshake, ShieldCheck, ArrowRight, Flame } from 'lucide-react';

const VALUES = [
  {
    icon: Target,
    title: 'Sứ mệnh',
    desc: 'Giúp mỗi người Việt xây dựng thói quen vận động lành mạnh và thể chất bền bỉ thông qua hệ thống phòng tập chuyên nghiệp.',
  },
  {
    icon: HeartHandshake,
    title: 'Cam kết',
    desc: 'Đồng hành cùng hội viên trên mọi hành trình: từ người mới bắt đầu đến vận động viên chuyên nghiệp, với sự tận tâm của đội ngũ HLV.',
  },
  {
    icon: ShieldCheck,
    title: 'Chất lượng',
    desc: 'Trang thiết bị luôn được bảo trì, không gian sạch sẽ, dịch vụ tận tâm — mọi chi tiết đều hướng tới trải nghiệm tốt nhất.',
  },
];

export default function PublicAboutPage() {
  const { data: homeStats } = useQuery({
    queryKey: ['public-home-stats'],
    queryFn: publicApi.getHomeStats,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const stats = [
    { stat: homeStats?.totalMembers?.toLocaleString('vi-VN') || '1.200+', label: 'Hội viên' },
    { stat: homeStats?.totalTrainers?.toLocaleString('vi-VN') || '25+', label: 'HLV chuyên nghiệp' },
    { stat: '35+', label: 'Lớp học mỗi tuần' },
    { stat: homeStats?.totalBranches?.toLocaleString('vi-VN') || '1', label: 'Chi nhánh' },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ===== Page hero ===== */}
      <section className="border-b border-line">
        <div className="container-x py-14 lg:py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon">
              Về GymMaster
            </p>
            <h1 className="section-title mt-4 max-w-3xl">
              Chúng tôi là <span className="text-neon">GymMaster</span> — nơi biến mục tiêu thành
              thói quen
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Từ năm 2016, GymMaster đã đồng hành cùng hàng nghìn hội viên trên hành trình rèn
              luyện sức khỏe, thể hình và tinh thần.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== Story + stats ===== */}
      <section className="py-16 lg:py-20">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line sm:aspect-[16/11]">
              <Image
                src="/images/gym-wide.jpg"
                alt="Hàng tạ đơn trong không gian gym GymMaster"
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"
                aria-hidden
              />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div>
              <h2 className="section-title">Câu chuyện của chúng tôi</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                GymMaster khởi đầu từ một phòng tập nhỏ với niềm tin đơn giản:{' '}
                <b className="font-semibold text-chalk">
                  ai cũng xứng đáng có một cơ thể khỏe mạnh và tự tin
                </b>
                . Qua nhiều năm, chúng tôi đã phát triển thành hệ thống phòng gym hiện đại với trang
                thiết bị nhập khẩu, đội ngũ huấn luyện viên có chứng chỉ quốc tế và cộng đồng hội
                viên gắn kết.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Chúng tôi không chỉ bán thẻ tập — chúng tôi xây dựng môi trường để bạn có thể phát
                triển bền vững: từ những buổi tập đầu tiên, lộ trình giảm mỡ - tăng cơ, đến việc duy
                trì thói quen vận động trọn đời.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-line bg-surface p-6 text-center transition-colors hover:border-neon/40"
                  >
                    <p className="font-display text-3xl font-extrabold leading-none text-neon">
                      {s.stat}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="border-t border-line py-16 lg:py-20">
        <div className="container-x">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="section-title">Giá trị chúng tôi theo đuổi</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Ba nguyên tắc định hình mọi quyết định của GymMaster — từ thiết bị, không gian đến
                cách đội ngũ HLV đồng hành cùng bạn.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-surface p-7 transition-colors duration-300 hover:border-neon/40">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] border border-neon/25 bg-neon/10 text-neon">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-chalk">
                    {v.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA band ===== */}
      <section className="pb-16 lg:pb-20">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line">
              <Image
                src="/images/cta.jpg"
                alt=""
                fill
                aria-hidden
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-ink/85" aria-hidden />

              <div className="relative p-8 text-center sm:p-12">
                <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[10px] border border-neon/40 bg-neon/10 text-neon">
                  <Flame className="h-6 w-6" />
                </span>
                <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-chalk sm:text-4xl">
                  Hãy là phần tiếp theo của câu chuyện
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                  Đến tham quan phòng tập và nhận 1 buổi tập thử miễn phí ngay hôm nay.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link href="/register">
                    <Button size="lg">
                      Đăng ký ngay
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/packages">
                    <Button size="lg" variant="outline">
                      Xem gói tập
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
