const TRAINER_VISUALS = [
  {
    src: '/images/article.jpg',
    alt: 'Vận động viên tập luyện trong ánh sáng tối',
  },
  {
    src: '/images/pullup.jpg',
    alt: 'Vận động viên tập xà đơn trong phòng gym',
  },
  {
    src: '/images/program-pull.jpg',
    alt: 'Bài tập kéo trong phòng gym tối',
  },
  {
    src: '/images/program-push.jpg',
    alt: 'Bài tập đẩy trong phòng gym tối',
  },
  {
    src: '/images/gym-wide.jpg',
    alt: 'Hàng tạ đơn trong phòng gym',
  },
  {
    src: '/images/program-legs-abs.jpg',
    alt: 'Bài tập chân và bụng trong phòng gym tối',
  },
  {
    src: '/images/bw-training.jpg',
    alt: 'Hình ảnh đen trắng của buổi tập trong phòng gym',
  },
  {
    src: '/images/program-shoulders.jpg',
    alt: 'Bài tập vai trong phòng gym tối',
  },
] as const;

/** Chọn ảnh nền phù hợp với chuyên môn; fallback ổn định theo id khi không khớp từ khóa. */
export function getTrainerVisual(specialization: string, id: string) {
  const value = specialization.toLowerCase();
  const keywordMap: Array<[RegExp, number]> = [
    [/cardio|giảm mỡ/, 0],
    [/hiit|crossfit|sức bền/, 1],
    [/yoga|pilates|phục hồi/, 2],
    [/sức mạnh|thể hình/, 3],
    [/functional|mobility/, 4],
    [/boxing/, 5],
  ];

  const matched = keywordMap.find(([pattern]) => pattern.test(value));
  const index = matched
    ? matched[1]
    : Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % TRAINER_VISUALS.length;

  return TRAINER_VISUALS[index];
}

/** Tách chuyên môn thành các nhãn ngắn để lọc và hiển thị. */
export function getTrainerFocusTags(specialization: string): string[] {
  return Array.from(
    new Set(
      specialization
        .split(/[,·]|\s+&\s+/)
        .map((part) => part.replace(/\s*\([^)]*\)/g, '').trim())
        .filter(Boolean),
    ),
  ).slice(0, 3);
}
