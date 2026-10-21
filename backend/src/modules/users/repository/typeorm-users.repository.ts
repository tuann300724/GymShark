import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { AuthRepository } from './auth.repository';

@Injectable()
export class TypeOrmUsersRepository implements AuthRepository {
  private repo: Repository<User>;
  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(User);
  }

  async create(input: any): Promise<any> {
    const e = this.repo.create(input as any);
    return await this.repo.save(e);
  }

  async findOne(id: string): Promise<any> {
    return await this.repo.findOne({ where: { id } });
  }

  async findMany(where?: any, opts?: { take?: number; skip?: number }): Promise<any[]> {
    return await this.repo.find({ where: where || {}, take: opts?.take || 50, skip: opts?.skip || 0, order: { createdAt: 'DESC' } });
  }

  async count(where?: any): Promise<number> {
    return await this.repo.count({ where: where || {} });
  }

  async update(id: string, data: any): Promise<any> {
    await this.repo.update(id, data as any);
    return await this.repo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
