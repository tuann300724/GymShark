/**
 * Dữ liệu minh hoạ động tác cho từng bài tập trong chương trình.
 * Mỗi bài có 2 khung: `start` (bắt đầu) và `end` (kết thúc).
 * Toạ độ nằm trong khung 112×108, mặt đất là y=100.
 */

/** Toạ độ một điểm [x, y] trong khung minh hoạ */
type Pt = [number, number];

/** Dụng cụ / máy tập vẽ kèm theo hình người */
export type Gear =
  /** Đĩa tạ nhìn cạnh (circle) — barbell ở chế độ nhìn ngang */
  | { type: 'plate'; at: Pt; r: number }
  /** Tạ đơn nhỏ */
  | { type: 'dumbbell'; at: Pt }
  /** Ghế tập (đường dày, tuỳ chọn có chân chạm sàn) */
  | { type: 'bench'; from: Pt; to: Pt; legs?: boolean }
  /** Thanh ngang cố định (xà đơn, xà kép) */
  | { type: 'beam'; from: Pt; to: Pt }
  /** Trụ khung máy */
  | { type: 'post'; from: Pt; to: Pt }
  /** Dây cáp (đường chấm) */
  | { type: 'cable'; from: Pt; to: Pt }
  /** Khối/đĩa máy (tàu tạ leg press, tấm chặn…) */
  | { type: 'box'; x: number; y: number; w: number; h: number };

/** Tư thế một khung hình */
export interface Pose {
  /** Tâm đầu */
  head: Pt;
  /** Vai (điểm giữa) */
  shoulder: Pt;
  /** Hông (điểm giữa) */
  hip: Pt;
  /** Đường ngang vai — dùng cho hình nhìn frontal */
  shoulderLine?: [Pt, Pt];
  /** Các cánh tay: từ vai → khuỷu → bàn tay */
  arms: { from: Pt; elbow: Pt; hand: Pt }[];
  /** Các chân: hông → đầu gối → bàn chân */
  legs: { knee: Pt; foot: Pt }[];
  gear?: Gear[];
}

/** Bộ hình minh hoạ của một bài tập */
export interface ExerciseFigureData {
  start: Pose;
  end: Pose;
}

const FIGURES: Record<string, ExerciseFigureData> = {
  /* ===== 01 Ép tạ barbell nằm ===== */
  'Barbell Bench Press': {
    start: {
      head: [90, 64],
      shoulder: [78, 70],
      hip: [44, 70],
      arms: [{ from: [78, 70], elbow: [70, 80], hand: [62, 66] }],
      legs: [
        { knee: [36, 86], foot: [30, 100] },
        { knee: [40, 88], foot: [36, 100] },
      ],
      gear: [
        { type: 'bench', from: [24, 76], to: [96, 76], legs: true },
        { type: 'plate', at: [62, 66], r: 8 },
      ],
    },
    end: {
      head: [90, 64],
      shoulder: [78, 70],
      hip: [44, 70],
      arms: [{ from: [78, 70], elbow: [72, 62], hand: [64, 50] }],
      legs: [
        { knee: [36, 86], foot: [30, 100] },
        { knee: [40, 88], foot: [36, 100] },
      ],
      gear: [
        { type: 'bench', from: [24, 76], to: [96, 76], legs: true },
        { type: 'plate', at: [64, 50], r: 8 },
      ],
    },
  },

  /* ===== 02 Ép tạ đơn nghiêng ===== */
  'Incline Dumbbell Press': {
    start: {
      head: [84, 52],
      shoulder: [72, 62],
      hip: [42, 84],
      arms: [{ from: [72, 62], elbow: [66, 74], hand: [58, 64] }],
      legs: [{ knee: [26, 92], foot: [30, 100] }],
      gear: [
        { type: 'bench', from: [88, 58], to: [36, 90], legs: true },
        { type: 'dumbbell', at: [58, 64] },
      ],
    },
    end: {
      head: [84, 52],
      shoulder: [72, 62],
      hip: [42, 84],
      arms: [{ from: [72, 62], elbow: [68, 52], hand: [60, 40] }],
      legs: [{ knee: [26, 92], foot: [30, 100] }],
      gear: [
        { type: 'bench', from: [88, 58], to: [36, 90], legs: true },
        { type: 'dumbbell', at: [60, 40] },
      ],
    },
  },

  /* ===== 03 Đẩy cáp xuống ===== */
  'Triceps Pushdown': {
    start: {
      head: [44, 21],
      shoulder: [44, 32],
      hip: [42, 58],
      arms: [{ from: [44, 32], elbow: [50, 44], hand: [66, 40] }],
      legs: [
        { knee: [42, 79], foot: [42, 100] },
        { knee: [45, 79], foot: [47, 100] },
      ],
      gear: [
        { type: 'post', from: [100, 14], to: [100, 100] },
        { type: 'cable', from: [100, 16], to: [68, 40] },
        { type: 'dumbbell', at: [66, 40] },
      ],
    },
    end: {
      head: [44, 21],
      shoulder: [44, 32],
      hip: [42, 58],
      arms: [{ from: [44, 32], elbow: [50, 44], hand: [66, 64] }],
      legs: [
        { knee: [42, 79], foot: [42, 100] },
        { knee: [45, 79], foot: [47, 100] },
      ],
      gear: [
        { type: 'post', from: [100, 14], to: [100, 100] },
        { type: 'cable', from: [100, 16], to: [68, 64] },
        { type: 'dumbbell', at: [66, 64] },
      ],
    },
  },

  /* ===== 04 Tập xà kép ===== */
  'Parallel Bar Dips': {
    start: {
      head: [40, 46],
      shoulder: [46, 56],
      hip: [56, 74],
      arms: [{ from: [46, 56], elbow: [58, 64], hand: [60, 72] }],
      legs: [{ knee: [70, 88], foot: [84, 94] }],
      gear: [
        { type: 'beam', from: [14, 72], to: [100, 72] },
        { type: 'post', from: [18, 72], to: [18, 100] },
        { type: 'post', from: [96, 72], to: [96, 100] },
      ],
    },
    end: {
      head: [40, 34],
      shoulder: [46, 44],
      hip: [56, 62],
      arms: [{ from: [46, 44], elbow: [58, 54], hand: [60, 72] }],
      legs: [{ knee: [68, 80], foot: [82, 88] }],
      gear: [
        { type: 'beam', from: [14, 72], to: [100, 72] },
        { type: 'post', from: [18, 72], to: [18, 100] },
        { type: 'post', from: [96, 72], to: [96, 100] },
      ],
    },
  },

  /* ===== 05 Kéo tạ sàn ===== */
  Deadlift: {
    start: {
      head: [66, 42],
      shoulder: [58, 50],
      hip: [40, 62],
      arms: [{ from: [58, 50], elbow: [59, 66], hand: [60, 84] }],
      legs: [
        { knee: [34, 82], foot: [30, 100] },
        { knee: [38, 84], foot: [36, 100] },
      ],
      gear: [{ type: 'plate', at: [60, 88], r: 12 }],
    },
    end: {
      head: [50, 20],
      shoulder: [44, 30],
      hip: [40, 56],
      arms: [{ from: [44, 30], elbow: [46, 50], hand: [48, 68] }],
      legs: [
        { knee: [34, 80], foot: [30, 100] },
        { knee: [38, 82], foot: [36, 100] },
      ],
      gear: [{ type: 'plate', at: [48, 74], r: 12 }],
    },
  },

  /* ===== 06 Kéo tạ barbell ===== */
  'Barbell Row': {
    start: {
      head: [80, 46],
      shoulder: [70, 54],
      hip: [44, 60],
      arms: [{ from: [70, 54], elbow: [72, 70], hand: [74, 86] }],
      legs: [
        { knee: [38, 80], foot: [34, 100] },
        { knee: [42, 82], foot: [40, 100] },
      ],
      gear: [{ type: 'plate', at: [74, 89], r: 11 }],
    },
    end: {
      head: [80, 46],
      shoulder: [70, 54],
      hip: [44, 60],
      arms: [{ from: [70, 54], elbow: [76, 70], hand: [58, 64] }],
      legs: [
        { knee: [38, 80], foot: [34, 100] },
        { knee: [42, 82], foot: [40, 100] },
      ],
      gear: [{ type: 'plate', at: [58, 68], r: 11 }],
    },
  },

  /* ===== 07 Kéo xà lat ===== */
  'Lat Pulldown': {
    start: {
      head: [44, 34],
      shoulder: [44, 46],
      hip: [46, 72],
      arms: [{ from: [44, 46], elbow: [56, 54], hand: [54, 44] }],
      legs: [{ knee: [66, 84], foot: [66, 100] }],
      gear: [
        { type: 'bench', from: [34, 78], to: [70, 78], legs: true },
        { type: 'post', from: [102, 12], to: [102, 100] },
        { type: 'cable', from: [102, 14], to: [56, 44] },
        { type: 'dumbbell', at: [54, 44] },
      ],
    },
    end: {
      head: [44, 34],
      shoulder: [44, 46],
      hip: [46, 72],
      arms: [{ from: [44, 46], elbow: [52, 32], hand: [56, 18] }],
      legs: [{ knee: [66, 84], foot: [66, 100] }],
      gear: [
        { type: 'bench', from: [34, 78], to: [70, 78], legs: true },
        { type: 'post', from: [102, 12], to: [102, 100] },
        { type: 'cable', from: [102, 14], to: [58, 18] },
        { type: 'dumbbell', at: [56, 18] },
      ],
    },
  },

  /* ===== 08 Kéo cáp Face Pull ===== */
  'Face Pull': {
    start: {
      head: [40, 21],
      shoulder: [42, 32],
      hip: [40, 58],
      arms: [{ from: [42, 32], elbow: [56, 34], hand: [70, 34] }],
      legs: [
        { knee: [40, 79], foot: [40, 100] },
        { knee: [43, 79], foot: [45, 100] },
      ],
      gear: [
        { type: 'post', from: [102, 14], to: [102, 100] },
        { type: 'cable', from: [102, 16], to: [72, 34] },
        { type: 'dumbbell', at: [70, 34] },
      ],
    },
    end: {
      head: [40, 21],
      shoulder: [42, 32],
      hip: [40, 58],
      arms: [{ from: [42, 32], elbow: [58, 38], hand: [52, 26] }],
      legs: [
        { knee: [40, 79], foot: [40, 100] },
        { knee: [43, 79], foot: [45, 100] },
      ],
      gear: [
        { type: 'post', from: [102, 14], to: [102, 100] },
        { type: 'cable', from: [102, 16], to: [54, 27] },
        { type: 'dumbbell', at: [52, 26] },
      ],
    },
  },

  /* ===== 09 Gập tạ barbell ===== */
  'Barbell Curl': {
    start: {
      head: [48, 21],
      shoulder: [48, 33],
      hip: [46, 58],
      arms: [{ from: [48, 33], elbow: [48, 48], hand: [50, 66] }],
      legs: [
        { knee: [46, 79], foot: [46, 100] },
        { knee: [49, 79], foot: [51, 100] },
      ],
      gear: [{ type: 'plate', at: [50, 72], r: 9 }],
    },
    end: {
      head: [48, 21],
      shoulder: [48, 33],
      hip: [46, 58],
      arms: [{ from: [48, 33], elbow: [48, 48], hand: [56, 42] }],
      legs: [
        { knee: [46, 79], foot: [46, 100] },
        { knee: [49, 79], foot: [51, 100] },
      ],
      gear: [{ type: 'plate', at: [58, 36], r: 9 }],
    },
  },

  /* ===== 10 Ép tạ qua đầu ===== */
  'Overhead Press': {
    start: {
      head: [46, 21],
      shoulder: [46, 33],
      hip: [44, 58],
      arms: [{ from: [46, 33], elbow: [56, 42], hand: [58, 30] }],
      legs: [
        { knee: [44, 79], foot: [44, 100] },
        { knee: [47, 79], foot: [49, 100] },
      ],
      gear: [{ type: 'plate', at: [58, 26], r: 7 }],
    },
    end: {
      head: [46, 21],
      shoulder: [46, 33],
      hip: [44, 58],
      arms: [{ from: [46, 33], elbow: [50, 22], hand: [52, 10] }],
      legs: [
        { knee: [44, 79], foot: [44, 100] },
        { knee: [47, 79], foot: [49, 100] },
      ],
      gear: [{ type: 'plate', at: [52, 6], r: 6 }],
    },
  },

  /* ===== 11 Nép tạ sang bên (front view) ===== */
  'Lateral Raise': {
    start: {
      head: [56, 20],
      shoulder: [56, 34],
      hip: [56, 58],
      shoulderLine: [
        [44, 34],
        [68, 34],
      ],
      arms: [
        { from: [44, 34], elbow: [41, 48], hand: [40, 64] },
        { from: [68, 34], elbow: [71, 48], hand: [72, 64] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [40, 66] },
        { type: 'dumbbell', at: [72, 66] },
      ],
    },
    end: {
      head: [56, 20],
      shoulder: [56, 34],
      hip: [56, 58],
      shoulderLine: [
        [44, 34],
        [68, 34],
      ],
      arms: [
        { from: [44, 34], elbow: [30, 36], hand: [16, 34] },
        { from: [68, 34], elbow: [82, 36], hand: [96, 34] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [16, 34] },
        { type: 'dumbbell', at: [96, 34] },
      ],
    },
  },

  /* ===== 12 Đẩy tạ ngược (front view gập hông) ===== */
  'Rear Delt Fly': {
    start: {
      head: [56, 46],
      shoulder: [56, 56],
      hip: [56, 74],
      shoulderLine: [
        [44, 56],
        [68, 56],
      ],
      arms: [
        { from: [44, 56], elbow: [42, 70], hand: [41, 84] },
        { from: [68, 56], elbow: [70, 70], hand: [71, 84] },
      ],
      legs: [
        { knee: [50, 88], foot: [48, 100] },
        { knee: [62, 88], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [41, 86] },
        { type: 'dumbbell', at: [71, 86] },
      ],
    },
    end: {
      head: [56, 46],
      shoulder: [56, 56],
      hip: [56, 74],
      shoulderLine: [
        [44, 56],
        [68, 56],
      ],
      arms: [
        { from: [44, 56], elbow: [28, 54], hand: [14, 52] },
        { from: [68, 56], elbow: [84, 54], hand: [98, 52] },
      ],
      legs: [
        { knee: [50, 88], foot: [48, 100] },
        { knee: [62, 88], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [14, 52] },
        { type: 'dumbbell', at: [98, 52] },
      ],
    },
  },

  /* ===== 13 Giơ vai (front view) ===== */
  'Dumbbell Shrug': {
    start: {
      head: [56, 22],
      shoulder: [56, 36],
      hip: [56, 58],
      shoulderLine: [
        [44, 36],
        [68, 36],
      ],
      arms: [
        { from: [44, 36], elbow: [41, 50], hand: [40, 66] },
        { from: [68, 36], elbow: [71, 50], hand: [72, 66] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [40, 68] },
        { type: 'dumbbell', at: [72, 68] },
      ],
    },
    end: {
      head: [56, 20],
      shoulder: [56, 30],
      hip: [56, 58],
      shoulderLine: [
        [44, 30],
        [68, 30],
      ],
      arms: [
        { from: [44, 30], elbow: [41, 44], hand: [40, 62] },
        { from: [68, 30], elbow: [71, 44], hand: [72, 62] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [40, 64] },
        { type: 'dumbbell', at: [72, 64] },
      ],
    },
  },

  /* ===== 14 Squat ===== */
  'Barbell Back Squat': {
    start: {
      head: [56, 44],
      shoulder: [48, 52],
      hip: [42, 76],
      arms: [{ from: [48, 52], elbow: [58, 58], hand: [54, 52] }],
      legs: [
        { knee: [60, 86], foot: [42, 100] },
        { knee: [58, 88], foot: [46, 100] },
      ],
      gear: [{ type: 'plate', at: [42, 50], r: 9 }],
    },
    end: {
      head: [54, 24],
      shoulder: [46, 34],
      hip: [42, 58],
      arms: [{ from: [46, 34], elbow: [56, 42], hand: [54, 36] }],
      legs: [
        { knee: [42, 79], foot: [42, 100] },
        { knee: [46, 79], foot: [48, 100] },
      ],
      gear: [{ type: 'plate', at: [38, 34], r: 9 }],
    },
  },

  /* ===== 15 Kéo tạ RDL ===== */
  'Romanian Deadlift': {
    start: {
      head: [50, 20],
      shoulder: [44, 30],
      hip: [38, 56],
      arms: [{ from: [44, 30], elbow: [46, 50], hand: [48, 68] }],
      legs: [
        { knee: [34, 80], foot: [30, 100] },
        { knee: [38, 82], foot: [36, 100] },
      ],
      gear: [{ type: 'plate', at: [48, 74], r: 11 }],
    },
    end: {
      head: [66, 40],
      shoulder: [56, 46],
      hip: [36, 58],
      arms: [{ from: [56, 46], elbow: [57, 64], hand: [56, 82] }],
      legs: [
        { knee: [34, 78], foot: [30, 100] },
        { knee: [38, 80], foot: [36, 100] },
      ],
      gear: [{ type: 'plate', at: [56, 88], r: 11 }],
    },
  },

  /* ===== 16 Đẩy chân máy ===== */
  'Leg Press': {
    start: {
      head: [86, 44],
      shoulder: [78, 54],
      hip: [60, 80],
      arms: [{ from: [78, 54], elbow: [70, 66], hand: [62, 72] }],
      legs: [
        { knee: [44, 76], foot: [28, 68] },
        { knee: [44, 80], foot: [28, 72] },
      ],
      gear: [
        { type: 'bench', from: [88, 50], to: [54, 84], legs: true },
        { type: 'beam', from: [50, 96], to: [100, 96] },
        { type: 'box', x: 22, y: 54, w: 8, h: 38 },
      ],
    },
    end: {
      head: [86, 44],
      shoulder: [78, 54],
      hip: [60, 80],
      arms: [{ from: [78, 54], elbow: [70, 66], hand: [62, 72] }],
      legs: [
        { knee: [38, 66], foot: [22, 58] },
        { knee: [38, 70], foot: [22, 62] },
      ],
      gear: [
        { type: 'bench', from: [88, 50], to: [54, 84], legs: true },
        { type: 'beam', from: [50, 96], to: [100, 96] },
        { type: 'box', x: 14, y: 42, w: 8, h: 38 },
      ],
    },
  },

  /* ===== 17 Đi chùng tạ ===== */
  'Walking Lunge': {
    start: {
      head: [48, 22],
      shoulder: [48, 34],
      hip: [48, 58],
      arms: [{ from: [48, 34], elbow: [54, 46], hand: [52, 62] }],
      legs: [
        { knee: [64, 80], foot: [62, 100] },
        { knee: [36, 82], foot: [24, 96] },
      ],
      gear: [{ type: 'dumbbell', at: [52, 64] }],
    },
    end: {
      head: [48, 22],
      shoulder: [48, 32],
      hip: [48, 56],
      arms: [{ from: [48, 32], elbow: [54, 44], hand: [52, 60] }],
      legs: [
        { knee: [50, 78], foot: [50, 100] },
        { knee: [46, 78], foot: [34, 96] },
      ],
      gear: [{ type: 'dumbbell', at: [52, 62] }],
    },
  },

  /* ===== 18 Gập bụng treo ===== */
  'Hanging Leg Raise': {
    start: {
      head: [56, 24],
      shoulder: [56, 34],
      hip: [56, 60],
      arms: [{ from: [56, 34], elbow: [56, 22], hand: [56, 10] }],
      legs: [
        { knee: [56, 80], foot: [56, 100] },
        { knee: [59, 80], foot: [61, 100] },
      ],
      gear: [{ type: 'beam', from: [14, 8], to: [98, 8] }],
    },
    end: {
      head: [56, 24],
      shoulder: [56, 34],
      hip: [56, 60],
      arms: [{ from: [56, 34], elbow: [56, 22], hand: [56, 10] }],
      legs: [
        { knee: [76, 58], foot: [94, 56] },
        { knee: [76, 62], foot: [94, 60] },
      ],
      gear: [{ type: 'beam', from: [14, 8], to: [98, 8] }],
    },
  },

  /* ===== 20 Press Arnold (front view) ===== */
  'Arnold Press': {
    start: {
      head: [56, 20],
      shoulder: [56, 34],
      hip: [56, 58],
      shoulderLine: [
        [44, 34],
        [68, 34],
      ],
      arms: [
        { from: [44, 34], elbow: [44, 48], hand: [48, 42] },
        { from: [68, 34], elbow: [68, 48], hand: [64, 42] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [48, 42] },
        { type: 'dumbbell', at: [64, 42] },
      ],
    },
    end: {
      head: [56, 20],
      shoulder: [56, 34],
      hip: [56, 58],
      shoulderLine: [
        [44, 34],
        [68, 34],
      ],
      arms: [
        { from: [44, 34], elbow: [36, 20], hand: [32, 8] },
        { from: [68, 34], elbow: [80, 20], hand: [84, 8] },
      ],
      legs: [
        { knee: [50, 80], foot: [48, 100] },
        { knee: [62, 80], foot: [64, 100] },
      ],
      gear: [
        { type: 'dumbbell', at: [32, 8] },
        { type: 'dumbbell', at: [84, 8] },
      ],
    },
  },

  /* ===== 21 Kéo xà tạ ===== */
  'Weighted Pull-up': {
    start: {
      head: [54, 24],
      shoulder: [54, 34],
      hip: [54, 60],
      arms: [{ from: [54, 34], elbow: [54, 22], hand: [54, 10] }],
      legs: [
        { knee: [54, 80], foot: [54, 100] },
        { knee: [57, 80], foot: [59, 100] },
      ],
      gear: [
        { type: 'beam', from: [14, 8], to: [98, 8] },
        { type: 'plate', at: [66, 64], r: 7 },
      ],
    },
    end: {
      head: [54, 20],
      shoulder: [54, 30],
      hip: [54, 54],
      arms: [{ from: [54, 30], elbow: [66, 32], hand: [56, 10] }],
      legs: [
        { knee: [62, 74], foot: [56, 92] },
        { knee: [64, 76], foot: [60, 94] },
      ],
      gear: [
        { type: 'beam', from: [14, 8], to: [98, 8] },
        { type: 'plate', at: [66, 58], r: 7 },
      ],
    },
  },

  /* ===== 22 Kéo cáp ngồi ===== */
  'Seated Cable Row': {
    start: {
      head: [54, 42],
      shoulder: [56, 52],
      hip: [46, 78],
      arms: [{ from: [56, 52], elbow: [70, 58], hand: [84, 66] }],
      legs: [{ knee: [74, 84], foot: [92, 92] }],
      gear: [
        { type: 'bench', from: [38, 84], to: [72, 84], legs: true },
        { type: 'post', from: [104, 20], to: [104, 100] },
        { type: 'cable', from: [104, 68], to: [86, 66] },
        { type: 'dumbbell', at: [84, 66] },
      ],
    },
    end: {
      head: [54, 42],
      shoulder: [56, 52],
      hip: [46, 78],
      arms: [{ from: [56, 52], elbow: [74, 56], hand: [64, 60] }],
      legs: [{ knee: [74, 84], foot: [92, 92] }],
      gear: [
        { type: 'bench', from: [38, 84], to: [72, 84], legs: true },
        { type: 'post', from: [104, 20], to: [104, 100] },
        { type: 'cable', from: [104, 68], to: [66, 60] },
        { type: 'dumbbell', at: [64, 60] },
      ],
    },
  },

  /* ===== 23 Kéo tạ đơn một tay ===== */
  'One-arm Dumbbell Row': {
    start: {
      head: [42, 44],
      shoulder: [54, 52],
      hip: [78, 58],
      arms: [
        { from: [54, 52], elbow: [50, 64], hand: [46, 76] },
        { from: [54, 52], elbow: [60, 68], hand: [62, 84] },
      ],
      legs: [
        { knee: [78, 80], foot: [78, 100] },
        { knee: [82, 82], foot: [84, 100] },
      ],
      gear: [
        { type: 'bench', from: [14, 76], to: [64, 76], legs: true },
        { type: 'dumbbell', at: [62, 88] },
      ],
    },
    end: {
      head: [42, 44],
      shoulder: [54, 52],
      hip: [78, 58],
      arms: [
        { from: [54, 52], elbow: [50, 64], hand: [46, 76] },
        { from: [54, 52], elbow: [66, 66], hand: [74, 56] },
      ],
      legs: [
        { knee: [78, 80], foot: [78, 100] },
        { knee: [82, 82], foot: [84, 100] },
      ],
      gear: [
        { type: 'bench', from: [14, 76], to: [64, 76], legs: true },
        { type: 'dumbbell', at: [76, 52] },
      ],
    },
  },

  /* ===== 24 Gập tạ đơn nghiêng ===== */
  'Incline Dumbbell Curl': {
    start: {
      head: [82, 48],
      shoulder: [70, 58],
      hip: [40, 84],
      arms: [{ from: [70, 58], elbow: [66, 74], hand: [64, 90] }],
      legs: [{ knee: [24, 92], foot: [28, 100] }],
      gear: [
        { type: 'bench', from: [86, 54], to: [32, 90], legs: true },
        { type: 'dumbbell', at: [64, 94] },
      ],
    },
    end: {
      head: [82, 48],
      shoulder: [70, 58],
      hip: [40, 84],
      arms: [{ from: [70, 58], elbow: [66, 74], hand: [74, 62] }],
      legs: [{ knee: [24, 92], foot: [28, 100] }],
      gear: [
        { type: 'bench', from: [86, 54], to: [32, 90], legs: true },
        { type: 'dumbbell', at: [76, 58] },
      ],
    },
  },

  /* ===== 25 Đẩy tạ sau đầu ===== */
  'Overhead Triceps Extension': {
    start: {
      head: [50, 23],
      shoulder: [50, 34],
      hip: [48, 58],
      arms: [{ from: [50, 34], elbow: [42, 24], hand: [50, 12] }],
      legs: [
        { knee: [48, 79], foot: [48, 100] },
        { knee: [51, 79], foot: [53, 100] },
      ],
      gear: [{ type: 'dumbbell', at: [50, 8] }],
    },
    end: {
      head: [50, 23],
      shoulder: [50, 34],
      hip: [48, 58],
      arms: [{ from: [50, 34], elbow: [52, 20], hand: [50, 8] }],
      legs: [
        { knee: [48, 79], foot: [48, 100] },
        { knee: [51, 79], foot: [53, 100] },
      ],
      gear: [{ type: 'dumbbell', at: [50, 4] }],
    },
  },
};

/** Bài tập cùng động tác nhưng tên khác — dùng chung một hình */
const ALIASES: Record<string, string> = {
  'Standing Overhead Press': 'Overhead Press',
  'Weighted Dips': 'Parallel Bar Dips',
};

/** Tra cứu hình minh hoạ theo tên tiếng Anh của bài tập. */
export function getExerciseFigure(en: string): ExerciseFigureData | undefined {
  const key = ALIASES[en] ?? en;
  const figure = FIGURES[key];
  return figure && figure.start ? figure : undefined;
}
