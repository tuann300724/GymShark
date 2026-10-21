import { Inject, Injectable } from '@nestjs/common';
import { UsersRepository } from './repository/users.repository';
import { USERS_REPOSITORY } from './repository/users.tokens';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly repo: UsersRepository,
  ) {}

  async findAll() { return await this.repo.list(); }
  async findOne(id: string) { return await this.repo.findOne(id); }
}