'use client';

/**
 * Bản đồ ghim vị trí — tự vẽ tile OpenStreetMap (không cần thư viện bản đồ).
 * Kéo để di chuyển, nút +/- để phóng to, bấm vào bản đồ để cắm ghim.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { LocateFixed, MapPin, Minus, Plus } from 'lucide-react';

export interface LatLng {
  lat: number;
  lng: number;
}

const TILE = 256;
const MIN_ZOOM = 5;
const MAX_ZOOM = 19;

function project({ lat, lng }: LatLng, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function unproject(x: number, y: number, zoom: number): LatLng {
  const scale = TILE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng: ((((lng + 180) % 360) + 360) % 360) - 180 };
}

interface PinLocationMapProps {
  center: LatLng;
  zoom: number;
  pin: LatLng | null;
  onViewChange: (center: LatLng, zoom: number) => void;
  onPick: (point: LatLng) => void;
}

export default function PinLocationMap({
  center,
  zoom,
  pin,
  onViewChange,
  onPick,
}: PinLocationMapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(
    null,
  );

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const c = project(center, zoom);
  const left = c.x - size.w / 2;
  const top = c.y - size.h / 2;
  const count = 2 ** zoom;

  const tiles: { key: string; src: string; x: number; y: number }[] = [];
  if (size.w > 0) {
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + size.h) / TILE); ty++) {
      if (ty < 0 || ty >= count) continue;
      for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + size.w) / TILE); tx++) {
        const wx = ((tx % count) + count) % count;
        tiles.push({
          key: `${zoom}-${tx}-${ty}`,
          src: `https://tile.openstreetmap.org/${zoom}/${wx}/${ty}.png`,
          x: Math.round(tx * TILE - left),
          y: Math.round(ty * TILE - top),
        });
      }
    }
  }

  const pinPos = pin ? project(pin, zoom) : null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, cx: c.x, cy: c.y, moved: false };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    onViewChange(unproject(d.cx - dx, d.cy - dy, zoom), zoom);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const rect = event.currentTarget.getBoundingClientRect();
    onPick(unproject(left + event.clientX - rect.left, top + event.clientY - rect.top, zoom));
  };

  const setZoom = (next: number) =>
    onViewChange(center, Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next)));

  return (
    <div className="relative h-64 w-full select-none overflow-hidden bg-surface">
      <div
        ref={boxRef}
        role="application"
        aria-label="Bản đồ ghim vị trí cơ sở — kéo để di chuyển, bấm để cắm ghim"
        className="absolute inset-0 cursor-crosshair touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute size-64 max-w-none"
            style={{ left: tile.x, top: tile.y }}
          />
        ))}
        {pinPos && (
          <MapPin
            aria-hidden
            className="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-full fill-danger text-ink drop-shadow"
            style={{ left: pinPos.x - left, top: pinPos.y - top }}
          />
        )}
      </div>

      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-sm border border-line bg-ink">
        <button
          type="button"
          onClick={() => setZoom(zoom + 1)}
          aria-label="Phóng to"
          className="flex size-8 items-center justify-center text-chalk hover:text-neon"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoom(zoom - 1)}
          aria-label="Thu nhỏ"
          className="flex size-8 items-center justify-center border-t border-line text-chalk hover:text-neon"
        >
          <Minus className="size-4" />
        </button>
        {pin && (
          <button
            type="button"
            onClick={() => onViewChange(pin, Math.max(zoom, 16))}
            aria-label="Về vị trí đã ghim"
            className="flex size-8 items-center justify-center border-t border-line text-chalk hover:text-neon"
          >
            <LocateFixed className="size-4" />
          </button>
        )}
      </div>

      <span className="pointer-events-none absolute bottom-0 right-0 bg-ink/80 px-1.5 py-0.5 text-[10px] text-muted">
        © OpenStreetMap
      </span>
    </div>
  );
}
