import React from 'react';
import { CreditCard, MapPin, ScanFace, TrendingUp } from 'lucide-react';
import { Reveal } from './reveal';
import { StaggerGroup, StaggerItem } from '@/components/ui/motion';
import { TiltCard } from './effects';

const STEPS = [
  {
    icon: CreditCard,
    title: 'Chọn gói theo hạng',
    desc: 'Gói tháng hoặc gói lượt, mỗi gói ghi rõ được vào phòng hạng Standard, Plus hay Premium.',
  },
  {
    icon: MapPin,
    title: 'Tìm phòng gần bạn',
    desc: 'Dashboard gợi ý phòng đối tác cùng phường, quận với địa chỉ của bạn và chỉ đường trên bản đồ.',
  },
  {
    icon: ScanFace,
    title: 'Quét mặt để vào tập',
    desc: 'Đăng ký khuôn mặt một lần, đến bất kỳ phòng nào trong mạng lưới chỉ cần quét mặt tại quầy.',
  },
  {
    icon: TrendingUp,
    title: 'Theo dõi mọi buổi tập',
    desc: 'Lịch sử check-in ở mọi phòng, số lượt còn lại và hạn thẻ hiển thị chung một chỗ.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 lg:py-24">
      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <p className="meta-label">Dành cho hội viên</p>
            <h2 className="section-title mt-2">Tập ở đâu cũng được</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Không còn bị gắn với một phòng duy nhất — chuyển chỗ làm, đi công tác hay về quê, thẻ
              tập của bạn vẫn dùng được trong mạng lưới.
            </p>
          </div>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <StaggerItem key={step.title} className="h-full">
              <TiltCard className="relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-sm border border-neon/25 bg-neon/10 text-neon">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-display text-4xl font-extrabold leading-none text-line">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-chalk">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{step.desc}</p>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
