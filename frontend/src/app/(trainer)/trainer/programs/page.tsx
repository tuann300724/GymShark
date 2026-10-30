import { redirect } from 'next/navigation';

/** Khu "Bài tập" vào thẳng trang soạn — không còn trang danh sách trung gian. */
export default function TrainerProgramsPage() {
  redirect('/trainer/programs/builder');
}
