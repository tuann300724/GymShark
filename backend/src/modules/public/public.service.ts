import { Injectable, Inject } from '@nestjs/common';
import { PUBLIC_REPOSITORY } from './repository/public.tokens';
import { PublicRepository } from './repository/public.repository';

@Injectable()
export class PublicService {
  constructor(@Inject(PUBLIC_REPOSITORY) private readonly repo: PublicRepository) {}

  async getPackages() {
    return this.repo.packages();
  }

  async getTrainers() {
    return this.repo.trainers();
  }

  async getClassSchedule() {
    return this.repo.schedule();
  }

  async getBranches() {
    return this.repo.branches();
  }

  async getPromotions() {
    return this.repo.promotions();
  }

  async getHomeStats() {
    return this.repo.homeStats();
  }
}
