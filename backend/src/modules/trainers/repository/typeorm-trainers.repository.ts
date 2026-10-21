import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TrainerRow, TrainersRepository } from './trainers.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmTrainersRepository implements TrainersRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query?: any): Promise<{ data: TrainerRow[]; total: number; page: number; limit: number; totalPages: number }> {
    const rows = await this.dataSource.query(
      'EXEC sp_trainers_list @page=@0, @limit=@1, @search=@2, @status=@3, @specialization=@4, @branchId=@5',
      [
        query?.page ?? 1,
        query?.limit ?? 20,
        query?.search ?? null,
        query?.status ?? null,
        query?.specialization ?? null,
        query?.branchId ?? null,
      ],
    );
    const countRows = await this.dataSource.query(
      'EXEC sp_trainers_list_count @search=@0, @status=@1, @specialization=@2, @branchId=@3',
      [
        query?.search ?? null,
        query?.status ?? null,
        query?.specialization ?? null,
        query?.branchId ?? null,
      ],
    );
    const total = Number((countRows[0] as any)?.total ?? 0);
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    return {
      data: (rows as TrainerRow[]) ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<TrainerRow | null> {
    const rows = await this.dataSource.query('EXEC sp_trainers_find_one @id=@0', [id]);
    return this.first<TrainerRow>(rows);
  }

  async findByUserId(userId: string): Promise<TrainerRow | null> {
    const rows = await this.dataSource.query('EXEC sp_trainers_find_by_user @userId=@0', [userId]);
    return this.first<TrainerRow>(rows);
  }

  async stats(id: string): Promise<{ totalSessions: number; activeMembers: number; upcomingSessions: number; completedSessions: number }> {
    const rows = await this.dataSource.query('EXEC sp_trainers_stats @id=@0', [id]);
    return (
      this.first<{ totalSessions: number; activeMembers: number; upcomingSessions: number; completedSessions: number }>(rows) ?? {
        totalSessions: 0,
        activeMembers: 0,
        upcomingSessions: 0,
        completedSessions: 0,
      }
    );
  }

  async members(id: string): Promise<any[]> {
    return await this.dataSource.query('EXEC sp_trainers_members @trainerId=@0, @limit=@1', [id, 100]);
  }

  async schedules(id: string): Promise<any[]> {
    return await this.dataSource.query('EXEC sp_trainers_schedules @trainerId=@0, @limit=@1', [id, 50]);
  }

  async assignMember(trainerId: string, memberId: string): Promise<any> {
    return await this.dataSource.query(
      'EXEC sp_trainer_members_assign @id=@0, @trainerId=@1, @memberId=@2',
      [randomUUID(), trainerId, memberId],
    );
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.dataSource.query('EXEC sp_trainers_set_status @id=@0, @status=@1', [id, status]);
  }

  async update(id: string, data: any): Promise<any> {
    await this.dataSource.query(
      'EXEC sp_trainers_update @id=@0, @specialization=@1, @status=@2',
      [id, data.specialization ?? null, data.status ?? null],
    );
    return await this.findOne(id);
  }
}
