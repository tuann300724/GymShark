'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, CheckCircle2, Loader2, ScanFace, ShieldAlert } from 'lucide-react';
import type { FaceResult } from '@vladmandic/human';
import { cn } from '@/lib/utils';
import { ANTI_SPOOF_MIN, loadHuman, roundEmbedding } from '@/lib/face';

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
const MIN_FACE_SCORE = 0.5; // điểm phát hiện tối thiểu

interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  /** Số mẫu cần chụp (mode=enroll), mặc định 5 */
  target?: number;
  /** mode=enroll: gọi mỗi khi thêm 1 mẫu mới */
  onSamples?: (samples: number[][]) => void;
  /** mode=verify: gọi 1 lần khi bắt được khuôn mặt ổn định */
  onCapture?: (embedding: number[]) => void;
  /** Lỗi chặn tiếp tục (chặn quyền camera...) — trang cha toast */
  onError?: (message: string) => void;
  className?: string;
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
  onError,
  className,
}: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<FaceScannerStatus>('loading');
  const [detected, setDetected] = useState(false);
  const [spoofWarn, setSpoofWarn] = useState(false);
  const [samples, setSamples] = useState<number[][]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs để vòng quét đọc dữ liệu mới nhất mà không phải cài lại effect
  const samplesRef = useRef<number[][]>([]);
  const runningRef = useRef(false);
  const stableSinceRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef(0);
  const targetRef = useRef(target);
  const callbacksRef = useRef({ mode, onSamples, onCapture, onError });

  useEffect(() => {
    callbacksRef.current = { mode, onSamples, onCapture, onError };
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let humanInstance: Awaited<ReturnType<typeof loadHuman>> | null = null;

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
        stableSinceRef.current = null;
        return;
      }
      setSpoofWarn(false);

      if (Date.now() < cooldownUntilRef.current) return;
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
        samplesRef.current = next;
        setSamples(next);
        callbacksRef.current.onSamples?.(next);
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
        const camStatus = await human.webcam.start({
          element: videoRef.current!,
          mode: 'front',
          width: 640,
          height: 480,
        });
        // human KHÔNG ném exception: lỗi trả về chuỗi "webcam error: ..."
        // (thành công trả "webcam: <tên camera>") — nếu không bắt ở đây,
        // status sẽ kẹt ở "searching" với video chết.
        if (typeof camStatus === 'string' && camStatus.startsWith('webcam error')) {
          throw new Error(camStatus);
        }
        if (cancelled) {
          human.webcam.stop();
          return;
        }
        runningRef.current = true;
        setStatus('searching');
        void loop();
      } catch (err) {
        if (cancelled) return;
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
      try {
        humanInstance?.webcam.stop();
      } catch {
        // webcam đã dừng từ trước
      }
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
    </div>
  );
}
