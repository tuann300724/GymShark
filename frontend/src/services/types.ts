/* Shared API types (khớp với response backend) */

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  memberId?: string | null;
  user: UserInfo;
}

export interface MemberRegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  address?: string;
  emergencyContact?: string;
  /** Mã giới thiệu của hội viên đã giới thiệu (không bắt buộc) */
  referralCode?: string;
}

/** Bước 2 đăng ký hội viên — nhập mã xác minh để tạo tài khoản */
export interface MemberRegisterVerifyPayload {
  email: string;
  code: string;
}

export interface RegisterCodeResponse {
  message: string;
  /** Email đã gửi mã */
  email: string;
  /** Thời hạn mã (giây) — UI dùng để đếm ngược */
  expiresInSeconds: number;
  /** Phải chờ bao lâu mới được gửi lại mã (giây) */
  resendAfterSeconds: number;
}

export interface MemberRegisterVerifyResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    status: string;
  };
  member: {
    id: string;
    code: string;
    fullName: string;
    email?: string | null;
    phone: string;
    status: string;
  };
}

export interface MembershipPackage {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  features?: { title?: string; items: string[] } | null;
  durationDays: number;
  price: string;
  sessions?: number | null;
  type: 'FIXED_TERM' | 'SESSION_BASED';
  status: string;
  _count?: { memberships: number };
}

export interface PublicTrainer {
  id: string;
  specialization: string;
  certification?: string | null;
  experienceYears: number;
  bio?: string | null;
  rating: number;
  hourlyRate?: string | null;
  status: string;
  user: { id: string; fullName: string; phone?: string | null; avatarUrl?: string | null };
}

export interface PublicSchedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  trainer?: {
    user: { fullName: string; avatarUrl?: string | null };
  } | null;
  room?: { id: string; name: string; capacity: number } | null;
}

export interface Room {
  id: string;
  code: string | null;
  name: string;
  type: string;
  capacity: number;
  floor?: string | null;
  description?: string | null;
  status: string;
  createdAt?: string;
  _count?: { schedules: number };
}

interface MemberProfile {
  id: string;
  code: string;
  fullName: string;
  email?: string | null;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  emergencyContact?: string | null;
  status: string;
  joinedAt: string;
}

export interface BodyMetric {
  id?: string;
  weightKg?: number;
  bodyFatPercent?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  note?: string;
  recordedAt?: string;
}

export interface ClassBookingRecord {
  id: string;
  title: string;
  type: 'PERSONAL_TRAINING' | 'GROUP_CLASS' | 'FREE_TRAINING';
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  description?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberMe {
  isTrainer: boolean;
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  member: MemberProfile | null;
}

export interface Membership {
  id: string;
  memberId: string;
  packageId: string;
  startDate: string;
  endDate: string;
  price: string;
  discountAmount?: string | null;
  finalAmount?: string | null;
  remainingSessions?: number | null;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  createdAt: string;
  package?: MembershipPackage;
  payments?: { id: string; amount: string; method: string; status: string; createdAt: string }[];
}

export interface MemberCheckIn {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  method?: string;
  notes?: string | null;
  durationMinutes?: number | null;
}

export interface CurrentCheckIn {
  checkedIn: boolean;
  checkInAt?: string | null;
  sinceMinutes?: number | null;
  checkInId?: string | null;
}

interface CheckInResultData {
  id: string;
  checkInAt: string;
  checkOutAt?: string | null;
  status: string;
  method?: string;
  durationMinutes?: number | null;
  member?: {
    id: string;
    code: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  membership?: { id: string; packageName?: string | null } | null;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  data: CheckInResultData;
  /** Chỉ có ở check-in bằng khuôn mặt: độ khớp cosine + ảnh tham chiếu để lễ tân đối chiếu */
  face?: { similarity: number; imageData?: string | null };
}

export interface AdminCheckInRecord {
  id: string;
  memberId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  method?: string;
  notes?: string | null;
  durationMinutes?: number | null;
  member?: {
    id: string;
    code: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface CheckInsListResponse {
  data: AdminCheckInRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CurrentlyInsideRecord {
  id: string;
  memberId: string;
  member?: {
    id: string;
    code: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  packageName?: string | null;
  checkInTime: string;
  durationMinutes?: number | null;
  method?: string;
}

export interface DailyAttendanceItem {
  date: string;
  checkIns: number;
  checkOuts: number;
}

export interface DailyAttendanceReport {
  data: DailyAttendanceItem[];
  summary: {
    totalCheckIns: number;
    totalCheckOuts: number;
    currentlyInside: number;
  };
}

interface HourlyAttendancePoint {
  hour: number;
  count: number;
}

export interface HourlyAttendanceReport {
  date: string;
  data: HourlyAttendancePoint[];
  peakHour: number | null;
  peakCount: number;
}

export interface MemberAttendanceRow {
  member: {
    id: string;
    code: string;
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  totalVisits: number;
  avgDuration: number;
  lastVisit: string | null;
}

export interface MemberAttendanceReport {
  from: string;
  to: string;
  data: MemberAttendanceRow[];
}

export interface Payment {
  id: string;
  code: string;
  amount: string;
  currency?: string;
  method: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | string;
  transactionRef?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: { id: string; fullName: string; role?: string } | null;
  createdAt: string;
  membership?: {
    id?: string;
    startDate?: string | null;
    endDate?: string | null;
    status?: string | null;
    package?: { id: string; name: string; durationDays?: number } | null;
  } | null;
  promotion?: { id: string; code: string; name: string } | null;
  invoice?: { id: string; invoiceNumber: string; status: string } | null;
}

export interface PaymentDetail extends Payment {
  member?: {
    id: string;
    code: string;
    fullName: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    joinedAt?: string | null;
  };
  invoice?: Invoice | null;
  // Chỉ có khi phương thức BANK_TRANSFER
  bankInfo?: {
    bankName: string;
    shortName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    transferContent: string;
  } | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  discount: string;
  total: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | string;
  issuedAt: string;
  dueDate?: string | null;
  createdAt: string;
  membership?: {
    startDate?: string | null;
    endDate?: string | null;
    package?: { id: string; name: string; durationDays?: number } | null;
  } | null;
  payment?: {
    id: string;
    code: string;
    method: string;
    status: string;
    paidAt?: string | null;
    transactionRef?: string | null;
  } | null;
}

export interface AdminPaymentList {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  stats: {
    totalRevenue: string;
    revenueToday: string;
    pendingCount: number;
    paidCount: number;
    failedCount: number;
    cancelledCount: number;
    refundedCount: number;
    refundedTotal: string;
  };
}

export interface BankInfo {
  bankName: string;
  shortName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  note: string;
  transferContentFormat: string;
  gateways: { method: string; manualConfirmation: boolean; integrated: boolean }[];
}

export interface RevenueReport {
  stats: {
    revenueToday: string;
    revenueThisWeek: string;
    revenueThisMonth: string;
    revenueThisYear: string;
    totalRevenue: string;
    totalPaidCount: number;
    pendingCount: number;
    failedCount: number;
    cancelledCount: number;
    refundedThisMonth: string;
    refundedThisMonthCount: number;
    refundedCount: number;
  };
  byDay: { date: string; revenue: number; count: number }[];
  byMonth: { month: string; revenue: number; count: number }[];
  byMethod: { method: string; revenue: number; count: number }[];
  byPackage: { packageId: string; packageName: string; revenue: number; count: number }[];
  recentPayments: {
    id: string;
    code: string;
    amount: string;
    method: string;
    paidAt: string | null;
    member: { id: string; code: string; fullName: string };
    membership: { package: { id: string; name: string } } | null;
  }[];
  totalTransactions: number;
  data: { amount: string; createdAt: string }[];
}

export interface PublicPromotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number | string;
  maxDiscount: number | string | null;
  minOrderAmount: number | string | null;
  endAt: string | null;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | string;
  discountValue: number | string;
  maxDiscount: number | string | null;
  minOrderAmount: number | string | null;
  startAt: string;
  endAt: string | null;
  usageLimit: number | null;
  perMemberLimit: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | string;
  usage: number;
  usagePaid: number;
  remaining: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionStats {
  activeCount: number;
  expiringSoon: number;
  expiredCount: number;
  totalUsage: number;
  totalDiscount: number | string;
}

export interface PromotionListResponse {
  data: Promotion[];
  total: number;
  stats: PromotionStats;
  active: number;
  expiringSoon: number;
  expired: number;
  totalUsage: number;
  totalDiscount: number | string;
}

export interface PromotionValidateResult {
  valid: boolean;
  message?: string;
  promotion?: {
    id: string;
    code: string;
    name: string;
    discountType: string;
    discountValue: number | string;
  };
  subtotal?: number | string;
  discount?: number | string;
  total?: number | string;
}

export interface PromotionUsageRecord {
  id: string;
  paymentCode: string;
  status: string;
  amount: number | string;
  discountAmount: number | string | null;
  paidAt: string | null;
  createdAt: string;
  method: string;
  member: { id: string; code: string; fullName: string; phone: string | null };
  packageName: string | null;
}

export interface PromotionUsageResponse {
  promotion: { id: string; code: string; name: string };
  stats: {
    totalUsage: number;
    paidUsage: number;
    remaining: number | null;
    discountTotal: number;
  };
  data: PromotionUsageRecord[];
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  link?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  member?: { id: string; code: string; fullName: string; phone?: string | null } | null;
  user?: { id: string; fullName: string; email: string; role: string } | null;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  unreadCount: number;
  readCount: number;
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ReportSummary {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  pendingMemberships: number;
  pendingPayments: number;
  newMembersThisMonth: number;
  totalRevenue: number | string;
  revenueThisMonth: number | string;
  totalTrainers: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  currentlyInside: number;
}

export interface OverviewReport {
  summary: ReportSummary;
  revenue: {
    today: number | string;
    week: number | string;
    month: number | string;
    year: number | string;
    total: number | string;
  };
  attendance: {
    totalCheckIns: number;
    totalCheckOuts: number;
    peakHour: number | null;
    peakCount: number;
    avgPerDay: number;
  };
}

export interface MembersReport {
  stats: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    pendingMemberships: number;
  };
  byStatus: { status: string; count: number }[];
  growthByMonth: { month: string; count: number }[];
  recent: {
    id: string;
    code: string;
    fullName: string;
    joinedAt: string;
    _count: { payments: number; checkIns: number };
  }[];
}

export interface MembershipsReport {
  stats: {
    expiredCount: number;
    pendingCount: number;
    byMonth: { month: string; count: number }[];
  };
  byStatus: { status: string; count: number }[];
  packagePopularity: {
    packageId: string;
    packageName: string;
    price: number | string;
    count: number;
  }[];
}

export interface TrainersReport {
  stats: { totalTrainers: number; activeTrainers: number };
  data: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    status: string;
    memberCount: number;
    scheduleCount: number;
    completedSessions: number;
  }[];
}

export interface AttendanceReport {
  from: string;
  to: string;
  stats: {
    totalCheckIns: number;
    totalCheckOuts: number;
    peakHour: number | null;
    peakCount: number;
    avgPerDay: number;
  };
  byDay: { date: string; checkIns: number; checkOuts: number }[];
  byHour: { hour: number; count: number }[];
  byWeekday: { day: number; label: string; count: number }[];
  /** Số lượt theo hình thức check-in (MANUAL / STAFF / QR_CODE / FACE_ID) */
  byMethod: { method: string; count: number }[];
}

export interface MemberStats {
  isTrainer: boolean;
  totalCheckIns: number;
  monthCheckIns: number;
  weekCheckIns: number;
  remainingDays: number;
  membershipProgress: number;
  ptSessions: number;
  upcomingSessions?: number;
  monthSessions?: number;
  completedSessions?: number;
  trainer?: TrainerPublic | null;
  paymentSummary?: {
    totalSpent: string;
    paidCount: number;
    pendingCount: number;
    lastPayment: {
      id: string;
      code: string;
      amount: string;
      method: string;
      paidAt: string | null;
    } | null;
  };
  currentMembership: {
    id: string;
    packageName: string;
    price: string;
    startDate: string;
    endDate: string;
    status: string;
    remainingDays: number;
    progress: number;
  } | null;
  pendingMembership?: {
    id: string;
    packageName: string;
    amount: string;
    createdAt: string;
    status: string;
  } | null;
}

interface SessionMemberInfo {
  id: string;
  code: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Trainer / Training Sessions (Step 5)
// ---------------------------------------------------------------------------

export interface TrainerPublic {
  id: string;
  specialization: string;
  certification?: string | null;
  experienceYears: number;
  bio?: string | null;
  rating: number;
  hourlyRate?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth?: string | null;
  status: string;
  user: TrainerUser;
}

export interface TrainerUser {
  id: string;
  email?: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string;
}

export interface TrainerListItem extends TrainerPublic {
  _count?: {
    trainerMembers?: number;
    schedules?: number;
  };
}

export interface TrainerListResponse {
  data: TrainerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrainerMemberSummary {
  id: string;
  code: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string;
  memberships?: {
    id: string;
    status: string;
    package?: { id: string; name: string } | null;
  }[];
}

export interface TrainerAssignment {
  id: string;
  trainerId: string;
  memberId: string;
  startDate: string;
  endDate?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  note?: string | null;
  createdAt: string;
  trainer?: { id: string; user: TrainerUser };
  member?: TrainerMemberSummary;
}

export interface TrainerDetail extends TrainerPublic {
  trainerMembers?: TrainerAssignment[];
  schedules?: TrainingSession[];
  stats?: {
    totalSessions: number;
    activeMembers: number;
    upcomingSessions: number;
    completedSessions: number;
  };
}

type SessionType = 'PERSONAL_TRAINING' | 'GROUP_CLASS' | 'FREE_TRAINING';
type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface SessionTrainerInfo {
  id: string;
  specialization?: string;
  user: { id: string; fullName: string; phone?: string | null; avatarUrl?: string | null };
}

export interface TrainingSession {
  id: string;
  title: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  description?: string | null;
  notes?: string | null;
  cancellationNote?: string | null;
  completedAt?: string | null;
  roomId?: string | null;
  createdAt?: string;
  trainer?: SessionTrainerInfo | null;
  member?: SessionMemberInfo | null;
  room?: { id: string; name: string; capacity?: number | null } | null;
}

export interface SessionProgress {
  id: string;
  sessionId: string;
  memberId: string;
  trainerId: string;
  note: string;
  performance?: string | null;
  recommendation?: string | null;
  createdAt: string;
  trainer?: { id: string; user: { id: string; fullName: string; avatarUrl?: string | null } };
}

export interface SessionDetail extends TrainingSession {
  progressNotes?: SessionProgress[];
}

export interface ClassSessionItem {
  id: string;
  title: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  description?: string | null;
  notes?: string | null;
  capacity: number;
  bookedCount: number;
  slotsLeft: number;
  booked: boolean;
  myBookingId?: string | null;
  trainer?: SessionTrainerInfo | null;
  room?: { id: string; name: string; capacity?: number | null } | null;
}

export interface SessionsListResponse {
  data: TrainingSession[];
  total: number;
  page: number;
  limit: number;
}

export interface MySessionsResponse {
  data: TrainingSession[];
  upcoming: number;
}

export interface TrainerSessionsResponse {
  data: TrainingSession[];
  stats: {
    today: number;
    upcoming: number;
    completed: number;
  };
}

interface AuditLogUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
  user?: AuditLogUser | null;
}

export interface AuditLogsListResponse {
  data: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Danh sách action duy nhất phục vụ bộ lọc */
  actions: string[];
}
