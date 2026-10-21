export interface ScheduleRow {
  id: string;
  trainerId: string;
  memberId: string | null;
  branchId: string | null;
  roomId: string | null;
  type: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  trainerName: string | null;
  memberName: string | null;
  roomName: string | null;
  branchName: string | null;
}

export interface SchedulesRepository {
  list(query?: any): Promise<{ data: ScheduleRow[]; total: number; page: number; limit: number; totalPages: number }>;
  findOne(id: string, trainerId?: string | null, memberId?: string | null): Promise<ScheduleRow | null>;
  create(input: any): Promise<ScheduleRow | null>;
  update(id: string, input: any): Promise<ScheduleRow | null>;
  setStatus(id: string, status: string): Promise<void>;
  delete(id: string): Promise<void>;
}
