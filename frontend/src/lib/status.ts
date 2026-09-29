// Nhãn + màu badge cho các trạng thái (dùng chung toàn frontend)

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';

export const MEMBERSHIP_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  ACTIVE: { label: 'Đang hoạt động', variant: 'success' },
  EXPIRED: { label: 'Hết hạn', variant: 'info' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  SUSPENDED: { label: 'Tạm khóa', variant: 'outline' },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Chờ thanh toán', variant: 'warning' },
  PAID: { label: 'Đã thanh toán', variant: 'success' },
  COMPLETED: { label: 'Đã thanh toán', variant: 'success' }, // tương thích dữ liệu cũ
  FAILED: { label: 'Thất bại', variant: 'destructive' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  REFUNDED: { label: 'Hoàn tiền', variant: 'info' },
};

export const MEMBER_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Hoạt động', variant: 'success' },
  INACTIVE: { label: 'Ngừng hoạt động', variant: 'outline' },
  SUSPENDED: { label: 'Bị khóa', variant: 'destructive' },
  EXPIRED: { label: 'Hết hạn', variant: 'warning' },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ tín dụng/ghi nợ',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
};

export const TRAINER_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Đang hoạt động', variant: 'success' },
  INACTIVE: { label: 'Ngừng hoạt động', variant: 'destructive' },
  ON_LEAVE: { label: 'Tạm nghỉ', variant: 'warning' },
};

export const SESSION_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: 'Chờ diễn ra', variant: 'info' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
  NO_SHOW: { label: 'Vắng mặt', variant: 'outline' },
};

export const SESSION_TYPE_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PERSONAL_TRAINING: { label: 'Kèm riêng (PT)', variant: 'success' },
  GROUP_CLASS: { label: 'Lớp nhóm', variant: 'info' },
  FREE_TRAINING: { label: 'Tự do', variant: 'outline' },
};

export const ASSIGNMENT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Đang phụ trách', variant: 'success' },
  INACTIVE: { label: 'Đã kết thúc', variant: 'outline' },
};

// ---------------------------------------------------------------------------
// STEP 7 — Branch / Room / Equipment / Maintenance
// ---------------------------------------------------------------------------

export const BRANCH_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Đang hoạt động', variant: 'success' },
  INACTIVE: { label: 'Ngừng hoạt động', variant: 'destructive' },
};

export const ROOM_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  AVAILABLE: { label: 'Sẵn sàng', variant: 'success' },
  INACTIVE: { label: 'Đã đóng', variant: 'destructive' },
  MAINTENANCE: { label: 'Đang bảo trì', variant: 'warning' },
  OCCUPIED: { label: 'Đang sử dụng', variant: 'info' },
};

export const ROOM_TYPE_META: Record<string, string> = {
  GYM_AREA: 'Khu tập Gym',
  CARDIO: 'Khu Cardio',
  WEIGHT_AREA: 'Khu tạ',
  GROUP_CLASS: 'Phòng lớp nhóm',
  PERSONAL_TRAINING: 'Phòng PT riêng',
  YOGA: 'Phòng Yoga',
  OTHER: 'Khác',
};

export const EQUIPMENT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  OPERATIONAL: { label: 'Hoạt động', variant: 'success' }, // legacy
  UNDER_MAINTENANCE: { label: 'Đang bảo trì', variant: 'warning' }, // legacy
  AVAILABLE: { label: 'Sẵn sàng', variant: 'success' },
  IN_USE: { label: 'Đang sử dụng', variant: 'info' },
  MAINTENANCE: { label: 'Đang bảo trì', variant: 'warning' },
  BROKEN: { label: 'Hỏng', variant: 'destructive' },
  RETIRED: { label: 'Đã thanh lý', variant: 'outline' },
};

export const EQUIPMENT_CONDITION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  EXCELLENT: { label: 'Xuất sắc', variant: 'success' },
  GOOD: { label: 'Tốt', variant: 'info' },
  FAIR: { label: 'Khá', variant: 'warning' },
  POOR: { label: 'Kém', variant: 'destructive' },
};

export const EQUIPMENT_CATEGORY_META: Record<string, string> = {
  CARDIO: 'Cardio',
  FREE_WEIGHT: 'Tạ tự do',
  MACHINE: 'Máy tập',
  ACCESSORY: 'Phụ kiện',
  OTHER: 'Khác',
};

export const MAINTENANCE_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: 'Đã lên lịch', variant: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', variant: 'warning' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
};

export const MAINTENANCE_TYPE_META: Record<string, string> = {
  ROUTINE: 'Định kỳ',
  REPAIR: 'Sửa chữa',
  INSPECTION: 'Kiểm tra',
  REPLACEMENT: 'Thay thế',
};

// ============ STEP 8 — Khuyến mãi & Thông báo ============

export const PROMOTION_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: 'Đang chạy', variant: 'success' },
  INACTIVE: { label: 'Ngừng kích hoạt', variant: 'outline' },
  EXPIRED: { label: 'Hết hạn', variant: 'info' },
};

export const NOTIFICATION_TYPE_META: Record<string, { label: string; variant: BadgeVariant }> = {
  PAYMENT: { label: 'Thanh toán', variant: 'success' },
  MEMBERSHIP: { label: 'Gói tập', variant: 'info' },
  CHECKIN: { label: 'Check-in', variant: 'warning' },
  TRAINING: { label: 'Lịch tập', variant: 'warning' },
  PROMOTION: { label: 'Khuyến mãi', variant: 'info' },
  EQUIPMENT: { label: 'Thiết bị', variant: 'destructive' },
  SYSTEM: { label: 'Hệ thống', variant: 'default' },
};

export const ANNOUNCEMENT_TARGET_LABEL: Record<string, string> = {
  ALL: 'Tất cả mọi người',
  MEMBERS: 'Hội viên',
  TRAINERS: 'Huấn luyện viên',
  STAFF: 'Nhân viên lễ tân',
  MANAGERS: 'Quản lý',
  SPECIFIC_BRANCH: 'Theo chi nhánh',
};

// ============ STEP 9 — Nhật ký hoạt động (Audit log) ============

/** Nhãn + màu badge cho từng hành động ghi nhật ký */
export const AUDIT_ACTION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  // Tài khoản & bảo mật
  AUTH_LOGIN: { label: 'Đăng nhập', variant: 'info' },
  PASSWORD_CHANGE: { label: 'Đổi mật khẩu', variant: 'warning' },
  USER_CREATE: { label: 'Tạo tài khoản', variant: 'default' },

  // Hội viên
  MEMBER_REGISTER: { label: 'Đăng ký hội viên', variant: 'success' },
  MEMBER_UPDATE: { label: 'Cập nhật hội viên', variant: 'default' },
  MEMBER_PROFILE_UPDATE: { label: 'Cập nhật hồ sơ cá nhân', variant: 'default' },

  // Gói tập
  MEMBERSHIP_STATUS_CHANGE: { label: 'Đổi trạng thái gói tập', variant: 'warning' },
  MEMBERSHIP_EXTEND: { label: 'Gia hạn gói tập', variant: 'info' },
  MEMBERSHIP_REGISTER: { label: 'Hội viên đăng ký gói', variant: 'info' },
  MEMBERSHIP_RENEW: { label: 'Hội viên gia hạn gói', variant: 'info' },

  // Thanh toán
  PAYMENT_CONFIRM: { label: 'Xác nhận thanh toán', variant: 'success' },
  PAYMENT_REJECT: { label: 'Từ chối thanh toán', variant: 'destructive' },
  PAYMENT_REFUND: { label: 'Hoàn tiền', variant: 'destructive' },

  // Check-in
  CHECK_IN: { label: 'Check-in', variant: 'success' },
  CHECK_OUT: { label: 'Check-out', variant: 'default' },

  // Sinh trắc học (khuôn mặt)
  FACE_ENROLL: { label: 'Đăng ký khuôn mặt', variant: 'success' },
  FACE_DELETE: { label: 'Xoá dữ liệu khuôn mặt', variant: 'destructive' },

  // Huấn luyện viên
  TRAINER_CREATE: { label: 'Tạo huấn luyện viên', variant: 'success' },
  TRAINER_UPDATE: { label: 'Cập nhật huấn luyện viên', variant: 'default' },
  TRAINER_REMOVE: { label: 'Ngừng hoạt động HLV', variant: 'warning' },

  // Lịch tập
  SCHEDULE_CREATE: { label: 'Tạo buổi tập', variant: 'success' },
  SCHEDULE_UPDATE: { label: 'Sửa buổi tập', variant: 'default' },
  SCHEDULE_CANCEL: { label: 'Hủy buổi tập', variant: 'destructive' },
  SCHEDULE_COMPLETE: { label: 'Hoàn thành buổi tập', variant: 'success' },
  SCHEDULE_DELETE: { label: 'Xóa buổi tập', variant: 'destructive' },

  // Thiết bị & bảo trì
  EQUIPMENT_CREATE: { label: 'Thêm thiết bị', variant: 'success' },
  EQUIPMENT_UPDATE: { label: 'Cập nhật thiết bị', variant: 'default' },
  EQUIPMENT_STATUS_CHANGE: { label: 'Đổi trạng thái thiết bị', variant: 'warning' },
  EQUIPMENT_RETIRE: { label: 'Thanh lý thiết bị', variant: 'warning' },
  MAINTENANCE_CREATE: { label: 'Tạo yêu cầu bảo trì', variant: 'info' },
  MAINTENANCE_COMPLETE: { label: 'Hoàn tất bảo trì', variant: 'success' },
  MAINTENANCE_CANCEL: { label: 'Hủy yêu cầu bảo trì', variant: 'destructive' },

  // Khuyến mãi
  PROMOTION_CREATE: { label: 'Tạo mã khuyến mãi', variant: 'success' },
  PROMOTION_UPDATE: { label: 'Cập nhật mã khuyến mãi', variant: 'default' },
  PROMOTION_ACTIVATE: { label: 'Kích hoạt khuyến mãi', variant: 'success' },
  PROMOTION_DEACTIVATE: { label: 'Ngừng khuyến mãi', variant: 'warning' },
};

/** Nhãn cho loại đối tượng bị tác động */
export const AUDIT_ENTITY_LABEL: Record<string, string> = {
  Auth: 'Bảo mật',
  User: 'Tài khoản',
  Member: 'Hội viên',
  Membership: 'Gói tập',
  Payment: 'Thanh toán',
  CheckIn: 'Check-in',
  Trainer: 'Huấn luyện viên',
  TrainingSchedule: 'Buổi tập',
  Equipment: 'Thiết bị',
  EquipmentMaintenance: 'Bảo trì',
  Promotion: 'Khuyến mãi',
  Face: 'Sinh trắc học',
};

/** Nhãn vai trò người thực hiện (hiển thị trong nhật ký) */
export const AUDIT_ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Lễ tân',
  TRAINER: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
};
