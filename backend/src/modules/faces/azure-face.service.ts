import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Nhãn kính Azure Face trả về (đã chuẩn hoá về camelCase) */
export type GlassesType = 'noGlasses' | 'readingGlasses' | 'sunglasses' | 'swimmingGoggles';

export interface GlassesCheckResult {
  /**
   * false = KHÔNG kiểm tra được (chưa cấu hình, Azure lỗi, mạng hỏng...).
   * Khi false, client KHÔNG được chặn người dùng — xem `note`.
   */
  available: boolean;
  /** Chỉ có ý nghĩa khi available = true */
  hasGlasses: boolean;
  glasses: GlassesType | null;
  /** Điểm tin cậy của phụ kiện "glasses" (0..1) nếu Azure trả về */
  confidence: number | null;
  /** Lý do không kiểm tra được — để hiển thị/ghi log, không phải thông báo cho người dùng */
  note?: string;
}

/**
 * AzureFaceService — kiểm tra "người dùng có đeo kính không" bằng Azure AI Vision Face.
 *
 * ── VÌ SAO CẦN SERVICE NÀY ────────────────────────────────────────────────
 * `@vladmandic/human` (model nhận diện khuôn mặt chạy trong trình duyệt) KHÔNG có
 * model phân loại kính. Bật `gear` không giúp ích — đó là GEAR Predictor (đoán
 * tuổi/giới tính/chủng tộc), không liên quan kính. Vì vậy muốn chặn kính thật
 * sẵn phải gọi một mô hình được huấn luyện riêng cho việc này; Azure Face là
 * lựa chọn khả thi vì:
 *   - Thuộc tính `glasses` là của thao tác **Detect** → KHÔNG thuộc nhóm
 *     "Limited Access" (chỉ Identify/Verify mới cần đăng ký & duyệt).
 *   - Có tier F0 miễn phí 1.000 lượt/tháng.
 *
 * ── RÀNG BUỘC BẮT BUỘC ────────────────────────────────────────────────────
 * 1. `detection_01` là model DUY NHẤT trả về `glasses`. Mặc định của Azure là
 *    `detection_03` — model này chỉ hỗ trợ `mask` + `qualityForRecognition`, nên
 *    quên tham số này sẽ luôn nhận về thiếu trường `glasses`. Vì vậy ghim cứng.
 * 2. Ảnh KHÔNG được lưu ở phía chúng ta. Theo tài liệu Azure, ảnh chỉ "được
 *    giữ trong bộ nhớ khi xử lý" — nhưng nó vẫn đi qua máy chủ Microsoft, tức
 *    là dữ liệu sinh trắc học rời khỏi máy. Vì vậy:
 *      - Văn bản đồng ý (NĐ13/2023) ở giao diện PHẢI nói rõ điều này.
 *      - Chỉ gọi khi ĐĂNG KÝ khuôn mặt (1 lần), không gọi khi check-in.
 *
 * ── HỢP ĐỒNG FAIL-OPEN ────────────────────────────────────────────────────
 * `detect()` KHÔNG ném lỗi. Mọi sự cố (chưa cấu hình, hết hạn key, Azure 503,
 * mất mạng, ảnh quá nhỏ) đều trả `available: false`. Lý do: không được vì lý do
 * dịch vụ của bên thứ ba mà từ chối đăng ký khuôn mặt cho hội viên — đăng ký vẫn
 * hoạt động bình thường, chỉ là bỏ qua bước kiểm tra kính.
 */
@Injectable()
export class AzureFaceService implements OnModuleInit {
  private readonly logger = new Logger('AzureFaceService');
  private endpoint: string | null = null;
  private key: string | null = null;
  /** Bỏ tắt hoàn toàn bằng env mà không cần xoá key (vd: demo trước giáo viên) */
  private enabled = true;
  private lastConfigError: string | null = null;
  /** Số lần lỗi liên tiếp — tránh spam log mỗi nhịp quét */
  private consecutiveFailures = 0;

  private static readonly TIMEOUT_MS = 8000;
  /** 5 lỗi liên tiếp thì tự khoá tạm để khỏi gọi lặp, đặt lại khi khởi động server */
  private static readonly FAILURE_CIRCUIT_THRESHOLD = 5;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.enabled = this.config.get<string>('FACE_GLASSES_CHECK') !== 'false';
    const rawEndpoint = this.config.get<string>('AZURE_FACE_ENDPOINT')?.trim();
    const key = this.config.get<string>('AZURE_FACE_KEY')?.trim();

    if (!this.enabled) {
      this.logger.warn(
        'Kiểm tra kính đang TẮT theo FACE_GLASSES_CHECK=false — đăng ký khuôn mặt sẽ không chặn kính.',
      );
      return;
    }
    if (!rawEndpoint || !key) {
      this.lastConfigError = !rawEndpoint
        ? 'thiếu AZURE_FACE_ENDPOINT'
        : 'thiếu AZURE_FACE_KEY';
      this.logger.warn(
        `Chưa cấu hình Azure Face (${this.lastConfigError}) — bỏ qua bước kiểm tra kính, đăng ký khuôn mặt vẫn chạy bình thường.`,
      );
      return;
    }

    // Chịu cả endpoint có/không dấu / ở cuối
    this.endpoint = rawEndpoint.replace(/\/+$/, '');
    this.key = key;
    this.logger.log(`Đã cấu hình Azure Face để kiểm tra kính (${this.endpoint})`);
  }

  /** true = đủ cấu hình để thực sự gọi Azure */
  isConfigured(): boolean {
    return this.enabled && this.endpoint !== null && this.key !== null;
  }

  /**
   * Kiểm tra 1 ảnh khuôn mặt (data URL) có đeo kính hay không.
   * Luôn trả về kết quả — không ném lỗi (xem "HỢP ĐỒNG FAIL-OPEN" ở trên).
   */
  async detect(imageData: string): Promise<GlassesCheckResult> {
    const skip = (note: string): GlassesCheckResult => ({
      available: false,
      hasGlasses: false,
      glasses: null,
      confidence: null,
      note,
    });

    if (!this.isConfigured()) return skip(this.lastConfigError ?? 'chưa cấu hình');
    if (this.consecutiveFailures >= AzureFaceService.FAILURE_CIRCUIT_THRESHOLD) {
      return skip('tạm khoá sau nhiều lỗi liên tiếp');
    }

    const bytes = this.dataUrlToBytes(imageData);
    if (!bytes) return skip('ảnh không đọc được (phải là data URL base64)');

    try {
      const res = await fetch(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        `${this.endpoint!}/face/v1.0/detect?returnFaceAttributes=glasses,accessories&detectionModel=detection_01`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.key!,
            'Content-Type': 'application/octet-stream',
          },
          body: bytes,
          signal: AbortSignal.timeout(AzureFaceService.TIMEOUT_MS),
        },
      );

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`HTTP ${res.status} — ${detail}`);
      }

      const faces = (await res.json()) as AzureDetectFace[];
      const glasses = this.pickGlasses(faces);
      if (!glasses) return skip('Azure không trả về khuôn mặt nào');

      this.consecutiveFailures = 0;
      return glasses;
    } catch (err) {
      this.consecutiveFailures += 1;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Kiểm tra kính thất bại (lần ${this.consecutiveFailures}): ${message}. Bỏ qua kiểm tra, không chặn người dùng.`,
      );
      return skip(message);
    }
  }

  /**
   * Chọn kết quả từ danh sách mặt Azure trả về.
   * Nếu không có mặt nào → null (coi như không kiểm tra được).
   */
  private pickGlasses(faces: AzureDetectFace[]): GlassesCheckResult | null {
    if (!Array.isArray(faces) || faces.length === 0) return null;

    // Ưu tiên mặt lớn nhất — tránh lấy nhầm mặt người nền
    const sorted = [...faces].sort(
      (a, b) => (b.faceRectangle?.width ?? 0) * (b.faceRectangle?.height ?? 0) -
        (a.faceRectangle?.width ?? 0) * (a.faceRectangle?.height ?? 0),
    );
    const face = sorted[0];
    const attrs = face.faceAttributes;
    if (!attrs) return null;

    // 1) `glasses`: noGlasses | readingGlasses | sunglasses | swimmingGoggles
    //    Azure trả về key khác casing giữa doc lẫn response thật → so không phân biệt.
    const raw = typeof attrs.glasses === 'string' ? attrs.glasses.toLowerCase() : '';
    const known: GlassesType[] = [
      'noGlasses'.toLowerCase() as GlassesType,
      'readingGlasses' as GlassesType,
      'sunglasses' as GlassesType,
      'swimmingGoggles' as GlassesType,
    ];
    const type = known.find((k) => k.toLowerCase() === raw) ?? null;

    // 2) `accessories`: [{type:'glasses', confidence: 0..1}] — tín hiệu dự phòng khi
    //    thiếu trường `glasses`, và là nguồn confidence cụ thể hơn khi có đủ cả hai.
    const accessory = Array.isArray(attrs.accessories)
      ? attrs.accessories.find((a) => (a?.type ?? '').toLowerCase() === 'glasses')
      : undefined;
    // Trường `glasses` là kết luận dạng nhãn nên không kèm điểm → coi là chắc chắn (1).
    const confidence =
      typeof accessory?.confidence === 'number' ? accessory.confidence : type ? 1 : null;

    if (type) {
      return {
        available: true,
        hasGlasses: type.toLowerCase() !== 'noglasses',
        glasses: type,
        confidence,
      };
    }

    // Không có trường `glasses` nhưng vẫn biết chắc qua `accessories`
    if (accessory) {
      const has = accessory.confidence >= 0.5;
      return { available: true, hasGlasses: has, glasses: null, confidence: accessory.confidence };
    }

    return null;
  }

  /** `data:image/jpeg;base64,AAAA` → byte thô để gửi lên Azure */
  private dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> | null {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return null;
    const b64 = dataUrl.slice(comma + 1);
    try {
      const buf = Buffer.from(b64, 'base64');
      if (buf.length === 0) return null;
      // Buffer là lớp con của Uint8Array, nhưng kiểu của @types/node không khớp
      // với BodyInit của lib.dom → cấp phát ArrayBuffer tường minh rồi chép qua.
      const out = new Uint8Array(buf.byteLength);
      out.set(buf);
      return out;
    } catch {
      return null;
    }
  }
}

/** Chỉ khai báo đúng phần response dùng — không cần map hết cấu trúc Azure */
interface AzureDetectFace {
  faceRectangle?: { top?: number; left?: number; width?: number; height?: number };
  faceAttributes?: {
    glasses?: string;
    accessories?: Array<{ type?: string; confidence?: number }>;
  };
}
