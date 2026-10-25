import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('SQL Server database connected successfully.');
    } catch (error: unknown) {
      this.logger.warn('Could not connect to SQL Server. Database-backed requests will fail until it is available.');
      this.logger.error(
        error instanceof Error ? error.stack ?? error.message : String(error),
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
