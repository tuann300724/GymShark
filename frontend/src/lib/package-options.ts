import type { GymTier, MembershipPackage, PackageBillingType } from '@/services/types';

/** Hằng số hạng phòng gym đối tác — khớp `GymTier` ở backend */
export const GYM_TIERS: { value: GymTier; label: string; shortLabel: string; hint: string }[] = [
  {
    value: 'TIER_1',
    label: 'Tier 1 — Standard',
    shortLabel: 'Standard',
    hint: 'Phòng gym tiêu chuẩn',
  },
  { value: 'TIER_2', label: 'Tier 2 — Plus', shortLabel: 'Plus', hint: 'Phòng gym nâng cao' },
  { value: 'TIER_3', label: 'Tier 3 — Premium', shortLabel: 'Premium', hint: 'Phòng gym cao cấp' },
];

/** Tiêu chí xếp hạng phòng gym đối tác — admin đối chiếu với ảnh cơ sở vật chất */
export const GYM_TIER_CRITERIA: Record<GymTier, string[]> = {
  TIER_1: [
    'Máy tạ, tạ tự do và cardio phổ thông, đủ dùng',
    'Có quạt/điều hòa, phòng thay đồ và vệ sinh cơ bản',
    'Không gian gọn, sạch sẽ',
  ],
  TIER_2: [
    'Thiết bị đa dạng, còn mới, chia khu tạ / cardio / functional rõ ràng',
    'Điều hòa toàn phòng, tủ đồ có khóa, phòng tắm riêng',
    'Có khu lớp nhóm hoặc PT, lễ tân trực thường xuyên',
  ],
  TIER_3: [
    'Thiết bị cao cấp (thương hiệu nhập khẩu), không gian rộng, thiết kế đẹp',
    'Tiện ích thêm: xông hơi, hồ bơi, khăn, nước uống, khu nghỉ',
    'Dịch vụ chuyên nghiệp: lễ tân, vệ sinh liên tục, đội ngũ PT',
  ],
};

export function gymTierLabel(tier: GymTier | null | undefined): string {
  return GYM_TIERS.find((t) => t.value === tier)?.shortLabel ?? 'Chưa xếp hạng';
}

/** Loại hình gói có thể tạo/sửa — khớp `CREATABLE_PACKAGE_TYPES` ở backend */
export type CreatablePackageType = 'FIXED_TERM' | 'CREDIT_BASED';

export const PACKAGE_TYPE_OPTIONS: { value: CreatablePackageType; label: string; hint: string }[] =
  [
    {
      value: 'FIXED_TERM',
      label: 'Theo thời hạn (Tháng/Ngày)',
      hint: 'Người dùng tập trong khoảng thời gian quy định',
    },
    {
      value: 'CREDIT_BASED',
      label: 'Theo số lượt (Credit/Pass)',
      hint: 'Trừ dần số lượt mỗi lần check-in tại phòng gym',
    },
  ];

/** Badge loại gói hiển thị cạnh mã gói */
export function packageTypeBadge(type: PackageBillingType): string {
  if (type === 'CREDIT_BASED') return 'Gói Lượt';
  if (type === 'FIXED_TERM') return 'Gói Tháng';
  return 'Gói cũ theo buổi';
}

/** Hạng tier đã chọn, đã sắp xếp theo thứ tự hạng tăng dần */
export function normalizeTiers(tiers: unknown): GymTier[] {
  if (!Array.isArray(tiers)) return [];
  const order: GymTier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
  return order.filter((tier) => tiers.includes(tier));
}

/** Danh sách hạng dạng "Standard · Plus" (rỗng thì trả về chuỗi trống) */
export function formatTierList(tiers: unknown): string {
  const valid = normalizeTiers(tiers);
  if (valid.length === 0) return '';
  return GYM_TIERS.filter((tier) => valid.includes(tier.value))
    .map((tier) => tier.shortLabel)
    .join(' · ');
}

/**
 * Hạn mức lượt tập:
 * - Gói Lượt: "20 lượt / 60 ngày"
 * - Gói Tháng có giới hạn: "16 lượt/tháng"
 * - Gói Tháng không giới hạn: "Không giới hạn lượt"
 */
export function formatVisitLimit(
  pkg: Pick<MembershipPackage, 'type' | 'visitLimit' | 'durationDays'>,
): string {
  if (pkg.type === 'SESSION_BASED') return 'Gói cũ theo buổi';
  if (pkg.visitLimit == null || pkg.visitLimit <= 0) {
    return pkg.type === 'CREDIT_BASED' ? '—' : 'Không giới hạn lượt';
  }
  if (pkg.type === 'CREDIT_BASED') return `${pkg.visitLimit} lượt / ${pkg.durationDays} ngày`;
  return `${pkg.visitLimit} lượt/tháng`;
}
