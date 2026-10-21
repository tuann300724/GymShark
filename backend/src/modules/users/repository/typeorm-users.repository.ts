import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersRepository } from './users.repository';

@Injectable()
export class TypeOrmUsersRepository implements UsersRepository {
  constructor(private readonly dataSource: DataSource) {}
  async list(query?: any) {
    return await this.dataSource.query('EXEC sp_users_list @status=@0, @role=@1, @branchId=@2, @limit=@3', [
      query?.status ?? null, query?.role ?? null, query?.branchId ?? null, query?.limit ?? 100,
    ]);
  }
  async findOne(id: string) {
    const rows = await this.dataSource.query('EXEC sp_users_find_one @id=@0', [id]);
    return (rows?.[0] ?? null) || null;
  }
}
