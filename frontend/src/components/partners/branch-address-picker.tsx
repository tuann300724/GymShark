'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crosshair, ExternalLink, MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PinLocationMap, { type LatLng } from '@/components/partners/pin-location-map';
import AddressAutocomplete from '@/components/partners/address-autocomplete';

const API_ROOT = 'https://provinces.open-api.vn/api/v1';
const GEOCODE_URL =
  'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn';
const VIETNAM_CENTER: LatLng = { lat: 16.05, lng: 106.6 };

/** Tìm toạ độ theo địa chỉ (OpenStreetMap Nominatim, miễn phí, không cần key). */
async function geocode(query: string): Promise<LatLng | null> {
  // OSM lưu tên không kèm cấp hành chính ("Hóa An" chứ không phải "Phường Hóa An")
  const cleaned = query
    .split(',')
    .map((part) =>
      part
        .trim()
        .replace(/^(tỉnh|thành phố|tp\.?|quận|huyện|thị xã|thị trấn|phường|xã|đường)\s+/i, ''),
    )
    .filter(Boolean)
    .join(', ');
  const response = await fetch(`${GEOCODE_URL}&q=${encodeURIComponent(cleaned)}`, {
    headers: { 'Accept-Language': 'vi' },
  });
  if (!response.ok) return null;
  const [hit] = (await response.json()) as { lat: string; lon: string }[];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
}

/** Nhận toạ độ dạng "10.95, 106.82" hoặc link Google Maps (@lat,lng / !3dlat!4dlng / q=lat,lng). */
function parseCoordinates(text: string): LatLng | null {
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;

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
  onCoordinatesChange: (point: LatLng | null) => void;
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
  onCoordinatesChange,
}: BranchAddressPickerProps) {
  const initialPin =
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : null;
  const [pin, setPin] = useState<LatLng | null>(initialPin);
  const [view, setView] = useState({
    center: initialPin || VIETNAM_CENTER,
    zoom: initialPin ? 17 : 5,
  });
  const [locating, setLocating] = useState(false);
  const [mapMessage, setMapMessage] = useState('');
  const [pasted, setPasted] = useState('');
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

  const placePin = (point: LatLng, message = '') => {
    const rounded = { lat: round(point.lat), lng: round(point.lng) };
    setPin(rounded);
    onCoordinatesChange(rounded);
    setMapMessage(message);
  };

  const clearPin = () => {
    setPin(null);
    onCoordinatesChange(null);
    setMapMessage('Đã bỏ ghim. Bản đồ công khai sẽ định vị theo địa chỉ chữ.');
  };

  // Chưa ghim thì tự đưa bản đồ tới khu vực tỉnh/quận/phường vừa chọn (chỉ di chuyển, không cắm ghim).
  const areaQuery = [selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
    .filter(Boolean)
    .join(', ');
  useEffect(() => {
    if (!areaQuery || pin) return;
    let active = true;
    const timer = setTimeout(() => {
      geocode(areaQuery)
        .then((point) => {
          if (active && point)
            setView({ center: point, zoom: selectedWard ? 15 : selectedDistrict ? 13 : 10 });
        })
        .catch(() => undefined);
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // pin cố ý không nằm trong deps: chỉ chạy khi đổi khu vực hành chính
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaQuery]);

  const locateByAddress = async () => {
    setLocating(true);
    setMapMessage('');
    try {
      // Thử địa chỉ đầy đủ → tên đường (bỏ số nhà) → phường → quận → tỉnh
      const street = detail.trim().replace(/^[\d/\-a-z]*\d[\d/\-a-z]*\s+/i, '');
      const streetQuery = street && areaQuery ? `${street}, ${areaQuery}` : '';
      const queries = [
        fullAddress,
        streetQuery,
        areaQuery,
        selectedDistrict?.name,
        selectedProvince?.name,
      ]
        .filter((query): query is string => Boolean(query))
        .filter((query, index, list) => list.indexOf(query) === index);
      for (let index = 0; index < queries.length; index++) {
        const query = queries[index];
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1000)); // giới hạn 1 lượt/giây của Nominatim
        const point = await geocode(query);
        if (!point) continue;
        if (query === streetQuery) {
          setView({ center: point, zoom: 17 });
          setMapMessage(
            'Đã tìm thấy tên đường nhưng chưa có số nhà — bấm vào đúng vị trí cơ sở trên đoạn đường để ghim.',
          );
        } else if (index === 0) {
          setView({ center: point, zoom: 17 });
          placePin(point, 'Đã ghim theo địa chỉ — kiểm tra lại và bấm đúng vị trí nếu lệch.');
        } else {
          setView({ center: point, zoom: query === areaQuery ? 15 : 13 });
          setMapMessage(
            'Không tìm thấy số nhà/tên đường chính xác — đã đưa bản đồ tới khu vực gần nhất, hãy bấm vào đúng vị trí cơ sở để ghim.',
          );
        }
        return;
      }
      setMapMessage('Không tìm thấy địa chỉ này. Hãy kéo bản đồ và bấm vào vị trí cơ sở để ghim.');
    } catch {
      setMapMessage('Không kết nối được dịch vụ tìm địa chỉ. Hãy ghim thủ công trên bản đồ.');
    } finally {
      setLocating(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapMessage('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        setView({ center: point, zoom: 17 });
        placePin(point, 'Đã ghim theo vị trí hiện tại của thiết bị.');
        setLocating(false);
      },
      () => {
        setMapMessage('Không lấy được vị trí — hãy cho phép quyền vị trí hoặc ghim thủ công.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const applyPasted = () => {
    const point = parseCoordinates(pasted);
    if (!point) {
      setMapMessage(
        /goo\.gl|maps\.app/.test(pasted)
          ? 'Link rút gọn không chứa toạ độ — mở link, nhấp chuột phải vào điểm trên Google Maps rồi chép dòng toạ độ dán vào đây.'
          : 'Không đọc được toạ độ. Ví dụ hợp lệ: 10.9574, 106.8427',
      );
      return;
    }
    setView({ center: point, zoom: 17 });
    placePin(point, 'Đã ghim theo toạ độ bạn dán.');
    setPasted('');
  };

  const mapSearch = pin ? `${pin.lat},${pin.lng}` : fullAddress ? `${fullAddress}, Việt Nam` : '';
  const googleMapsUrl = mapSearch
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearch)}`
    : '';

  const toOptions = (items: Ward[]) =>
    items.map((item) => ({ value: String(item.code), label: item.name }));
  const provinceOptions = useMemo(() => toOptions(provinces), [provinces]);
  const districtOptions = useMemo(() => toOptions(districts), [districts]);
  const wardOptions = useMemo(() => toOptions(wards), [wards]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <AddressAutocomplete
          label="Tỉnh / thành phố"
          value={provinceCode}
          options={provinceOptions}
          onChange={(code) => {
            setProvinceCode(code);
            setDistrictCode('');
            setWardCode('');
          }}
          disabled={loadingProvinces || provinces.length === 0}
          placeholder={loadingProvinces ? 'Đang tải danh mục…' : 'Gõ tên, vd: Đồng Nai'}
        />

        <AddressAutocomplete
          label="Quận / huyện"
          value={districtCode}
          options={districtOptions}
          onChange={(code) => {
            setDistrictCode(code);
            setWardCode('');
          }}
          disabled={!provinceCode || districts.length === 0}
          placeholder={provinceCode ? 'Gõ tên, vd: Biên Hòa' : 'Chọn tỉnh trước'}
        />

        <AddressAutocomplete
          label="Phường / xã"
          value={wardCode}
          options={wardOptions}
          onChange={setWardCode}
          disabled={!districtCode || loadingWards || wards.length === 0}
          placeholder={
            loadingWards
              ? 'Đang tải phường / xã…'
              : districtCode
                ? 'Gõ tên, vd: Hóa An'
                : 'Chọn quận / huyện trước'
          }
          className="sm:col-span-2"
        />
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
            <span className="truncate">
              {pin ? (
                <>
                  Đã ghim:{' '}
                  <span className="font-semibold text-chalk">{`${pin.lat}, ${pin.lng}`}</span>
                </>
              ) : (
                'Chưa ghim — bấm vào bản đồ để đánh dấu vị trí cơ sở'
              )}
            </span>
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
        <div className="flex flex-wrap gap-2 border-b border-line px-3.5 py-2.5">
          <button
            type="button"
            onClick={locateByAddress}
            disabled={locating || !fullAddress}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs font-semibold text-chalk hover:border-neon/60 hover:text-neon disabled:opacity-50"
          >
            <Search className="size-3.5" /> Định vị theo địa chỉ
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs font-semibold text-chalk hover:border-neon/60 hover:text-neon disabled:opacity-50"
          >
            <Crosshair className="size-3.5" /> Vị trí hiện tại
          </button>
          {pin && (
            <button
              type="button"
              onClick={clearPin}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs font-semibold text-muted hover:border-danger/60 hover:text-danger"
            >
              <X className="size-3.5" /> Bỏ ghim
            </button>
          )}
        </div>

        <PinLocationMap
          center={view.center}
          zoom={view.zoom}
          pin={pin}
          onViewChange={(center, zoom) => setView({ center, zoom })}
          onPick={(point) => placePin(point)}
        />

        <div className="flex gap-2 border-t border-line px-3.5 py-2.5">
          <input
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyPasted();
              }
            }}
            aria-label="Dán toạ độ hoặc link Google Maps"
            placeholder="Dán toạ độ hoặc link Google Maps (vd 10.9574, 106.8427)"
            className="h-9 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-xs text-chalk placeholder:text-muted focus:border-neon/70 focus:outline-none focus:ring-2 focus:ring-neon/70"
          />
          <button
            type="button"
            onClick={applyPasted}
            disabled={!pasted.trim()}
            className="h-9 shrink-0 rounded-sm border border-line px-3 text-xs font-semibold text-chalk hover:border-neon/60 hover:text-neon disabled:opacity-50"
          >
            Ghim
          </button>
        </div>

        <p className="border-t border-line px-3.5 py-2 text-[11px] text-muted" aria-live="polite">
          {locating
            ? 'Đang định vị…'
            : mapMessage ||
              'Kéo bản đồ để di chuyển, bấm vào đúng vị trí cơ sở để cắm ghim. Hội viên sẽ thấy cơ sở theo vị trí đã ghim.'}
        </p>
      </div>
    </div>
  );
}
