'use client';

import { useCallback, useState } from 'react';

/** Khoảng cách đường chim bay giữa 2 toạ độ (km, công thức haversine) */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

/** Lấy vị trí thiết bị khi người dùng bấm (không tự hỏi quyền lúc tải trang) */
export function useDeviceLocation() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ lấy vị trí.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Không lấy được vị trí — hãy cho phép quyền vị trí trên trình duyệt.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { origin, locating, error, locate };
}
