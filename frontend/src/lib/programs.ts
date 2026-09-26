/** Bài tập lẻ trong một chương trình training */
export interface ProgramExercise {
  /** Tên bài tập (tiếng Việt) */
  name: string;
  /** Tên tiếng Anh (ghi trên máy tập / thiết bị) */
  en: string;
  /** Số hiệp (set) */
  sets: number;
  /** Số lần (rep) trong mỗi hiệp */
  reps: string;
  /** Thời gian nghỉ giữa các hiệp */
  rest: string;
  /** Dụng cụ / máy tập cần dùng */
  equipment: string;
  /** Mẹo thực hiện (tuỳ chọn) */
  tip?: string;
}

/** Một buổi training trong tuần (6 buổi xoay vòng) */
export interface Program {
  /** Dùng cho URL /programs/[slug] */
  slug: string;
  /** Nhãn buổi tập trên card, ví dụ "Day 01" */
  day: string;
  /** Nhóm cơ, ví dụ "Chest + Triceps" */
  group: string;
  /** Tên buổi tập, ví dụ "Push Day" */
  name: string;
  /** Thời lượng dự kiến (phút) */
  duration: number;
  /** Ảnh đại diện (public/images/...) */
  img: string;
  alt: string;
  /** Mô tả ngắn cho trang chi tiết */
  summary: string;
  exercises: ProgramExercise[];
}

export const PROGRAMS: Program[] = [
  {
    slug: 'push-day',
    day: 'Day 01',
    group: 'Chest + Triceps',
    name: 'Push Day',
    duration: 60,
    img: '/images/program-push.jpg',
    alt: 'Bàn tay chọn tạ dumbbell trên giá tạ trong phòng gym tối',
    summary:
      'Buổi đẩy toàn thân trước: ngực, vai trước và tay sau. Bắt đầu với biến động chính nặng nhất rồi chuyển dần sang bài cô lập để ép máu vào cơ.',
    exercises: [
      {
        name: 'Ép tạ barbell nằm',
        en: 'Barbell Bench Press',
        sets: 4,
        reps: '8-10',
        rest: '90 giây',
        equipment: 'Barbell + ghế nằm phẳng',
        tip: 'Thả vai về sau, chống chân chắc; hạ tạ chạm ngực rồi đẩy lên nhanh, không dồn quán tính.',
      },
      {
        name: 'Ép tạ đơn nghiêng',
        en: 'Incline Dumbbell Press',
        sets: 3,
        reps: '10-12',
        rest: '60 giây',
        equipment: 'Tạ đơn + ghế nghiêng 30°',
      },
      {
        name: 'Đẩy cáp xuống',
        en: 'Triceps Pushdown',
        sets: 3,
        reps: '12-15',
        rest: '45 giây',
        equipment: 'Máy cáp + thanh chữ V',
        tip: 'Ép khuỷu tay sát thân người, chỉ khớp khuỷu được phép chuyển động.',
      },
      {
        name: 'Tập xà kép',
        en: 'Parallel Bar Dips',
        sets: 3,
        reps: 'Đến mỏi',
        rest: '60 giây',
        equipment: 'Xà kép',
        tip: 'Người nghiêng nhẹ về trước để ngực tác động nhiều hơn, xuống tầm song song với sàn.',
      },
    ],
  },
  {
    slug: 'pull-day',
    day: 'Day 02',
    group: 'Back + Biceps',
    name: 'Pull Day',
    duration: 65,
    img: '/images/program-pull.jpg',
    alt: 'Vận động viên tập deadlift dưới ánh sáng spotlight trong phòng tối',
    summary:
      'Buổi kéo tập trung vào lưng xô, lưng giữa và tay trước. Ưu tiên bài compound nặng đầu buổi, kết thúc bằng isolation để cảm nhận cơ.',
    exercises: [
      {
        name: 'Kéo tạ sàn',
        en: 'Deadlift',
        sets: 4,
        reps: '5',
        rest: '2 phút',
        equipment: 'Barbell',
        tip: 'Lưng thẳng, bar sát thân; đẩy sàn bằng chân và kéo hông về phía trước, không ngẩng lưng.',
      },
      {
        name: 'Kéo tạ barbell',
        en: 'Barbell Row',
        sets: 4,
        reps: '8-10',
        rest: '90 giây',
        equipment: 'Barbell',
      },
      {
        name: 'Kéo xà lat',
        en: 'Lat Pulldown',
        sets: 3,
        reps: '10-12',
        rest: '60 giây',
        equipment: 'Máy kéo xà',
        tip: 'Kéo thanh về ngực trên, vai depress trước rồi mới gập khuỷu; đừng đu người.',
      },
      {
        name: 'Kéo cáp Face Pull',
        en: 'Face Pull',
        sets: 3,
        reps: '15',
        rest: '45 giây',
        equipment: 'Máy cáp + dây rope',
      },
      {
        name: 'Gập tạ barbell',
        en: 'Barbell Curl',
        sets: 3,
        reps: '10-12',
        rest: '45 giây',
        equipment: 'Barbell',
        tip: 'Không đu thân người; giữ khuỷu tay cố định, chỉ khớp khuỷu được phép chuyển động.',
      },
    ],
  },
  {
    slug: 'shoulder-blast',
    day: 'Day 03',
    group: 'Shoulders',
    name: 'Shoulder Blast',
    duration: 50,
    img: '/images/program-shoulders.jpg',
    alt: 'Vận động viên tập ép tạ qua đầu',
    summary:
      'Buổi vai chuyên sâu quét đủ ba đầu cơ: trước, giữa và sau. Nhịp nhanh, nghỉ ngắn để vai phồng và giữ tension tối đa.',
    exercises: [
      {
        name: 'Ép tạ qua đầu',
        en: 'Overhead Press',
        sets: 4,
        reps: '6-8',
        rest: '90 giây',
        equipment: 'Barbell',
        tip: 'Siết mông, chặn hông; thanh đi thẳng qua mặt chứ không vòng ra sau đầu.',
      },
      {
        name: 'Nép tạ sang bên',
        en: 'Lateral Raise',
        sets: 4,
        reps: '15',
        rest: '45 giây',
        equipment: 'Tạ đơn',
        tip: 'Hơi gập khuỷu, nâng đến ngang vai rồi hạ chậm; đừng dùng đà của thân người.',
      },
      {
        name: 'Đẩy tạ ngược',
        en: 'Rear Delt Fly',
        sets: 3,
        reps: '15',
        rest: '45 giây',
        equipment: 'Máy Reverse Pec Deck hoặc tạ đơn',
      },
      {
        name: 'Giơ vai',
        en: 'Dumbbell Shrug',
        sets: 3,
        reps: '12',
        rest: '60 giây',
        equipment: 'Tạ đơn nặng',
        tip: 'Giơ thẳng lên vai, giữ 1 giây trên đỉnh; không xoay tròn vai.',
      },
    ],
  },
  {
    slug: 'leg-day',
    day: 'Day 04',
    group: 'Legs + Abs',
    name: 'Leg Day',
    duration: 70,
    img: '/images/program-legs-abs.jpg',
    alt: 'Vận động viên tập nâng tạ trong phòng tối',
    summary:
      'Buổi nặng nhất trong tuần: squat cho toàn bộ chân, thêm bài tập trung và kết thúc bằng bụng treo. Dành đủ thời gian nghỉ để giữ cường độ.',
    exercises: [
      {
        name: 'Squat',
        en: 'Barbell Back Squat',
        sets: 4,
        reps: '6-8',
        rest: '2 phút',
        equipment: 'Barbell + rack squat',
        tip: 'Hít thở ép bụng (bracing) trước khi xuống; đầu gối theo hướng mũi chân, hạ đến đùi song song.',
      },
      {
        name: 'Kéo tạ RDL',
        en: 'Romanian Deadlift',
        sets: 3,
        reps: '8-10',
        rest: '90 giây',
        equipment: 'Barbell',
        tip: 'Hông đẩy về phía sau, thanh trượt sát đùi; giữ lưng trung tính, cảm nhận hamstring căng.',
      },
      {
        name: 'Đẩy chân máy',
        en: 'Leg Press',
        sets: 3,
        reps: '10-12',
        rest: '90 giây',
        equipment: 'Máy Leg Press',
      },
      {
        name: 'Đi chùng tạ',
        en: 'Walking Lunge',
        sets: 3,
        reps: '12 mỗi bên',
        rest: '60 giây',
        equipment: 'Tạ đơn',
      },
      {
        name: 'Gập bụng treo',
        en: 'Hanging Leg Raise',
        sets: 3,
        reps: '15',
        rest: '45 giây',
        equipment: 'Thanh xà đơn',
        tip: 'Không đu người; cuộn xương cùng trước rồi mới nâng chân, hạ chậm từng đốt.',
      },
    ],
  },
  {
    slug: 'upper-power',
    day: 'Day 05',
    group: 'Chest + Shoulders',
    name: 'Upper Power',
    duration: 55,
    img: '/images/program-upper.jpg',
    alt: 'Hình bóng vận động viên chuẩn bị nâng tạ barbell trong ánh đèn pha',
    summary:
      'Buổi sức mạnh phần thân trên: khối lượng nặng, số hiệp thấp. Mục tiêu là chất lượng từng reps hơn là số lượng.',
    exercises: [
      {
        name: 'Ép tạ barbell',
        en: 'Barbell Bench Press',
        sets: 5,
        reps: '5',
        rest: '2 phút',
        equipment: 'Barbell + ghế nằm phẳng',
        tip: 'Dùng khoảng 75-80% 1RM, mỗi hiệp nghỉ đủ để chất lượng reps không giảm.',
      },
      {
        name: 'Ép tạ qua đầu',
        en: 'Standing Overhead Press',
        sets: 4,
        reps: '5',
        rest: '90 giây',
        equipment: 'Barbell',
      },
      {
        name: 'Xà kép tạ',
        en: 'Weighted Dips',
        sets: 3,
        reps: '8',
        rest: '90 giây',
        equipment: 'Xà kép + đai tạ',
      },
      {
        name: 'Press Arnold',
        en: 'Arnold Press',
        sets: 3,
        reps: '10',
        rest: '60 giây',
        equipment: 'Tạ đơn',
        tip: 'Xoay cổ tay trong suốt quãng đẩy; kiểm soát nhịp cả khi lên lẫn khi xuống.',
      },
    ],
  },
  {
    slug: 'back-arms',
    day: 'Day 06',
    group: 'Back + Arms',
    name: 'Back & Arms',
    duration: 60,
    img: '/images/program-back-arms.jpg',
    alt: 'Vận động viên tập xà kép',
    summary:
      'Buổi cuối cùng của chuỗi: lưng và tay được tách riêng theo kiểu pull, mỗi nhóm một isolation cuối buổi. Kết thúc tuần với cơ tay đã được "đầy".',
    exercises: [
      {
        name: 'Kéo xà tạ',
        en: 'Weighted Pull-up',
        sets: 4,
        reps: '6-8',
        rest: '90 giây',
        equipment: 'Thanh xà + đai tạ',
        tip: 'Kéo ngực chạm thanh, siết nách ở đỉnh 1 giây; hạ hoàn toàn mỗi reps.',
      },
      {
        name: 'Kéo cáp ngồi',
        en: 'Seated Cable Row',
        sets: 3,
        reps: '10-12',
        rest: '60 giây',
        equipment: 'Máy kéo cáp',
      },
      {
        name: 'Kéo tạ đơn một tay',
        en: 'One-arm Dumbbell Row',
        sets: 3,
        reps: '10 mỗi bên',
        rest: '60 giây',
        equipment: 'Tạ đơn + ghế Bench',
      },
      {
        name: 'Gập tạ đơn nghiêng',
        en: 'Incline Dumbbell Curl',
        sets: 3,
        reps: '12',
        rest: '45 giây',
        equipment: 'Tạ đơn + ghế nghiêng 45°',
        tip: 'Tay sau luôn, giữ khuỷu tay cố định; tay trước căng tối đa ở vị trí duỗi.',
      },
      {
        name: 'Đẩy tạ sau đầu',
        en: 'Overhead Triceps Extension',
        sets: 3,
        reps: '12',
        rest: '45 giây',
        equipment: 'Tạ đơn 2 tay hoặc cáp rope',
      },
    ],
  },
];

/** Tra cứu program theo slug, trả về undefined nếu không tồn tại. */
export function getProgram(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}
