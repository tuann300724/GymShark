/**
 * Quy trình xử lý yêu cầu hợp tác (pipeline):
 *
 *   NEW ──► CONTACTED ──► CONSULTING ──► CONVERTED ──► (tạo tài khoản đối tác)
 *    │          │              │
 *    └──────────┴──────────────┴──► CLOSED (bắt buộc ghi lý do) ──► mở lại = CONTACTED
 *
 * Mỗi lần chuyển bước được ghi AuditLog (entity PartnerLead) làm lịch sử xử lý.
 */
export const PARTNER_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONSULTING",
  "CONVERTED",
  "CLOSED",
] as const;
export type PartnerLeadStatus = (typeof PARTNER_LEAD_STATUSES)[number];

export const PARTNER_LEAD_STATUS_LABELS: Record<PartnerLeadStatus, string> = {
  NEW: "Mới nhận",
  CONTACTED: "Đã liên hệ",
  CONSULTING: "Đang tư vấn",
  CONVERTED: "Đã chốt hợp tác",
  CLOSED: "Đã đóng",
};

/** Các bước được phép chuyển tiếp từ mỗi trạng thái */
export const PARTNER_LEAD_TRANSITIONS: Record<PartnerLeadStatus, PartnerLeadStatus[]> = {
  NEW: ["CONTACTED", "CLOSED"],
  CONTACTED: ["CONSULTING", "CLOSED"],
  CONSULTING: ["CONVERTED", "CLOSED"],
  CONVERTED: [],
  CLOSED: ["CONTACTED"],
};

/** Bước bắt buộc ghi chú (lý do / kết quả) */
export const NOTE_REQUIRED_STATUSES: PartnerLeadStatus[] = ["CLOSED", "CONVERTED"];

export function canTransition(from: string, to: string): boolean {
  const allowed = PARTNER_LEAD_TRANSITIONS[from as PartnerLeadStatus];
  return Boolean(allowed?.includes(to as PartnerLeadStatus));
}

export const PARTNER_LEAD_AUDIT = {
  STATUS: "PARTNER_LEAD_STATUS",
  NOTE: "PARTNER_LEAD_NOTE",
  ACCOUNT: "PARTNER_LEAD_ACCOUNT",
  ASSESS: "PARTNER_LEAD_ASSESS",
} as const;

// ---------------------------------------------------------------------------
// Đánh giá cơ sở vật chất (hướng Gym Cộng đồng)
// ---------------------------------------------------------------------------

/** Hạng phòng gym — khớp GymTier ở common/constants/db-enums.ts */
export const GYM_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;
export type GymTierValue = (typeof GYM_TIERS)[number];

export const GYM_TIER_LABELS: Record<GymTierValue, string> = {
  TIER_1: "Standard",
  TIER_2: "Plus",
  TIER_3: "Premium",
};

/** Khu vực chụp ảnh cơ sở vật chất */
export const FACILITY_PHOTO_AREAS = [
  "WEIGHTS",
  "CARDIO",
  "LOCKER",
  "RECEPTION",
  "OTHER",
] as const;

/** Số ảnh tối thiểu / tối đa cho hướng Gym Cộng đồng */
export const COMMUNITY_MIN_PHOTOS = 3;
export const MAX_FACILITY_PHOTOS = 6;
/** Data URL ảnh đã nén ở client — giới hạn ~500KB/ảnh để vừa body 4MB */
export const MAX_PHOTO_DATA_URL_LENGTH = 700_000;
