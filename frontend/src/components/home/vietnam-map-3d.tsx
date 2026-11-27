'use client';

/**
 * Bản đồ Việt Nam 3D dạng khối nổi — vẽ bằng Canvas 2D (không thư viện):
 * - Lãnh thổ đùn khối (nhiều lớp đường viền chồng nhau) + mặt trên có lưới điểm dữ liệu
 * - Vệt quét radar chạy Bắc → Nam, điểm lưới sáng lên khi vệt quét đi qua
 * - Mỗi cụm cơ sở đối tác: cột sáng đúng toạ độ, vòng sóng lan, hạt sáng bay lên, nhãn khu vực
 * - Nghiêng theo chuột (parallax) + kéo để xoay; hiệu ứng dựng khối lúc xuất hiện
 * - Hoàng Sa, Trường Sa và 3 thành phố lớn để định hướng
 * Dừng vẽ khi ra khỏi màn hình; tôn trọng prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';

export interface MapBranch {
  name: string;
  latitude: number;
  longitude: number;
  /** Khu vực hiển thị khi gom nhiều cơ sở (vd "Biên Hòa") */
  area?: string | null;
}

type LngLat = [number, number];

/** Đường biên lãnh thổ đất liền (xấp xỉ, ~100 điểm) — theo chiều kim đồng hồ từ cực Tây Bắc */
const MAINLAND: LngLat[] = [
  [102.14, 22.4],
  [102.48, 22.77],
  [102.9, 22.6],
  [103.03, 22.44],
  [103.33, 22.8],
  [103.65, 22.78],
  [103.95, 22.5],
  [104.11, 22.79],
  [104.4, 22.7],
  [104.73, 22.82],
  [105.0, 23.05],
  [105.33, 23.35],
  [105.55, 23.2],
  [105.81, 23.05],
  [106.25, 22.9],
  [106.7, 22.87],
  [106.56, 22.45],
  [106.79, 22.25],
  [106.7, 21.98],
  [107.05, 21.8],
  [107.36, 21.6],
  [108.05, 21.55],
  // Bờ biển Đông Bắc → Bắc Trung Bộ
  [107.75, 21.3],
  [107.4, 21.05],
  [107.0, 20.85],
  [106.8, 20.7],
  [106.6, 20.4],
  [106.4, 20.15],
  [106.1, 19.95],
  [105.85, 19.6],
  [105.8, 19.3],
  [105.68, 18.95],
  [105.85, 18.45],
  [106.1, 18.25],
  [106.35, 18.05],
  [106.55, 17.6],
  [106.8, 17.3],
  [107.0, 17.1],
  [107.4, 16.75],
  [107.75, 16.5],
  [108.0, 16.3],
  [108.3, 16.0],
  [108.55, 15.6],
  [108.75, 15.35],
  [108.9, 15.0],
  [109.0, 14.6],
  [109.08, 14.2],
  [109.2, 13.8],
  [109.25, 13.4],
  [109.3, 13.0],
  [109.42, 12.7],
  [109.2, 12.4],
  [109.2, 12.0],
  [109.15, 11.7],
  [108.95, 11.4],
  [108.7, 11.15],
  [108.4, 10.95],
  [108.0, 10.7],
  [107.6, 10.55],
  [107.2, 10.45],
  [106.95, 10.35],
  [106.75, 10.1],
  [106.6, 9.75],
  [106.35, 9.5],
  [106.1, 9.3],
  [105.8, 9.15],
  [105.5, 9.0],
  [105.3, 8.75],
  [105.1, 8.6],
  [104.75, 8.58],
  // Bờ Tây Nam → Hà Tiên
  [104.8, 8.9],
  [104.85, 9.25],
  [104.92, 9.6],
  [104.9, 9.95],
  [104.75, 10.2],
  [104.45, 10.42],
  // Biên giới Campuchia
  [104.75, 10.6],
  [105.0, 10.9],
  [105.4, 10.95],
  [105.75, 11.0],
  [106.2, 10.95],
  [106.3, 11.2],
  [106.45, 11.45],
  [106.85, 11.65],
  [107.2, 11.75],
  [107.45, 11.9],
  [107.55, 12.3],
  [107.6, 12.75],
  [107.5, 13.1],
  [107.5, 13.6],
  [107.48, 14.1],
  [107.55, 14.7],
  // Biên giới Lào
  [107.65, 15.1],
  [107.45, 15.5],
  [107.2, 15.85],
  [107.35, 16.2],
  [106.95, 16.35],
  [106.7, 16.6],
  [106.55, 16.95],
  [106.25, 17.3],
  [105.95, 17.6],
  [105.65, 17.95],
  [105.45, 18.3],
  [105.15, 18.65],
  [104.75, 18.85],
  [104.4, 19.1],
  [103.9, 19.28],
  [104.05, 19.65],
  [104.45, 19.7],
  [104.6, 20.2],
  [104.4, 20.55],
  [104.05, 20.75],
  [103.7, 20.7],
  [103.35, 20.82],
  [103.0, 21.05],
  [102.9, 21.4],
  [102.85, 21.75],
  [102.6, 21.95],
  [102.3, 22.15],
];
const PHU_QUOC: LngLat[] = [
  [103.85, 10.42],
  [104.03, 10.42],
  [104.08, 10.2],
  [104.02, 10.03],
  [103.92, 10.02],
  [103.86, 10.22],
];
const ARCHIPELAGOS = [
  { name: 'Hoàng Sa', lng: 112.0, lat: 16.5 },
  { name: 'Trường Sa', lng: 114.2, lat: 10.0 },
];
const CITIES = [
  { name: 'Hà Nội', lng: 105.85, lat: 21.03 },
  { name: 'Đà Nẵng', lng: 108.22, lat: 16.05 },
  { name: 'TP. Hồ Chí Minh', lng: 106.7, lat: 10.78 },
];

const CENTER = { lng: 107.6, lat: 15.9 };
const BASE_PITCH = 0.78; // ~45° nghiêng về phía sau
const DEPTH = 0.55; // độ dày khối (đơn vị độ)
const LAYERS = 14;

function inside(lng: number, lat: number, poly: LngLat[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** Lưới điểm dữ liệu trên mặt bản đồ (chỉ lấy điểm nằm trong lãnh thổ) */
const GRID: LngLat[] = (() => {
  const out: LngLat[] = [];
  for (let lat = 8.6; lat <= 23.4; lat += 0.28) {
    for (let lng = 102.1; lng <= 109.5; lng += 0.28) {
      if (inside(lng, lat, MAINLAND)) out.push([lng, lat]);
    }
  }
  return out;
})();

function clusterBranches(branches: MapBranch[]) {
  const clusters: { lng: number; lat: number; names: string[]; area?: string | null }[] = [];
  for (const b of branches) {
    const hit = clusters.find(
      (c) => Math.abs(c.lat - b.latitude) < 0.35 && Math.abs(c.lng - b.longitude) < 0.35,
    );
    if (hit) {
      hit.names.push(b.name);
      hit.lat = (hit.lat * (hit.names.length - 1) + b.latitude) / hit.names.length;
      hit.lng = (hit.lng * (hit.names.length - 1) + b.longitude) / hit.names.length;
    } else clusters.push({ lng: b.longitude, lat: b.latitude, names: [b.name], area: b.area });
  }
  return clusters.map((c) => ({
    ...c,
    label:
      c.names.length === 1 ? c.names[0] : `${c.area ? `${c.area} · ` : ''}${c.names.length} cơ sở`,
  }));
}

function readRgb(style: CSSStyleDeclaration, name: string, fallback: string) {
  const raw = style.getPropertyValue(name).trim();
  return raw ? raw.split(/\s+/).join(',') : fallback;
}

export function VietnamMap3D({
  branches,
  className,
}: {
  branches: MapBranch[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const branchesRef = useRef(branches);
  branchesRef.current = branches;
  const redrawRef = useRef<() => void>();
  useEffect(() => {
    redrawRef.current?.();
  }, [branches]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let scale = 30;
    let raf = 0;
    let visible = true;
    let t = 0;
    let intro = reduced ? 1 : 0;
    let colors = {
      neon: '183,255,0',
      chalk: '245,245,245',
      muted: '154,160,166',
      surface: '21,25,29',
    };
    let font = 'sans-serif';
    let clusterKey = '';
    let clusters = clusterBranches(branchesRef.current);

    // Góc xoay: yaw (quay ngang) + pitch (nghiêng), có mục tiêu để chuyển động mượt
    const view = { yaw: -0.18, pitch: BASE_PITCH, tYaw: -0.18, tPitch: BASE_PITCH };
    const drag = { active: false, lastX: 0, offset: 0 };

    const refreshTheme = () => {
      const style = getComputedStyle(document.documentElement);
      colors = {
        neon: readRgb(style, '--neon', colors.neon),
        chalk: readRgb(style, '--chalk', colors.chalk),
        muted: readRgb(style, '--muted', colors.muted),
        surface: readRgb(style, '--surface', colors.surface),
      };
      font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Vừa khung: chiều ngang gồm cả quần đảo, chiều dọc là dải đất 15° vĩ độ đã nghiêng
      scale = Math.min(width / 14.5, height / (15 * Math.cos(BASE_PITCH) + 6.5));
      if (reduced) draw();
    };

    const project = (lng: number, lat: number, z = 0) => {
      const X = lng - CENTER.lng;
      const Y = (lat - CENTER.lat) * 1.04;
      const cy = Math.cos(view.yaw);
      const sy = Math.sin(view.yaw);
      const x1 = X * cy - Y * sy;
      const y1 = X * sy + Y * cy;
      const cp = Math.cos(view.pitch);
      const sp = Math.sin(view.pitch);
      const depth = y1 * sp - z * cp;
      const s = 34 / (34 + depth);
      return {
        x: width / 2 + x1 * s * scale,
        y: height * 0.52 - (y1 * cp + z * sp) * s * scale,
        s,
      };
    };

    const tracePoly = (poly: LngLat[], z: number) => {
      ctx.beginPath();
      poly.forEach(([lng, lat], i) => {
        const p = project(lng, lat, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
    };

    const ellipse = (lng: number, lat: number, r: number, z = 0) => {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 24) {
        const p = project(lng + Math.cos(a) * r, lat + Math.sin(a) * r, z);
        if (a === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    };

    const draw = () => {
      const key = branchesRef.current.map((b) => `${b.latitude},${b.longitude}`).join('|');
      if (key !== clusterKey) {
        clusterKey = key;
        clusters = clusterBranches(branchesRef.current);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const ease = 1 - Math.pow(1 - intro, 3);
      const depth = DEPTH * ease;

      // Sàn lưới mờ dưới bản đồ
      ctx.strokeStyle = `rgba(${colors.muted},0.07)`;
      ctx.lineWidth = 1;
      for (let lng = 100; lng <= 116; lng += 1) {
        const a = project(lng, 7, -depth - 0.4);
        const b = project(lng, 24.5, -depth - 0.4);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let lat = 7; lat <= 24.5; lat += 1) {
        const a = project(100, lat, -depth - 0.4);
        const b = project(116, lat, -depth - 0.4);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Khối đùn: các lớp đường viền chồng từ đáy lên mặt
      for (let i = 0; i <= LAYERS; i++) {
        const k = i / LAYERS;
        const z = -depth * (1 - k);
        tracePoly(MAINLAND, z);
        ctx.fillStyle = `rgba(${colors.surface},${i === 0 ? 0.95 : 0.55})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${colors.neon},${(0.04 + k * 0.16) * ease})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        tracePoly(PHU_QUOC, z);
        ctx.fill();
        ctx.stroke();
      }

      // Mặt trên
      tracePoly(MAINLAND, 0);
      ctx.fillStyle = `rgba(${colors.chalk},0.035)`;
      ctx.fill();
      ctx.save();
      ctx.shadowColor = `rgba(${colors.neon},0.6)`;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = `rgba(${colors.neon},${0.9 * ease})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      tracePoly(PHU_QUOC, 0);
      ctx.stroke();
      ctx.restore();

      // Vệt quét radar Bắc → Nam (chu kỳ 7 giây)
      const scanLat = 23.6 - ((t / 7) % 1) * 15.4;

      // Lưới điểm dữ liệu, sáng lên gần vệt quét
      for (const [lng, lat] of GRID) {
        const p = project(lng, lat, 0);
        const near = Math.max(0, 1 - Math.abs(lat - scanLat) / 0.9);
        const alpha = (0.16 + near * 0.7) * ease;
        if (near > 0.05) {
          ctx.fillStyle = `rgba(${colors.neon},${alpha.toFixed(3)})`;
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        } else {
          ctx.fillStyle = `rgba(${colors.chalk},${alpha.toFixed(3)})`;
          ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2);
        }
      }

      // Dải sáng của vệt quét (cắt theo hình lãnh thổ)
      if (!reduced) {
        ctx.save();
        tracePoly(MAINLAND, 0);
        ctx.clip();
        const a = project(100, scanLat + 0.5, 0);
        const b = project(100, scanLat - 0.5, 0);
        const band = ctx.createLinearGradient(0, a.y, 0, b.y);
        band.addColorStop(0, `rgba(${colors.neon},0)`);
        band.addColorStop(0.5, `rgba(${colors.neon},0.22)`);
        band.addColorStop(1, `rgba(${colors.neon},0)`);
        ctx.fillStyle = band;
        ctx.fillRect(0, Math.min(a.y, b.y), width, Math.abs(b.y - a.y));
        ctx.restore();
      }

      // Hoàng Sa, Trường Sa
      ctx.font = `600 10px ${font}`;
      ctx.textAlign = 'center';
      for (const arch of ARCHIPELAGOS) {
        for (let i = 0; i < 7; i++) {
          const p = project(
            arch.lng + Math.cos(i * 2.1) * 0.45,
            arch.lat + Math.sin(i * 1.7) * 0.4,
          );
          ctx.fillStyle = `rgba(${colors.neon},${0.75 * ease})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        const label = project(arch.lng, arch.lat - 0.95);
        ctx.fillStyle = `rgba(${colors.muted},${ease})`;
        ctx.fillText(arch.name, label.x, label.y);
      }

      // Thành phố lớn (định hướng)
      ctx.textAlign = 'left';
      for (const city of CITIES) {
        const p = project(city.lng, city.lat);
        ctx.fillStyle = `rgba(${colors.chalk},${0.55 * ease})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${colors.muted},${0.85 * ease})`;
        ctx.fillText(city.name, p.x + 6, p.y + 3);
      }

      // Cụm cơ sở: vòng sóng, cột sáng, hạt bay lên, nhãn
      clusters.forEach((c, index) => {
        const pillar = (1.6 + Math.min(c.names.length, 6) * 0.35) * ease;
        for (let w = 0; w < 3; w++) {
          const phase = (t * 0.45 + w / 3 + index * 0.2) % 1;
          ellipse(c.lng, c.lat, 0.12 + phase * 0.9);
          ctx.strokeStyle = `rgba(${colors.neon},${((1 - phase) * 0.8 * ease).toFixed(3)})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }

        const base = project(c.lng, c.lat, 0);
        const top = project(c.lng, c.lat, pillar);
        const beam = ctx.createLinearGradient(base.x, base.y, top.x, top.y);
        beam.addColorStop(0, `rgba(${colors.neon},0.95)`);
        beam.addColorStop(1, `rgba(${colors.neon},0)`);
        ctx.save();
        ctx.shadowColor = `rgba(${colors.neon},0.8)`;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = beam;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
        ctx.restore();

        // Hạt sáng bay dọc cột
        for (let i = 0; i < 5; i++) {
          const life = (t * 0.5 + i / 5 + index * 0.13) % 1;
          const p = project(
            c.lng + Math.sin(i * 7 + t) * 0.05,
            c.lat + Math.cos(i * 5) * 0.05,
            life * pillar * 1.1,
          );
          ctx.fillStyle = `rgba(${colors.neon},${((1 - life) * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${colors.neon},1)`;
        ctx.beginPath();
        ctx.arc(base.x, base.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Nhãn dạng thẻ ở đỉnh cột
        if (ease > 0.6) {
          ctx.font = `700 12px ${font}`;
          const text = c.label;
          const tw = ctx.measureText(text).width;
          const bx = top.x + 10;
          const by = top.y - 12;
          ctx.fillStyle = `rgba(${colors.surface},0.92)`;
          ctx.strokeStyle = `rgba(${colors.neon},0.55)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(bx, by, tw + 18, 24, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = `rgba(${colors.chalk},1)`;
          ctx.textAlign = 'left';
          ctx.fillText(text, bx + 9, by + 16);
          ctx.strokeStyle = `rgba(${colors.neon},0.55)`;
          ctx.beginPath();
          ctx.moveTo(top.x, top.y);
          ctx.lineTo(bx, by + 12);
          ctx.stroke();
        }
      });
    };

    const loop = () => {
      t += 1 / 60;
      if (intro < 1) intro = Math.min(1, intro + 1 / 80);
      // Tự lắc nhẹ + mục tiêu theo chuột/kéo
      const sway = Math.sin(t * 0.25) * 0.08;
      view.yaw += (view.tYaw + drag.offset + sway - view.yaw) * 0.06;
      view.pitch += (view.tPitch - view.pitch) * 0.06;
      if (Math.round(t * 60) % 45 === 0) refreshTheme();
      draw();
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };

    const start = () => {
      if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      if (drag.active) {
        drag.offset = Math.max(-0.9, Math.min(0.9, drag.offset + (e.clientX - drag.lastX) * 0.006));
        drag.lastX = e.clientX;
      } else if (e.pointerType === 'mouse') {
        view.tYaw = -0.18 + px * 0.35;
      }
      if (e.pointerType === 'mouse') view.tPitch = BASE_PITCH + py * 0.22;
      if (reduced) {
        view.yaw = view.tYaw + drag.offset;
        view.pitch = view.tPitch;
        draw();
      }
    };
    const onDown = (e: PointerEvent) => {
      drag.active = true;
      drag.lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      drag.active = false;
    };
    const onLeave = () => {
      view.tYaw = -0.18;
      view.tPitch = BASE_PITCH;
    };

    refreshTheme();
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      refreshTheme();
      if (reduced) draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    const onVisibility = () => start();
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    if (reduced) draw();
    else start();
    redrawRef.current = () => {
      if (reduced) draw();
    };

    return () => {
      redrawRef.current = undefined;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'pan-y' }}
      role="img"
      aria-label="Bản đồ Việt Nam 3D — vị trí các cơ sở trong mạng lưới Gym Master, kéo để xoay"
    />
  );
}
