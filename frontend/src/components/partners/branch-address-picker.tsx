'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';

const API_ROOT = 'https://provinces.open-api.vn/api/v1';

interface Ward {
  code: number;
  name: string;
}

interface District extends Ward {
  wards?: Ward[] | null;
}

interface Province extends Ward {
  districts?: District[];
}

interface BranchAddressPickerProps {
  initialAddress: string;
  initialLatitude?: number;
  initialLongitude?: number;
  onAddressChange: (address: string) => void;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error('Không tải được danh mục địa chỉ.');
  return response.json() as Promise<T>;
}

function removeAddressPart(address: string, part?: string) {
  if (!part) return address;
  const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return address
    .replace(new RegExp(escaped, 'gi'), '')
    .replace(
      /(^|,\s*)(tỉnh|thành phố|tp\.?|quận|huyện|thị xã|thị trấn|phường|xã)\.?\s*(?=,|$)/gi,
      '$1',
    )
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,+/g, ', ')
    .replace(/^(,\s*)+|(,\s*)+$/g, '')
    .trim();
}

function hasAddressPart(address: string, part: string) {
  const withoutLevel = part.replace(
    /^(tỉnh|thành phố|quận|huyện|thị xã|thị trấn|phường|xã)\s+/i,
    '',
  );
  return (
    address.includes(part.toLocaleLowerCase('vi')) ||
    address.includes(withoutLevel.toLocaleLowerCase('vi'))
  );
}

export default function BranchAddressPicker({
  initialAddress,
  initialLatitude,
  initialLongitude,
  onAddressChange,
}: BranchAddressPickerProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [detail, setDetail] = useState(initialAddress);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [addressWasParsed, setAddressWasParsed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchJson<Province[]>(`${API_ROOT}/?depth=2`)
      .then((result) => {
        if (active) setProvinces(result);
      })
      .catch(() => {
        if (active)
          setLoadError('Không tải được danh mục tỉnh thành. Bạn vẫn có thể nhập địa chỉ bằng tay.');
      })
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedProvince = provinces.find((province) => String(province.code) === provinceCode);

  useEffect(() => {
    setDistricts(selectedProvince?.districts || []);
  }, [selectedProvince]);

  const selectedDistrict = districts.find((district) => String(district.code) === districtCode);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }

    let active = true;
    setLoadingWards(true);
    fetchJson<District>(`${API_ROOT}/d/${districtCode}?depth=2`)
      .then((district) => {
        if (active) setWards(district.wards || []);
      })
      .catch(() => {
        if (active) setWards(selectedDistrict?.wards || []);
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });

    return () => {
      active = false;
    };
  }, [districtCode, selectedDistrict]);

  // Khi sửa cơ sở cũ, nhận lại tỉnh/quận/phường từ địa chỉ đã lưu nếu tên địa phương khớp.
  useEffect(() => {
    if (addressWasParsed || !provinces.length || !initialAddress) return;
    const normalized = initialAddress.toLocaleLowerCase('vi');
    const province = provinces.find((item) => hasAddressPart(normalized, item.name));
    if (!province) {
      setAddressWasParsed(true);
      return;
    }

    setProvinceCode(String(province.code));
    const district = (province.districts || []).find((item) =>
      hasAddressPart(normalized, item.name),
    );
    if (district) {
      setDistrictCode(String(district.code));
      setDetail((current) =>
        removeAddressPart(
          removeAddressPart(
            removeAddressPart(
              removeAddressPart(current, province.name),
              province.name.replace(/^(tỉnh|thành phố)\s+/i, ''),
            ),
            district.name,
          ),
          district.name.replace(/^(quận|huyện|thị xã|thị trấn|thành phố)\s+/i, ''),
        ),
      );
    } else {
      setDetail((current) =>
        removeAddressPart(
          removeAddressPart(current, province.name),
          province.name.replace(/^(tỉnh|thành phố)\s+/i, ''),
        ),
      );
    }
    setAddressWasParsed(true);
  }, [addressWasParsed, initialAddress, provinces]);

  useEffect(() => {
    if (!addressWasParsed || !districtCode || !initialAddress || !wards.length || wardCode) return;
    const normalized = initialAddress.toLocaleLowerCase('vi');
    const ward = wards.find((item) => hasAddressPart(normalized, item.name));
    if (ward) {
      setWardCode(String(ward.code));
      setDetail((current) =>
        removeAddressPart(
          removeAddressPart(current, ward.name),
          ward.name.replace(/^(phường|xã|thị trấn)\s+/i, ''),
        ),
      );
    }
  }, [addressWasParsed, districtCode, initialAddress, wardCode, wards]);

  const selectedWard = wards.find((ward) => String(ward.code) === wardCode);
  const fullAddress = useMemo(
    () =>
      [detail.trim(), selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
        .filter(Boolean)
        .join(', '),
    [detail, selectedDistrict, selectedProvince, selectedWard],
  );

  useEffect(() => {
    onAddressChange(fullAddress);
  }, [fullAddress, onAddressChange]);

  const mapSearch =
    fullAddress ||
    (initialLatitude != null && initialLongitude != null
      ? `${initialLatitude},${initialLongitude}`
      : '');
  const mapUrl = mapSearch
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${mapSearch}, Việt Nam`)}&z=16&output=embed`
    : '';
  const googleMapsUrl = mapSearch
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mapSearch}, Việt Nam`)}`
    : '';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="w-full min-w-0 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Tỉnh / thành phố
          </span>
          <select
            value={provinceCode}
            onChange={(event) => {
              setProvinceCode(event.target.value);
              setDistrictCode('');
              setWardCode('');
            }}
            disabled={loadingProvinces || provinces.length === 0}
            className="h-11 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:opacity-60"
          >
            <option value="">
              {loadingProvinces ? 'Đang tải danh mục…' : 'Chọn tỉnh / thành phố'}
            </option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full min-w-0 space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Quận / huyện
          </span>
          <select
            value={districtCode}
            onChange={(event) => {
              setDistrictCode(event.target.value);
              setWardCode('');
            }}
            disabled={!provinceCode || districts.length === 0}
            className="h-11 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:opacity-60"
          >
            <option value="">Chọn quận / huyện</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name}
              </option>
            ))}
          </select>
        </label>

        <label className="w-full min-w-0 space-y-1.5 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Phường / xã
          </span>
          <select
            value={wardCode}
            onChange={(event) => setWardCode(event.target.value)}
            disabled={!districtCode || loadingWards || wards.length === 0}
            className="h-11 w-full rounded-sm border border-line bg-ink px-3.5 text-sm text-chalk focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70 disabled:opacity-60"
          >
            <option value="">{loadingWards ? 'Đang tải phường / xã…' : 'Chọn phường / xã'}</option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loadError && <p className="text-xs text-danger">{loadError}</p>}

      <Input
        label="Địa chỉ chi tiết (số nhà, tên đường)"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        maxLength={350}
        placeholder="Ví dụ: 12 Nguyễn Trãi"
      />

      <div className="overflow-hidden rounded-xl border border-line bg-ink">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
            <MapPin className="size-4 shrink-0 text-neon" />
            <span className="truncate">{fullAddress || 'Chọn địa chỉ để xem bản đồ'}</span>
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neon hover:text-neon-hover"
            >
              Mở bản đồ <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
        {mapUrl ? (
          <iframe
            title="Bản đồ vị trí cơ sở"
            src={mapUrl}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-muted">
            Chọn tỉnh / thành phố hoặc nhập địa chỉ để xem bản đồ vị trí.
          </div>
        )}
        <p className="border-t border-line px-3.5 py-2 text-[11px] text-muted">
          Bản đồ Google Maps hiển thị theo địa chỉ; hãy chọn đủ cấp địa chỉ để định vị chính xác
          hơn.
        </p>
      </div>
    </div>
  );
}
