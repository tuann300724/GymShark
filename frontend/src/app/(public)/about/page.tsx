'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/package.service';
import { Button } from '@/components/ui/button';
import { Flame, Target, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';

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

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-slate-950 py-20 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">About Us</p>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mx-auto">
            Chúng tôi là <span className="text-emerald-400">GymMaster</span> — nơi biến mục tiêu thành thói quen
          </h1>
          <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-lg">
            Từ năm 2016, GymMaster đã đồng hành cùng hàng nghìn hội viên trên hành trình rèn luyện sức khỏe,
            thể hình và tinh thần.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Câu chuyện của chúng tôi
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              GymMaster khởi đầu từ một phòng tập nhỏ với niềm tin đơn giản: <b>ai cũng xứng đáng có một cơ thể
              khỏe mạnh và tự tin</b>. Qua nhiều năm, chúng tôi đã phát triển thành hệ thống phòng gym hiện đại
              với trang thiết bị nhập khẩu, đội ngũ huấn luyện viên có chứng chỉ quốc tế và cộng đồng hội viên
              gắn kết.
            </p>
            <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              Chúng tôi không chỉ bán thẻ tập — chúng tôi xây dựng môi trường để bạn có thể phát triển bền vững:
              từ những buổi tập đầu tiên, lộ trình giảm mỡ - tăng cơ, đến việc duy trì thói quen vận động trọn đời.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: homeStats?.totalMembers?.toLocaleString('vi-VN') || '1.200+', label: 'Hội viên' },
              { stat: homeStats?.totalTrainers?.toLocaleString('vi-VN') || '25+', label: 'HLV chuyên nghiệp' },
              { stat: '35+', label: 'Lớp học mỗi tuần' },
              { stat: homeStats?.totalBranches?.toLocaleString('vi-VN') || '1', label: 'Chi nhánh' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center"
              >
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{s.stat}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">
              Our Values
            </p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Giá trị chúng tôi theo đuổi
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-10 sm:p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-emerald-600/30">
          <div className="absolute -top-10 -left-10 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
          <Flame className="w-10 h-10 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Hãy là phần tiếp theo của câu chuyện</h2>
          <p className="mt-3 text-emerald-50/90 max-w-xl mx-auto">
            Đến tham quan phòng tập và nhận 1 buổi tập thử miễn phí ngay hôm nay.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl">
                Đăng ký ngay
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/packages">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
              >
                Xem gói tập
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}