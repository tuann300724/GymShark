export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  TRAINER: 'TRAINER',
  MEMBER: 'MEMBER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const MemberStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const TrainerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
} as const;
export type TrainerStatus = (typeof TrainerStatus)[keyof typeof TrainerStatus];

export const PackageType = {
  FIXED_TERM: 'FIXED_TERM',
  SESSION_BASED: 'SESSION_BASED',
} as const;
export type PackageType = (typeof PackageType)[keyof typeof PackageType];

export const MembershipStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOMO: 'MOMO',
  VNPAY: 'VNPAY',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const CheckInStatus = {
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
} as const;
export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];

export const CheckInMethod = {
  MANUAL: 'MANUAL',
  QR_CODE: 'QR_CODE',
  STAFF: 'STAFF',
  FACE_ID: 'FACE_ID',
} as const;
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];

export const ScheduleStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type ScheduleStatus = (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const SessionType = {
  PERSONAL_TRAINING: 'PERSONAL_TRAINING',
  GROUP_CLASS: 'GROUP_CLASS',
  FREE_TRAINING: 'FREE_TRAINING',
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const TrainerMemberStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type TrainerMemberStatus =
  (typeof TrainerMemberStatus)[keyof typeof TrainerMemberStatus];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const RoomType = {
  GYM_AREA: 'GYM_AREA',
  CARDIO: 'CARDIO',
  WEIGHT_AREA: 'WEIGHT_AREA',
  GROUP_CLASS: 'GROUP_CLASS',
  PERSONAL_TRAINING: 'PERSONAL_TRAINING',
  YOGA: 'YOGA',
  OTHER: 'OTHER',
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  MEAL_PLAN: 'MEAL_PLAN',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const FoodCategory = {
  PROTEIN: 'PROTEIN',
  CARBOHYDRATE: 'CARBOHYDRATE',
  VEGETABLE: 'VEGETABLE',
  FRUIT: 'FRUIT',
  DAIRY: 'DAIRY',
  FAT: 'FAT',
  DRINK: 'DRINK',
  SNACK: 'SNACK',
  OTHER: 'OTHER',
} as const;
export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];

export const MealPlanScope = {
  DAY: 'DAY',
  WEEK: 'WEEK',
} as const;
export type MealPlanScope = (typeof MealPlanScope)[keyof typeof MealPlanScope];

export const MealPlanStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
} as const;
export type MealPlanStatus = (typeof MealPlanStatus)[keyof typeof MealPlanStatus];

export const MealType = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACK: 'SNACK',
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];
