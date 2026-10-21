export interface TrainerRow {
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
  user_id: string | null;
  user_email: string | null;
  user_fullName: string | null;
  user_phone: string | null;
  user_avatarUrl: string | null;
  user_status: string | null;
  user_branchId: string | null;
  activeMemberCount?: number;
  scheduleCount?: number;
}

export interface TrainersRepository {
  list(query?: any): Promise<{ data: TrainerRow[]; total: number; page: number; limit: number; totalPages: number }>;
  findOne(id: string): Promise<TrainerRow | null>;
  findByUserId(userId: string): Promise<TrainerRow | null>;
  stats(id: string): Promise<{ totalSessions: number; activeMembers: number; upcomingSessions: number; completedSessions: number }>;
  members(id: string): Promise<any[]>;
  schedules(id: string): Promise<any[]>;
  assignMember(trainerId: string, memberId: string): Promise<any>;
  setStatus(id: string, status: string): Promise<void>;
  update(id: string, data: any): Promise<any>;
}
