export interface PublicTrainerRow {
  id: string;
  userId: string;
  specialization: string;
  certification: string | null;
  experienceYears: number;
  bio: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  rating: number;
  hourlyRate: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
  user_fullName: string;
  user_phone: string | null;
  user_avatarUrl: string | null;
}

export interface PublicScheduleRow {
  id: string;
  title: string;
  trainerId: string;
  memberId: string | null;
  branchId: string | null;
  roomId: string | null;
  type: string;
  startTime: Date;
  endTime: Date;
  status: string;
  description: string | null;
  notes: string | null;
  cancellationNote: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  trainer_id: string;
  trainerUser_id: string;
  trainerUser_fullName: string;
  trainerUser_avatarUrl: string | null;
  room_id: string | null;
  room_name: string | null;
  room_capacity: number | null;
}

export interface PublicPackageRow {
  id: string; code: string; name: string; description: string | null;
  durationDays: number; price: string; sessions: number | null;
  type: string; status: string; features: any | null; allowedBranches: any | null;
  createdAt: Date; updatedAt: Date;
}

export interface PublicBranchRow {
  id: string; code: string; name: string; address: string; phone: string;
  email: string | null; description: string | null; openingTime: string | null;
  closingTime: string | null; openingHours: string | null; status: string;
  createdAt: Date; updatedAt: Date;
}

export interface PublicPromotionRow {
  id: string; code: string; name: string; description: string | null;
  discountType: string; discountValue: number; minOrderValue: number | null;
  maxDiscount: number | null; usageLimit: number | null; perMemberLimit: number | null;
  usedCount: number; startDate: Date; endAt: Date; status: string;
  createdAt: Date; updatedAt: Date;
}

export interface PublicRepository {
  packages(): Promise<any[]>;
  trainers(): Promise<any[]>;
  schedule(): Promise<any[]>;
  branches(): Promise<any[]>;
  promotions(): Promise<any[]>;
  homeStats(): Promise<{ totalMembers: number; totalTrainers: number; totalBranches: number }>;
}
