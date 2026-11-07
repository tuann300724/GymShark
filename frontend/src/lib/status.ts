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

/**
 * Trạng thái hiển thị của buổi tập theo thời gian thực.
 * Buổi SCHEDULED nhưng đã qua khung giờ thì không được phép hiện "Chờ diễn ra":
 * - chưa tới giờ → "Chờ diễn ra"
 * - đang trong khung giờ → "Đang diễn ra"
 * - đã qua giờ kết thúc → "Đã kết thúc" (HLV/admin vẫn có thể chốt Hoàn thành sau)
 */
export function getSessionDisplayStatus(
  status: string,
  startTime?: string | Date | null,
  endTime?: string | Date | null,
): { label: string; variant: BadgeVariant } {
  if (status === 'SCHEDULED' && startTime && endTime) {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (now >= end) return { label: 'Đã kết thúc', variant: 'outline' };
    if (now >= start) return { label: 'Đang diễn ra', variant: 'success' };
  }
  return SESSION_STATUS_META[status] || { label: status, variant: 'outline' };
}

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
// STEP 7 — Rooms
// ---------------------------------------------------------------------------

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
  SYSTEM: { label: 'Hệ thống', variant: 'default' },
};

export const ANNOUNCEMENT_TARGET_LABEL: Record<string, string> = {
  ALL: 'Tất cả mọi người',
  MEMBERS: 'Hội viên',
  TRAINERS: 'Huấn luyện viên',
  STAFF: 'Nhân viên lễ tân',
  MANAGERS: 'Quản lý',
  ADMIN: 'Quản trị viên',
};

// ============ STEP 9 — Nhật ký hoạt động (Audit log) ============

/** Nhãn + màu badge cho từng hành động ghi nhật ký */
export const AUDIT_ACTION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  // Tài khoản & bảo mật
  AUTH_LOGIN: { label: 'Đăng nhập', variant: 'info' },
  PASSWORD_CHANGE: { label: 'Đổi mật khẩu', variant: 'warning' },
  PASSWORD_RESET_REQUEST: { label: 'Yêu cầu đặt lại mật khẩu', variant: 'info' },
  PASSWORD_RESET_SUCCESS: { label: 'Đặt lại mật khẩu thành công', variant: 'success' },
  USER_CREATE: { label: 'Tạo tài khoản', variant: 'default' },

  // Xác minh email khi đăng ký hội viên
  MEMBER_REGISTER_CODE_SENT: { label: 'Gửi mã xác minh đăng ký', variant: 'info' },
  MEMBER_REGISTER_CODE_RESENT: { label: 'Gửi lại mã xác minh', variant: 'info' },
  MEMBER_REGISTER_CODE_INVALID: { label: 'Nhập sai mã xác minh', variant: 'destructive' },

  // Hội viên
  MEMBER_CREATE: { label: 'Tạo hội viên tại quầy', variant: 'success' },
  MEMBER_REGISTER: { label: 'Đăng ký hội viên', variant: 'success' },
  MEMBER_UPDATE: { label: 'Cập nhật hội viên', variant: 'default' },
  MEMBER_PROFILE_UPDATE: { label: 'Cập nhật hồ sơ cá nhân', variant: 'default' },

  // Gói tập
  MEMBERSHIP_STATUS_CHANGE: { label: 'Đổi trạng thái gói tập', variant: 'warning' },
  MEMBERSHIP_EXTEND: { label: 'Gia hạn gói tập', variant: 'info' },
  MEMBERSHIP_REGISTER: { label: 'Hội viên đăng ký gói', variant: 'info' },
  MEMBERSHIP_RENEW: { label: 'Hội viên gia hạn gói', variant: 'info' },
  MEMBERSHIP_CANCEL_REQUEST: { label: 'Hội viên hủy yêu cầu', variant: 'destructive' },

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

  // Khuyến mãi
  PROMOTION_CREATE: { label: 'Tạo mã khuyến mãi', variant: 'success' },
  PROMOTION_UPDATE: { label: 'Cập nhật mã khuyến mãi', variant: 'default' },
  PROMOTION_ACTIVATE: { label: 'Kích hoạt khuyến mãi', variant: 'success' },
  PROMOTION_DEACTIVATE: { label: 'Ngừng khuyến mãi', variant: 'warning' },

  // Ca làm & chốt quỹ
  STAFF_SHIFT_CREATE: { label: 'Phân công ca làm', variant: 'success' },
  STAFF_SHIFT_UPDATE: { label: 'Cập nhật ca làm', variant: 'default' },
  STAFF_SHIFT_DELETE: { label: 'Xóa ca làm', variant: 'destructive' },
  STAFF_SHIFT_CANCEL: { label: 'Hủy ca làm', variant: 'destructive' },
  STAFF_SHIFT_START: { label: 'Bắt đầu ca làm', variant: 'info' },
  STAFF_SHIFT_SETTLE: { label: 'Kiểm quỹ và chốt ca', variant: 'success' },

  // Kinh doanh nước uống
  BEVERAGE_PRODUCT_CREATE: { label: 'Tạo sản phẩm nước uống', variant: 'success' },
  BEVERAGE_PRODUCT_UPDATE: { label: 'Cập nhật sản phẩm nước uống', variant: 'default' },
  BEVERAGE_PRODUCT_DEACTIVATE: { label: 'Ngừng kinh doanh nước uống', variant: 'warning' },
  BEVERAGE_IMPORT_CREATE: { label: 'Tạo phiếu nhập nước uống', variant: 'info' },
  BEVERAGE_IMPORT_RECEIVE: { label: 'Xác nhận nhập nước uống', variant: 'success' },
  BEVERAGE_SALE_COMPLETE: { label: 'Thanh toán hóa đơn nước uống', variant: 'success' },
  BEVERAGE_STOCK_ADJUST: { label: 'Điều chỉnh tồn kho nước uống', variant: 'warning' },
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
  Promotion: 'Khuyến mãi',
  Face: 'Sinh trắc học',
  StaffShift: 'Ca làm',
  BeverageProduct: 'Sản phẩm nước uống',
  BeverageImport: 'Phiếu nhập nước uống',
  BeverageSale: 'Hóa đơn nước uống',
  BeverageStockMovement: 'Biến động kho nước uống',
};

/** Nhãn vai trò người thực hiện (hiển thị trong nhật ký) */
export const AUDIT_ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Lễ tân',
  TRAINER: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
};
