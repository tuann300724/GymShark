import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ PostgreSQL Database connected successfully!');
    } catch (error: any) {
      this.logger.warn('⚠️  Could not connect to PostgreSQL yet. Start your PostgreSQL database or Docker to enable database queries.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
