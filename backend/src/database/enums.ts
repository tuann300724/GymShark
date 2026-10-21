/**
 * Enum TypeScript dùng chung cho toàn backend (TypeORM + service).
 * Khớp 1-1 với các enum trong prisma/schema.prisma — nhưng ở đây là string enum
 * TypeScript, vì SQL Server không có kiểu enum native (khác PostgreSQL).
 * Khi port service sang TypeORM, import từ file này thay vì '@prisma/client'.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  TRAINER = 'TRAINER',
  MEMBER = 'MEMBER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum TrainerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export enum PackageType {
  FIXED_TERM = 'FIXED_TERM',
  SESSION_BASED = 'SESSION_BASED',
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOMO = 'MOMO',
  VNPAY = 'VNPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum CheckInStatus {
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
}

export enum CheckInMethod {
  MANUAL = 'MANUAL',
  QR_CODE = 'QR_CODE',
  STAFF = 'STAFF',
  FACE_ID = 'FACE_ID',
}

export enum ScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum SessionType {
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  GROUP_CLASS = 'GROUP_CLASS',
  FREE_TRAINING = 'FREE_TRAINING',
}

export enum TrainerMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum EquipmentStatus {
  OPERATIONAL = 'OPERATIONAL',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN',
  RETIRED = 'RETIRED',
}

export enum EquipmentCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceType {
  ROUTINE = 'ROUTINE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  REPLACEMENT = 'REPLACEMENT',
}

export enum RoomType {
  GYM_AREA = 'GYM_AREA',
  CARDIO = 'CARDIO',
  WEIGHT_AREA = 'WEIGHT_AREA',
  GROUP_CLASS = 'GROUP_CLASS',
  PERSONAL_TRAINING = 'PERSONAL_TRAINING',
  YOGA = 'YOGA',
  OTHER = 'OTHER',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  MEAL_PLAN = 'MEAL_PLAN',
  SYSTEM = 'SYSTEM',
}

export enum FoodCategory {
  PROTEIN = 'PROTEIN',
  CARBOHYDRATE = 'CARBOHYDRATE',
  VEGETABLE = 'VEGETABLE',
  FRUIT = 'FRUIT',
  DAIRY = 'DAIRY',
  FAT = 'FAT',
  DRINK = 'DRINK',
  SNACK = 'SNACK',
  OTHER = 'OTHER',
}

export enum MealPlanScope {
  DAY = 'DAY',
  WEEK = 'WEEK',
}

export enum MealPlanStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}
