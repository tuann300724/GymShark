// Shared API types (khớp với response backend)

export interface UserInfo {
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
  openingHours?: string | null;
  status: string;
}

export interface MemberProfile {
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
  remainingSessions?: number | null;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  package?: MembershipPackage;
  payments?: { id: string; amount: string; method: string; status: string; createdAt: string }[];
}

export interface MemberCheckIn {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
  notes?: string | null;
  branch?: { id: string; name: string; code: string } | null;
}

export interface MemberSchedule {
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

export interface Payment {
  id: string;
  code: string;
  amount: string;
  method: string;
  status: string;
  transactionRef?: string | null;
  notes?: string | null;
  createdAt: string;
  membership?: { package?: { id: string; name: string } } | null;
  promotion?: { id: string; code: string; name: string } | null;
}

export interface PaymentDetail extends Payment {
  member?: { id: string; code: string; fullName: string; phone: string; email?: string | null };
  membership?: {
    package?: { id: string; name: string; durationDays: number };
  } | null;
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface MemberStats {
  isTrainer: boolean;
  totalCheckIns: number;
  monthCheckIns: number;
  weekCheckIns: number;
  remainingDays: number;
  membershipProgress: number;
  ptSessions: number;
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
}