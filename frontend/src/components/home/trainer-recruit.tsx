import React from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarDays, MessageSquare, Star, UserPlus } from 'lucide-react';
import { Reveal } from './reveal';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Gửi hồ sơ & bằng cấp',
    desc: 'Khai chuyên môn, kinh nghiệm và tải ảnh bằng cấp, chứng chỉ — hoàn toàn miễn phí.',
  },
  {
    icon: BadgeCheck,
    title: 'GymMaster thẩm định',
    desc: 'Quản trị viên xác minh bằng cấp; được duyệt thì tài khoản PT gửi về email của bạn.',
  },
  {
    icon: Star,
    title: 'Nhận học viên online',
    desc: 'Hồ sơ hiển thị công khai, hội viên nhắn tin, đặt lịch và đánh giá trực tiếp cho bạn.',
  },
];

const PERKS = [
  { icon: MessageSquare, label: 'Chat trực tiếp với hội viên' },
  { icon: CalendarDays, label: 'Lịch tập, giáo án & thực đơn' },
  { icon: Star, label: 'Đánh giá công khai xây uy tín' },
];

/** Khối trang chủ mời huấn luyện viên tự do đăng ký làm PT online trên GymMaster */
export function TrainerRecruit() {
  return (
    <section id="trainers-join" className="scroll-mt-24 pb-20 lg:pb-24">
      <div className="container-x">
        <Reveal>
          <div className="grid gap-10 rounded-3xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div>
              <p className="meta-label">Dành cho huấn luyện viên</p>
              <h2 className="section-title mt-2">
                Bạn là PT? <span className="text-neon">Dạy online</span> trên GymMaster.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Đăng ký làm huấn luyện viên <b className="text-chalk">hoàn toàn miễn phí</b>. Sau
                khi được duyệt, hồ sơ của bạn xuất hiện ở trang Huấn luyện viên để hội viên khắp
                mạng lưới tìm thấy và liên hệ.
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {PERKS.map((perk) => (
                  <li
                    key={perk.label}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-ink px-3 py-1.5 text-xs text-chalk"
                  >
                    <perk.icon className="size-3.5 text-neon" />
                    {perk.label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/trainers/register"
                  className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-neon px-6 text-[15px] font-bold text-ink transition-colors hover:bg-neon-hover active:translate-y-px"
                >
                  Đăng ký làm PT miễn phí
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-sm border border-line px-6 text-[15px] font-semibold text-chalk transition-colors hover:border-neon/60 hover:text-neon"
                >
                  Đã có tài khoản PT
                </Link>
              </div>
            </div>

            <ol className="space-y-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-line bg-ink p-5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-line text-neon">
                    <step.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold uppercase text-chalk">
                      <span className="mr-2 text-neon">0{i + 1}</span>
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
