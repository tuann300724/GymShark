import type { Metadata } from 'next';
import { TrainerProfile } from '@/components/trainer/trainer-profile';

interface TrainerDetailPageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Hồ sơ huấn luyện viên | GymMaster Pro',
  description: 'Xem chuyên môn, chứng chỉ và lộ trình huấn luyện của từng HLV tại GymMaster Pro.',
};

export default function TrainerDetailPage({ params }: TrainerDetailPageProps) {
  return <TrainerProfile id={params.id} />;
}
