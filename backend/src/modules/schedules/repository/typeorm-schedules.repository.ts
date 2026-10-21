import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScheduleRow, SchedulesRepository } from './schedules.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmSchedulesRepository implements SchedulesRepository {
  constructor(private readonly dataSource: DataSource) {}
  private first<T>(rows: unknown): T | null { return ((rows as T[])?.[0] ?? null) as T | null; }

  async list(query?: any) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const rows = await this.dataSource.query(
      'EXEC sp_schedules_list @page=@0, @limit=@1, @branchId=@2, @memberId=@3, @trainerId=@4, @memberName=@5, @trainerName=@6, @startTime=@7, @endTime=@8, @status=@9, @type=@10, @search=@11',
      [page, limit, query?.branchId ?? null, query?.memberId ?? null, query?.trainerId ?? null,
       query?.memberName ?? null, query?.trainerName ?? null, query?.startTime ?? null,
       query?.endTime ?? null, query?.status ?? null, query?.type ?? null, query?.search ?? null],
    );
    const countRows = await this.dataSource.query(
      'EXEC sp_schedules_list_count @trainerId=@0, @memberId=@1, @branchId=@2, @startTime=@3, @endTime=@4, @status=@5, @type=@6, @search=@7',
      [query?.trainerId ?? null, query?.memberId ?? null, query?.branchId ?? null, query?.startTime ?? null,
       query?.endTime ?? null, query?.status ?? null, query?.type ?? null, query?.search ?? null],
    );
    const total = Number(this.first<{ total: number }>(countRows)?.total ?? 0);
    return { data: (rows as ScheduleRow[]) ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, trainerId?: string | null, memberId?: string | null) {
    const rows = await this.dataSource.query('EXEC sp_schedules_find_one @id=@0, @trainerId=@1, @memberId=@2', [id, trainerId ?? null, memberId ?? null]);
    return this.first<ScheduleRow>(rows);
  }

  async create(input: any) {
    const rows = await this.dataSource.query(
      'EXEC sp_schedules_create @id=@0, @trainerId=@1, @memberId=@2, @branchId=@3, @roomId=@4, @title=@5, @description=@6, @type=@7, @startTime=@8, @endTime=@9, @status=@10',
      [input.id ?? randomUUID(), input.trainerId, input.memberId ?? null, input.branchId ?? null,
       input.roomId ?? null, input.title, input.description ?? null, input.type ?? 'PERSONAL_TRAINING',
       input.startTime, input.endTime, input.status ?? 'SCHEDULED'],
    );
    return this.first<ScheduleRow>(rows);
  }

  async update(id: string, input: any) {
    await this.dataSource.query(
      'EXEC sp_schedules_update @id=@0, @trainerId=@1, @memberId=@2, @branchId=@3, @roomId=@4, @title=@5, @description=@6, @type=@7, @startTime=@8, @endTime=@9, @status=@10',
      [id, input.trainerId ?? null, input.memberId ?? null, input.branchId ?? null, input.roomId ?? null,
       input.title ?? null, input.description ?? null, input.type ?? null, input.startTime ?? null,
       input.endTime ?? null, input.status ?? null],
    );
    return await this.findOne(id);
  }

  async setStatus(id: string, status: string) {
    await this.dataSource.query('EXEC sp_schedules_set_status @id=@0, @status=@1', [id, status]);
  }

  async delete(id: string) {
    await this.dataSource.query('EXEC sp_schedules_delete @id=@0', [id]);
  }
}
