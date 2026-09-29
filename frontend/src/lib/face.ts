import type { Config, Human } from '@vladmandic/human';

/**
 * Tải model AI khuôn mặt (@vladmandic/human) — chạy hoàn toàn phía TRÌNH DUYỆT.
 *
 * - Model tự tải từ CDN + cache vào IndexedDB (lần đầu ~7MB, các lần sau chạy offline).
 * - Ảnh/video KHÔNG bao giờ rời khỏi máy — server chỉ nhận vector embedding.
 * - Singleton: các trang dùng chung 1 instance, model chỉ tải 1 lần mỗi phiên.
 */

const MODEL_BASE = 'https://vladmandic.github.io/human-models/models';

/** Chặn bắt mẫu khi model anti-spoof chấm điểm "không phải người thật" */
export const ANTI_SPOOF_MIN = 0.3;

const humanConfig: Partial<Config> = {
  modelBasePath: MODEL_BASE,
  cacheModels: true,
  debug: false,
  async: true,
  warmup: 'none',
  face: {
    detector: { enabled: true, maxDetected: 1, minConfidence: 0.5, rotation: true },
    description: { enabled: true, minConfidence: 0.5 },
    mesh: { enabled: false },
    attention: { enabled: false },
    iris: { enabled: false },
    emotion: { enabled: false },
    gear: { enabled: false },
    antispoof: { enabled: true },
    liveness: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  segmentation: { enabled: false },
};

let humanPromise: Promise<Human> | null = null;

/** Tải (hoặc tái sử dụng) instance Human đã khởi tạo. Chỉ gọi phía client. */
export function loadHuman(): Promise<Human> {
  if (typeof window === 'undefined') {
    throw new Error('loadHuman() chỉ chạy trên trình duyệt (không dùng cho SSR).');
  }
  if (!humanPromise) {
    humanPromise = (async () => {
      // Import subpath bản ESM/browser — xem giải thích trong src/types/human-esm.d.ts
      const mod = await import('@vladmandic/human/dist/human.esm.js');
      const HumanCtor = mod.default ?? mod.Human;
      const human = new HumanCtor(humanConfig);
      await human.load();
      return human;
    })();
    // Lần tải lỗi → cho phép thử lại ở lần gọi sau (CDN chập chờn...)
    humanPromise.catch(() => {
      humanPromise = null;
    });
  }
  return humanPromise;
}

/** Làm tròn vector 5 chữ số thập phân — gọn payload, độ chính xác thừa cho cosine */
export function roundEmbedding(embedding: number[]): number[] {
  return embedding.map((v) => Number(v.toFixed(5)));
}
