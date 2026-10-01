'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CameraOff,
  CheckCircle2,
  Loader2,
  ScanFace,
  ShieldAlert,
  AlertTriangle,
  Glasses,
} from 'lucide-react';
import type { FaceResult } from '@vladmandic/human';
import { cn } from '@/lib/utils';
import { ANTI_SPOOF_MIN, loadHuman, roundEmbedding } from '@/lib/face';
import apiClient from '@/lib/axios';

/**
 * FaceScanner — camera + model AI nhận diện khuôn mặt, chạy 100% trong trình duyệt.
 *
 * - mode='enroll' : chụp liên tiếp `target` mẫu (kèm gợi ý nghiêng mặt), trả qua onSamples.
 * - mode='verify' : bắt 1 khuôn mặt ổn định rồi trả qua onCapture (gọi API check-in).
 * Dừng quét + tắt camera khi xong; phụ huynh (trang cha) remount bằng `key` để quét lại.
 */

export type FaceScannerStatus = 'loading' | 'searching' | 'captured' | 'done' | 'error';

const POSE_HINTS = [
  'Nhìn thẳng vào camera',
  'Nghiêng đầu nhẹ sang trái',
  'Nghiêng đầu nhẹ sang phải',
  'Ngẩng đầu lên một chút',
  'Hạ cằm xuống một chút',
];

const STABLE_MS = 600; // giữ khuôn mặt ổn định trước khi bắt mẫu
const CAPTURE_COOLDOWN_MS = 900; // nghỉ giữa 2 mẫu khi đăng ký
const TICK_MS = 150; // nhịp quét

// ---------------------------------------------------------------------------
// Ngưỡng chất lượng khung hình.
//
// Trước đây chỉ kiểm tra `score >= 0.5` — quá dễ, nên hệ thống chấp nhận cả mặt
// mờ, mặt nhỏ (đứng xa), mặt lệch khung và quét trong bóng tối. Kết quả là tạo
// được "5 mẫu" nhưng vector/ảnh vô dùng, check-in sau đó chắc chắn trượt.
// Các ngưỡng dưới đây chặn những trường hợp đó. Ghi chú: CHƯA hiệu chỉnh bằng
// camera thật (máy QA bị chặn quyền camera) — sửa ở đây khi test với người thật.
// ---------------------------------------------------------------------------
const MIN_FACE_SCORE = 0.6; // điểm phát hiện tối thiểu (nâng từ 0.5)
/** Mặt phải chiếm ít nhất 28% bề rộng khung — chặn trường hợp đứng quá xa, mặt nhỏ như nút */
const MIN_FACE_RATIO = 0.28;
/** Mặt chiếm > 92% bề rộng khung = áp sát ống kính, ảnh méo — cũng loại */
const MAX_FACE_RATIO = 0.92;
/** Độ sáng trung bình khung hình (0–255). Dưới 38 quá tối, trên 240 quá chói. */
const MIN_LUMA = 38;
const MAX_LUMA = 240;
/** Tâm mặt phải nằm trong vùng lệch tối đa so với giữa khung (theo tỉ lệ) */
const CENTER_TOLERANCE_X = 0.18;
const CENTER_TOLERANCE_Y = 0.2;
/** Bề rộng ảnh tham chiếu sau khi CẮT vùng mặt — 320px đủ nét để đối chiếu, ~15–25KB */
const SNAPSHOT_WIDTH = 320;
/** Nới khung ảnh ra ngoài vùng mặt 35% mỗi phía để lấy trán + cằm + một phần tóc */
const SNAPSHOT_PADDING = 0.35;

/**
 * Chụp ảnh THAM CHIẾU đúng vùng khuôn mặt.
 *
 * `box` của @vladmandic/human là `[x, y, width, height]` tính bằng PIXEL của
 * ảnh đầu vào (xem src/face/faceboxes.ts:41-46) — tức toạ độ của khung hình video.
 * Không có box (model chưa trả về) thì lùi về chụp toàn khung như bản cũ.
 */
function captureFaceImage(video: HTMLVideoElement | null, box?: FaceResult['box']): string | null {
  if (!video || !video.videoWidth) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;
  if (box && box.length === 4) {
    const [bx, by, bw, bh] = box;
    // box rác (0 hoặc âm) → giữ nguyên toàn khung
    if (bw > 8 && bh > 8) {
      const pad = Math.max(bw, bh) * SNAPSHOT_PADDING;
      sx = Math.max(0, bx - pad);
      sy = Math.max(0, by - pad);
      sw = Math.min(vw - sx, bw + pad * 2);
      sh = Math.min(vh - sy, bh + pad * 2);
    }
  }

  const scale = Math.min(1, SNAPSHOT_WIDTH / sw);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  // Vẽ đúng vùng đã cắt: nguồn (sx, sy, sw, sh) → đích toàn khung canvas
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

/**
 * Chụp TOÀN KHUNG video (dùng riêng cho bước kiểm tra kính).
 *
 * Cố ý KHÔNG dùng ảnh đã cắt vùng mặt như `captureFaceImage`: Azure yêu cầu mặt
 * tối thiểu 36px và khuyến nghị ≥200px để phân loại thuộc tính cho đáng tin.
 * Ảnh cắt chỉ rộng 320px nên phần mặt chỉ còn ~160–190px — sát ngưỡng khuyến nghị.
 * Toàn khung 640px cho mặt nhiều diện tích hơn và vẫn chỉ vài chục KB.
 */
function captureFrame(video: HTMLVideoElement | null): string | null {
  if (!video || !video.videoWidth) return null;
  const scale = Math.min(1, GLASSES_FRAME_WIDTH / video.videoWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
}

/** Bề rộng ảnh gửi kiểm tra kính — Azure khuyến nghị mặt ≥200px, 640px là cả khung */
const GLASSES_FRAME_WIDTH = 640;

// ---------------------------------------------------------------------------
// Kiểm tra đeo kính (Azure AI Vision — xem backend/src/modules/faces/azure-face.service.ts)
//
// CHỈ chạy lúc ĐĂNG KÝ khuôn mặt, đúng 1 lần mỗi phiên quét. Không chạy khi
// check-in: chặn hội viên đeo kính lúc ghi lượt tập là trải nghiệm tệ hơn giá trị.
//
// `@vladmandic/human` không có model kính (bật `gear` là đoán tuổi/giới/chủng tộc,
// không liên quan) nên buộc phải gọi dịch vụ ngoài. Vì vậy đây là bước DUY NHẤT
// trong luồng khuôn mặt mà ảnh rời khỏi máy — vì vậy văn bản đồng ý ở giao diện
// buộc phải nêu rõ điều này.
//
// HỢP ĐỒNG FAIL-OPEN: mọi lỗi (chưa cấu hình, hết hạn key, mạng hỏng) đều trả
// `null` = KHÔNG chặn người dùng. Không được để lỗi dịch vụ bên thứ ba chặn
// việc đăng ký khuôn mặt của hội viên.
// ---------------------------------------------------------------------------

/** Nhãn kính Azure trả về */
type GlassesType = 'noGlasses' | 'readingGlasses' | 'sunglasses' | 'swimmingGoggles';

interface GlassesCheckResult {
  available: boolean;
  hasGlasses: boolean;
  glasses: GlassesType | null;
  confidence: number | null;
}

const GLASSES_MESSAGES: Record<GlassesType, string> = {
  sunglasses: 'Vui lòng tháo kính râm trước khi đăng ký khuôn mặt',
  swimmingGoggles: 'Vui lòng tháo kính bơm trước khi đăng ký khuôn mặt',
  readingGlasses: 'Vui lòng tháo kính trước khi đăng ký khuôn mặt',
  noGlasses: '',
};

/** Nghỉ 4s giữa 2 lần thử lại khi người dùng còn đeo kính — tránh dội Azure mỗi nhịp quét */
const GLASSES_RETRY_MS = 4000;

/**
 * Backend báo dịch vụ chưa dùng được (chưa cấu hình key) → nhớ lại ở module scope
 * để những lần mở scanner sau khỏi gọi vô ích. `null` = chưa biết, cứ thử.
 */
let glassesServiceUsable: boolean | null = null;

/**
 * Gọi backend kiểm tra kính. Trả `null` nghĩa là KHÔNG kiểm tra được → cho qua.
 * Chỉ dùng kết quả khi `available === true`; khi đó `hasGlasses` mới đáng tin.
 */
async function requestGlassesCheck(imageData: string): Promise<GlassesCheckResult | null> {
  if (glassesServiceUsable === false) return null;
  try {
    const { data } = await apiClient.post<GlassesCheckResult>('/faces/check-glasses', {
      imageData,
    });
    if (!data?.available) {
      glassesServiceUsable = false;
      return null;
    }
    glassesServiceUsable = true;
    return data;
  } catch {
    // Lỗi mạng / 401 / backend chết — cũng coi như không kiểm tra được
    return null;
  }
}

/** Độ sáng trung bình khung hình (0–255) — dùng canvas 32×24 nên rất rẻ */
function meanLuma(video: HTMLVideoElement | null): number | null {
  if (!video || !video.videoWidth) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 24;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, 32, 24);
  try {
    const { data } = ctx.getImageData(0, 0, 32, 24);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return sum / (data.length / 4);
  } catch {
    return null;
  }
}

/** Lý do khung hình bị loại, hoặc null nếu ổn */
type QualityIssue = 'score' | 'too_far' | 'too_close' | 'off_center' | 'dark' | 'glare';

/**
 * Kiểm tra chất lượng khung hình trước khi bắt mẫu.
 *
 * `strict` = đang ĐĂNG KÝ (bước 1 lần, chờ thêm được) → kiểm tra đầy đủ kể cả
 * vị trí và độ sáng. Khi CHỤP CHECK-IN (đứng ngoài cửa, vội) chỉ kiểm tra điểm +
 * khoảng cách để không chặn oát khách.
 */
function checkFaceQuality(
  face: FaceResult,
  video: HTMLVideoElement | null,
  strict: boolean,
): QualityIssue | null {
  if (face.score < MIN_FACE_SCORE) return 'score';

  const box = face.box;
  if (box && box.length === 4 && video?.videoWidth) {
    const [bx, by, bw, bh] = box;
    const ratioW = bw / video.videoWidth;
    if (ratioW < MIN_FACE_RATIO) return 'too_far';
    if (ratioW > MAX_FACE_RATIO) return 'too_close';
    if (strict) {
      const cx = (bx + bw / 2) / video.videoWidth;
      const cy = (by + bh / 2) / video.videoHeight;
      if (Math.abs(cx - 0.5) > CENTER_TOLERANCE_X || Math.abs(cy - 0.5) > CENTER_TOLERANCE_Y) {
        return 'off_center';
      }
    }
  }

  if (strict) {
    const luma = meanLuma(video);
    if (luma !== null) {
      if (luma < MIN_LUMA) return 'dark';
      if (luma > MAX_LUMA) return 'glare';
    }
  }
  return null;
}

/** Nội dung nhắc cho từng lỗi chất lượng */
const QUALITY_MESSAGES: Record<QualityIssue, string> = {
  score: 'Mặt chưa rõ nét — hãy nhìn thẳng vào camera, giữ khuôn mặt trong khung',
  too_far: 'Mặt quá nhỏ — hãy đứng gần camera hơn một chút',
  too_close: 'Mặt quá sát camera — lùi lại cho vừa khung',
  off_center: 'Hãy đưa khuôn mặt vào giữa khung',
  dark: 'Chỗ quá tối — cần thêm ánh sáng để quét rõ mặt',
  glare: 'Ánh sáng quá chói — tránh đèn mạnh chiếu thẳng vào mặt',
};

interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  /** Số mẫu cần chụp (mode=enroll), mặc định 5 */
  target?: number;
  /** mode=enroll: gọi mỗi khi thêm 1 mẫu mới (kèm ảnh JPEG data URL nếu withImage) */
  onSamples?: (samples: number[][], imageData: string | null) => void;
  /** mode=verify: gọi 1 lần khi bắt được khuôn mặt ổn định */
  onCapture?: (embedding: number[]) => void;
  /** mode=enroll: chụp thêm 1 ảnh JPEG ở mẫu đầu để lưu làm ảnh tham chiếu */
  withImage?: boolean;
  /** Lỗi chặn tiếp tục (chặn quyền camera...) — trang cha toast */
  onError?: (message: string) => void;
  className?: string;
}

/** Liệt kê deviceId của các camera (videoinput) trên máy — dùng để thử từng camera khi camera mặc định chết */
async function listVideoDeviceIds(): Promise<string[]> {
  try {
    const devices = await navigator.mediaDevices?.enumerateDevices?.();
    if (!devices) return [];
    const ids = devices
      .filter((d) => d.kind === 'videoinput')
      .map((d) => d.deviceId)
      .filter((id, i, arr) => !!id && arr.indexOf(id) === i);
    return ids;
  } catch {
    return [];
  }
}

async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    throw new Error('Camera API is unavailable. Use localhost or HTTPS and allow camera access.');
  }

  const deviceIds = await listVideoDeviceIds();
  const constraints: MediaTrackConstraints[] = [
    ...deviceIds.map((deviceId) => ({
      deviceId: { exact: deviceId },
      width: { ideal: 640 },
      height: { ideal: 480 },
    })),
    { width: { ideal: 640 }, height: { ideal: 480 } },
  ];
  let lastError: unknown;

  for (const videoConstraints of constraints) {
    let stream: MediaStream | null = null;
    try {
      stream = await mediaDevices.getUserMedia({ audio: false, video: videoConstraints });
      video.srcObject = stream;
      await video.play();
      return stream;
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      lastError = err;
      const name = (err as { name?: string })?.name;
      if (
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        name === 'SecurityError'
      ) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error('No video input devices found.');
}

function cameraErrorMessage(err: unknown): string {
  const name = (err as { name?: string })?.name;
  const msg = String((err as { message?: string })?.message ?? '');
  const isPermission =
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    msg.includes('NotAllowedError') ||
    msg.includes('PermissionDeniedError');
  if (isPermission) {
    return 'Bạn đã chặn quyền truy cập camera. Hãy cho phép camera trong trình duyệt rồi thử lại.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Camera đang được ứng dụng khác sử dụng. Hãy tắt Windows Camera, Zoom hoặc Teams rồi thử lại.';
  }
  if (name === 'SecurityError' || msg.includes('secure context') || msg.includes('HTTPS')) {
    return 'Trình duyệt đang chặn camera. Hãy mở trang bằng localhost/HTTPS và cấp quyền camera.';
  }
  if (
    name === 'NotFoundError' ||
    name === 'OverconstrainedError' ||
    msg.includes('NotFoundError') ||
    msg.includes('OverconstrainedError') ||
    msg.includes('no devices')
  ) {
    return 'Không tìm thấy camera trên thiết bị này.';
  }
  return 'Không mở được camera. Vui lòng thử lại.';
}

export function FaceScanner({
  mode,
  target = 5,
  onSamples,
  onCapture,
  withImage = false,
  onError,
  className,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<FaceScannerStatus>('loading');
  const [detected, setDetected] = useState(false);
  const [spoofWarn, setSpoofWarn] = useState(false);
  const [samples, setSamples] = useState<number[][]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  /** Lý do chất lượng khung hình đang bị loại (null = ổn) */
  const [qualityIssue, setQualityIssue] = useState<QualityIssue | null>(null);
  /** Ảnh tham chiếu đã chụp — hiển thị xem trước để lễ tân/hội viên thấy rõ mặt */
  const [preview, setPreview] = useState<string | null>(null);
  /**
   * Kết quả kiểm tra kính: 'checking' = đang gọi, hoặc nhãn kính bị phát hiện.
   * null = chưa kiểm tra / đã đạt / không kiểm tra được (xem requestGlassesCheck).
   */
  const [glassesIssue, setGlassesIssue] = useState<'checking' | GlassesType | null>(null);

  // Refs để vòng quét đọc dữ liệu mới nhất mà không phải cài lại effect
  const samplesRef = useRef<number[][]>([]);
  const imageRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const stableSinceRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef(0);
  const targetRef = useRef(target);
  const isEnrollRef = useRef(mode === 'enroll');
  /** Đã kiểm tra kính và đạt (hoặc không kiểm tra được) → không gọi lại trong phiên quét */
  const glassesDoneRef = useRef(false);
  /** Đang có request kính bay → chặn gọi chồng từ nhiều nhịp quét */
  const glassesPendingRef = useRef(false);
  /** Mốc thời gian được thử lại kiểm tra kính (khi bị phát hiện đeo kính) */
  const glassesRetryAtRef = useRef(0);
  const callbacksRef = useRef({ mode, onSamples, onCapture, onError, withImage });

  useEffect(() => {
    callbacksRef.current = { mode, onSamples, onCapture, onError, withImage };
    isEnrollRef.current = mode === 'enroll';
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let humanInstance: Awaited<ReturnType<typeof loadHuman>> | null = null;
    const videoElement = videoRef.current;

    const handleFaces = (faces: FaceResult[]) => {
      const now = Date.now();
      const valid = (faces || []).filter(
        (f) =>
          f &&
          typeof f.score === 'number' &&
          f.score >= MIN_FACE_SCORE &&
          Array.isArray(f.embedding) &&
          f.embedding.length > 0,
      );
      if (valid.length === 0) {
        setDetected(false);
        stableSinceRef.current = null;
        return;
      }
      const face = valid[0];
      setDetected(true);

      // Anti-spoof: model chấm điểm "người thật" quá thấp → không bắt mẫu
      if (typeof face.real === 'number' && face.real < ANTI_SPOOF_MIN) {
        setSpoofWarn(true);
        setQualityIssue(null);
        stableSinceRef.current = null;
        return;
      }
      setSpoofWarn(false);

      // Chất lượng khung hình: chặn mặt mờ / quá xa / quá sát / lệch khung / quá tối
      const issue = checkFaceQuality(face, videoRef.current, isEnrollRef.current);
      setQualityIssue(issue);
      if (issue) {
        stableSinceRef.current = null;
        return;
      }

      if (Date.now() < cooldownUntilRef.current) return;

      // ── Kiểm tra đeo kính (chỉ lúc đăng ký, 1 lần) ──────────────────────
      // Chạy TRƯỚC bước bắt mẫu để ảnh tham chiếu và vector lưu vào hồ sơ luôn
      // là của khuôn mặt không che. Không chạy khi check-in (xem GLASSES_MESSAGES).
      if (isEnrollRef.current && !glassesDoneRef.current && !glassesPendingRef.current) {
        if (Date.now() < glassesRetryAtRef.current) return;

        const shot = captureFrame(videoRef.current);
        if (!shot) {
          // Không cắt được ảnh thì không có gì để gửi — bỏ qua bước kiểm tra.
          glassesDoneRef.current = true;
        } else {
          glassesPendingRef.current = true;
          setGlassesIssue('checking');
          void requestGlassesCheck(shot).then((result) => {
            glassesPendingRef.current = false;
            // Chặn chỉ khi thực sự phát hiện kính. Mọi trường hợp còn lại
            // (đạt, hoặc không kiểm tra được) đều cho đi tiếp.
            const type = result?.available && result.hasGlasses ? result.glasses : null;
            if (type) {
              setGlassesIssue(type);
              glassesRetryAtRef.current = Date.now() + GLASSES_RETRY_MS;
            } else {
              glassesDoneRef.current = true;
              setGlassesIssue(null);
            }
            // Nhịp quét kế tiếp sẽ thấy mặt ổn định mới từ đầu → bắt mẫu.
            stableSinceRef.current = null;
          });
        }
        return;
      }

      if (stableSinceRef.current === null) {
        stableSinceRef.current = now;
        return;
      }
      if (now - stableSinceRef.current < STABLE_MS) return;

      // Khuôn mặt đã ổn định → bắt mẫu
      const embedding = roundEmbedding(face.embedding!);
      if (callbacksRef.current.mode === 'verify') {
        runningRef.current = false;
        setStatus('captured');
        callbacksRef.current.onCapture?.(embedding);
      } else {
        const next = [...samplesRef.current, embedding];
        // Mẫu đầu tiên: chụp 1 ảnh tham chiếu CẮT ĐÚNG VÙNG MẶT (nếu bật)
        if (next.length === 1 && callbacksRef.current.withImage && !imageRef.current) {
          imageRef.current = captureFaceImage(videoRef.current, face.box);
          if (imageRef.current) setPreview(imageRef.current);
        }
        samplesRef.current = next;
        setSamples(next);
        callbacksRef.current.onSamples?.(next, imageRef.current);
        stableSinceRef.current = null;
        cooldownUntilRef.current = now + CAPTURE_COOLDOWN_MS;
        if (next.length >= targetRef.current) {
          runningRef.current = false;
          setStatus('done');
        }
      }
    };

    const loop = async () => {
      if (cancelled || !runningRef.current || !humanInstance) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          const res = await humanInstance.detect(video);
          if (!cancelled) handleFaces(res.face ?? []);
        } catch {
          // Lỗi tạm thời của backend AI — bỏ qua, quét tiếp ở nhịp sau
        }
      }
      if (!cancelled && runningRef.current) {
        timer = setTimeout(() => {
          void loop();
        }, TICK_MS);
      }
    };

    (async () => {
      try {
        setStatus('loading');
        const human = await loadHuman();
        humanInstance = human;
        if (cancelled) return;
        // Dọn trạng thái cũ (React StrictMode mount 2 lần ở dev)
        if (human.webcam.stream) human.webcam.stop();
        const stream = await startCamera(videoElement!);
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        runningRef.current = true;
        setStatus('searching');
        void loop();
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[FaceScanner] webcam start lỗi:', err);
        const msg = cameraErrorMessage(err);
        setErrorMsg(msg);
        setStatus('error');
        callbacksRef.current.onError?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
      if (timer) clearTimeout(timer);
      if (videoElement?.srcObject instanceof MediaStream) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (videoElement) videoElement.srcObject = null;
      humanInstance?.webcam.stop();
    };
  }, []);

  const isEnroll = mode === 'enroll';
  const finished = status === 'done' || status === 'captured';

  const statusLine = (() => {
    if (status === 'loading') {
      return {
        icon: <Loader2 className="size-4 animate-spin text-neon" />,
        text: 'Đang tải mô hình AI nhận diện... (lần đầu khoảng 7MB)',
      };
    }
    if (status === 'error') {
      return { icon: <CameraOff className="size-4 text-danger" />, text: errorMsg };
    }
    if (status === 'captured') {
      return {
        icon: <CheckCircle2 className="size-4 text-neon" />,
        text: 'Đã nhận diện — đang xác thực...',
      };
    }
    if (status === 'done') {
      return {
        icon: <CheckCircle2 className="size-4 text-neon" />,
        text: `Đủ ${target} mẫu — sẵn sàng đăng ký`,
      };
    }
    if (spoofWarn) {
      return {
        icon: <ShieldAlert className="size-4 text-danger" />,
        text: 'Dấu hiệu không phải người thật — bỏ khẩu trang / đừng dán ảnh vào camera',
      };
    }
    if (glassesIssue === 'checking') {
      return {
        icon: <Loader2 className="size-4 animate-spin text-neon" />,
        text: 'Đang kiểm tra khuôn mặt có đeo kính không...',
      };
    }
    if (glassesIssue) {
      return {
        icon: <Glasses className="size-4 text-amber-400" />,
        text: GLASSES_MESSAGES[glassesIssue],
      };
    }
    if (qualityIssue) {
      return {
        icon: <AlertTriangle className="size-4 text-amber-400" />,
        text: QUALITY_MESSAGES[qualityIssue],
      };
    }
    return {
      icon: <ScanFace className={cn('size-4', detected ? 'text-neon' : 'text-muted')} />,
      text: isEnroll
        ? `${POSE_HINTS[Math.min(samples.length, POSE_HINTS.length - 1)]} — giữ yên đến khi thanh sáng`
        : 'Đưa mặt vào khung và giữ yên...',
    };
  })();

  return (
    <div className={className}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-ink transition-colors',
          detected && !spoofWarn ? 'border-neon/70' : 'border-line',
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full -scale-x-100 object-cover"
        />

        {/* Khung định vị khuôn mặt */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-[20%] inset-y-[12%] rounded-[45%] border-2 border-dashed transition-colors',
            detected && !spoofWarn ? 'border-neon/70' : 'border-line',
          )}
        />

        {finished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/85 text-center">
            <CheckCircle2 className="size-10 text-neon" />
            <p className="text-sm font-semibold text-chalk">
              {status === 'done' ? `Đã chụp đủ ${target} mẫu` : 'Đã nhận diện khuôn mặt'}
            </p>
          </div>
        )}
      </div>

      {/* Thanh trạng thái */}
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
        <span className="mt-0.5 shrink-0">{statusLine.icon}</span>
        <p className="text-xs leading-relaxed text-muted">{statusLine.text}</p>
      </div>

      {/* Tiến độ mẫu (chỉ khi đăng ký) */}
      {isEnroll && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: target }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-2.5 rounded-full transition-colors',
                i < samples.length ? 'bg-neon' : 'bg-line',
              )}
            />
          ))}
          <span className="ml-2 font-mono text-xs text-muted">
            {samples.length}/{target}
          </span>
        </div>
      )}

      {/* Ảnh tham chiếu đã chụp — xem trước để chắc chắn lưu đúng khuôn mặt */}
      {isEnroll && withImage && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Ảnh tham chiếu khuôn mặt sẽ được lưu"
                className="size-16 shrink-0 rounded-lg border border-neon/50 object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-chalk">Ảnh tham chiếu đã chụp</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  Ảnh này sẽ lưu vào hồ sơ để lễ tân đối chiếu. Thấy rõ mặt, không bị che hay quá
                  tối thì giữ nguyên.
                </p>
              </div>
            </>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted">
              Ảnh tham chiếu sẽ hiện ở đây ngay khi bắt mẫu đầu tiên — đảm bảo khuôn mặt nằm gọn
              trong khung và đủ sáng.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
