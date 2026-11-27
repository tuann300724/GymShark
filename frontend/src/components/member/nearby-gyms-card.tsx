'use client';

/**
 * Gợi ý phòng tập đối tác cho hội viên đã có gói đang hoạt động:
 * chỉ hiện cơ sở mà gói cho phép vào, ưu tiên cùng phường/quận/tỉnh với địa chỉ trong hồ sơ
 * và phòng cùng hạng với gói. Có thể sắp theo khoảng cách thật bằng vị trí của thiết bị.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, Dumbbell, MapPin, Navigation, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatTierList, gymTierLabel } from '@/lib/package-options';
import { memberApi, type NearbyAreaMatch, type NearbyGym } from '@/services/member.service';

const AREA_LABEL: Record<NearbyAreaMatch, string | null> = {
  WARD: 'Cùng phường',
  DISTRICT: 'Cùng quận / huyện',
  PROVINCE: 'Cùng tỉnh / thành',
  OTHER: null,
};

const PAGE_SIZE = 6;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

function directionsUrl(gym: NearbyGym) {
  const destination =
    gym.latitude != null && gym.longitude != null
      ? `${gym.latitude},${gym.longitude}`
      : `${gym.address || gym.name}, Việt Nam`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export default function NearbyGymsCard() {
  const [onlySameTier, setOnlySameTier] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['member-nearby-gyms'],
    queryFn: memberApi.getNearbyGyms,
    staleTime: 60 * 1000,
  });

  const gyms = useMemo(() => {
    const list = (data?.items ?? [])
      .filter((gym) => !onlySameTier || gym.sameTier)
      .map((gym) => ({
        gym,
        km:
          origin && gym.latitude != null && gym.longitude != null
            ? distanceKm(origin.lat, origin.lng, gym.latitude, gym.longitude)
            : null,
      }));
    // Có vị trí thiết bị thì sắp theo khoảng cách (cơ sở chưa ghim bản đồ xuống cuối)
    if (origin) list.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return list;
  }, [data, onlySameTier, origin]);

  if (isLoading) return <Skeleton className="h-48" />;
  if (!data?.hasActiveMembership || data.privateGym) return null;

  const sameTierCount = data.items.filter((gym) => gym.sameTier).length;
  const visible = showAll ? gyms : gyms.slice(0, PAGE_SIZE);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError('Trình duyệt không hỗ trợ lấy vị trí.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError('Không lấy được vị trí — hãy cho phép quyền vị trí trên trình duyệt.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-neon/25 bg-neon/10">
              <MapPin className="size-5 text-neon" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Phòng tập gần bạn
              </p>
              <p className="mt-1 text-sm text-chalk">
                Gói <b>{data.packageName}</b> tập được tại phòng hạng{' '}
                <b className="text-neon">{formatTierList(data.allowedTiers) || '—'}</b>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {data.hasArea ? (
                  <>Khu vực trong hồ sơ: {data.memberAddress}</>
                ) : (
                  <>
                    Hồ sơ chưa có địa chỉ —{' '}
                    <Link
                      href="/member/profile"
                      className="font-semibold text-neon hover:underline"
                    >
                      cập nhật địa chỉ
                    </Link>{' '}
                    để gợi ý theo khu vực.
                  </>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={locate}
            isLoading={locating}
            className="shrink-0"
          >
            <Crosshair className="size-3.5" />
            {origin ? 'Cập nhật vị trí' : 'Sắp theo vị trí của tôi'}
          </Button>
        </div>

        {locateError && <p className="text-xs text-danger">{locateError}</p>}

        {data.items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { value: false, label: `Tất cả (${data.items.length})` },
              {
                value: true,
                label: `Cùng hạng gói${data.packageTier ? ` · ${gymTierLabel(data.packageTier)}` : ''} (${sameTierCount})`,
              },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setOnlySameTier(chip.value);
                  setShowAll(false);
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  onlySameTier === chip.value
                    ? 'border-neon/50 bg-neon/10 text-neon'
                    : 'border-line text-muted hover:text-chalk',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {gyms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            <Dumbbell className="mx-auto mb-2 size-5" />
            {data.items.length === 0
              ? 'Chưa có phòng đối tác nào phù hợp với hạng gói của bạn.'
              : 'Chưa có phòng cùng hạng gói — xem tab Tất cả để chọn phòng khác.'}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map(({ gym, km }) => (
              <li
                key={gym.id}
                className="flex flex-col gap-2 rounded-xl border border-line bg-ink p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-chalk">{gym.partner.businessName}</p>
                    <p className="truncate text-xs text-muted">Cơ sở {gym.name}</p>
                  </div>
                  {km != null && (
                    <span className="shrink-0 font-display text-lg font-bold text-neon">
                      {formatKm(km)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{gymTierLabel(gym.partner.gymTier)}</Badge>
                  {gym.sameTier && <Badge variant="success">Cùng hạng gói</Badge>}
                  {AREA_LABEL[gym.areaMatch] && (
                    <Badge variant="default">{AREA_LABEL[gym.areaMatch]}</Badge>
                  )}
                </div>
                {gym.address && (
                  <p className="flex gap-1.5 text-xs text-muted">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>{gym.address}</span>
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                  {gym.phone ? (
                    <a
                      href={`tel:${gym.phone}`}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-chalk"
                    >
                      <Phone className="size-3.5" /> {gym.phone}
                    </a>
                  ) : (
                    <span />
                  )}
                  <a
                    href={directionsUrl(gym)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:text-neon-hover"
                  >
                    <Navigation className="size-3.5" /> Chỉ đường
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        {gyms.length > PAGE_SIZE && (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="w-full text-center text-xs font-semibold text-neon hover:underline"
          >
            {showAll ? 'Thu gọn' : `Xem thêm ${gyms.length - PAGE_SIZE} phòng`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
