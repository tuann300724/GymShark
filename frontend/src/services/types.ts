// Shared API types (khớp với response backend)

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string | null;
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

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  description?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  openingHours?: string | null;
  status: string;
  createdAt?: string;
  _count?: {
    members: number;
    equipment: number;
    rooms: number;
    users: number;
    schedules: number;
  };
  rooms?: {
    id: string;
    code: string | null;
    name: string;
    type: string;
    capacity: number;
    status: string;
  }[];
}

export interface Room {
  id: string;
  branchId: string;
  code: string | null;
  name: string;
  type: string;
  capacity: number;
  floor?: string | null;
  description?: string | null;
  status: string;
  createdAt?: string;
  branch?: { id: string; name: string; code: string } | null;
  _count?: { equipment: number; schedules: number };
}

export interface BranchStats {
  branchId: string;
  totalMembers: number;
  activeMembers: number;
  totalTrainers: number;
  equipmentCount: number;
  equipmentByStatus: Record<string, number>;
  roomAvailable: number;
  roomCount: number;
  checkInsToday: number;
  revenueThisMonth: number;
  upcomingSessions: number;
}

export type EquipmentStatusValue =
  | 'OPERATIONAL'
  | 'UNDER_MAINTENANCE'
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'BROKEN'
  | 'RETIRED';

export type EquipmentCategoryValue = 'CARDIO' | 'FREE_WEIGHT' | 'MACHINE' | 'ACCESSORY' | 'OTHER';

export type EquipmentConditionValue = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  branchId: string;
  roomId?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  warrantyExpiry?: string | null;
  status: EquipmentStatusValue;
  condition: EquipmentConditionValue;
  lastMaintenanceAt?: string | null;
  nextMaintenanceAt?: string | null;
  description?: string | null;
  createdAt?: string;
  branch?: { id: string; name: string; code: string } | null;
  room?: { id: string; name: string; code?: string | null } | null;
  maintenances?: EquipmentMaintenance[];
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  type: string;
  maintenanceDate: string;
  cost?: string | null;
  description: string;
  performedBy?: string | null;
  status: string;
  nextDueDate?: string | null;
  createdAt?: string;
  equipment?: {
    id: string;
    code: string;
    name: string;
    status?: string;
    branch?: { id: string; name: string; code: string } | null;
  } | null;
}

export interface EquipmentListResponse {
  data: Equipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EquipmentStats {
  total: number;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  available: number;
  inUse: number;
  maintenance: number;
  broken: number;
  retired: number;
  alerts: {
    overdue: number;
    upcoming: number;
    broken: number;
    warrantyExpiring: number;
  };
  maintenanceThisMonth: number;
}

interface EquipmentAlertItem {
  id: string;
  code: string;
  name: string;
  status: EquipmentStatusValue;
  nextMaintenanceAt?: string | null;
  warrantyExpiry?: string | null;
  branch?: { id: string; name: string; code: string } | null;
  room?: { id: string; name: string } | null;
}

export interface EquipmentAlerts {
  counts: {
    overdue: number;
    upcoming: number;
    broken: number;
    warranty: number;
    total: number;
  };
  overdue: EquipmentAlertItem[];
  upcoming: EquipmentAlertItem[];
  broken: EquipmentAlertItem[];
  warranty: EquipmentAlertItem[];
}

export interface MaintenanceListResponse {
  data: EquipmentMaintenance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  branch?: { id: string; name: string; code: string } | null;
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
  branch?: { id: string; name: string; code: string } | null;
}

export interface CurrentCheckIn {
  checkedIn: boolean;
  checkInAt?: string | null;
  sinceMinutes?: number | null;
  checkInId?: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

interface CheckInResultData {
  id: string;
  checkInAt: string;
  checkOutAt?: string | null;
  status: string;
  method?: string;
  durationMinutes?: number | null;
  branch?: { id: string; name: string; code: string } | null;
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
  /** Chỉ có ở check-in bằng khuôn mặt: độ khớp cosine similarity đã chấm */
  face?: { similarity: number };
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
  branch?: { id: string; name: string; code: string } | null;
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
  branch?: { id: string; name: string; code: string } | null;
  method?: string;
}

interface DailyAttendanceItem {
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

interface MemberAttendanceRow {
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
    branch?: { id: string; name: string; code: string } | null;
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

/** Response GET /payments (admin) */
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

/** Response GET /reports/revenue */
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

// ======================================================
// STEP 8 — Khuyến mãi (Promotion)
// ======================================================

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
  endAt: string;
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

export interface PublicPromotion {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number | string;
  maxDiscount: number | string | null;
  minOrderAmount: number | string | null;
  endAt: string;
}

// ======================================================
// STEP 8 — Thông báo (Notification)
// ======================================================

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

// ======================================================
// STEP 8 — Báo cáo (Reporting)
// ======================================================

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
  totalBranches: number;
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
    branch: { id: string; name: string } | null;
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
    branch: { id: string; name: string } | null;
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
  byBranch: { branchId: string; branchName: string; count: number }[];
  /** Số lượt theo hình thức check-in (MANUAL / STAFF / QR_CODE / FACE_ID) */
  byMethod: { method: string; count: number }[];
}

export interface EquipmentStatsReport {
  total: number;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  available: number;
  inUse: number;
  maintenance: number;
  broken: number;
  retired: number;
  alerts: { overdue: number; upcoming: number; broken: number; warrantyExpiring: number };
  maintenanceThisMonth: number;
}

export interface BranchOverviewReport {
  data: {
    id: string;
    code: string;
    name: string;
    address: string;
    status: string;
    openingHours: string | null;
    members: number;
    activeMembers: number;
    equipment: number;
    rooms: number;
    trainers: number;
    checkInsThisMonth: number;
    checkInsToday: number;
    revenueThisMonth: number;
    upcomingSessions: number;
  }[];
  total: number;
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

type SessionType = 'PERSONAL_TRAINING' | 'GROUP_CLASS' | 'FREE_TRAINING';
type ScheduleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

interface TrainerUser {
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

interface TrainerMemberSummary {
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

interface SessionMemberInfo {
  id: string;
  code: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

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
  branchId?: string | null;
  roomId?: string | null;
  createdAt?: string;
  trainer?: SessionTrainerInfo | null;
  member?: SessionMemberInfo | null;
  branch?: { id: string; name: string } | null;
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

/* -------------------------------------------------------------------------- */
/* Nhật ký hoạt động (Audit log — ADMIN/MANAGER)                               */
/* -------------------------------------------------------------------------- */

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
