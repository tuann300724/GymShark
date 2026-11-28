import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Tài khoản nhận tiền (STK + ảnh QR) là dữ liệu riêng tư: ẩn khỏi MỌI truy vấn theo mặc định
 * (kể cả `include: { trainer: true }` ở lịch tập, lớp học... trả cho hội viên).
 * Chỉ trả khi code chọn rõ bằng `select` (PAYOUT_BANK_SELECT — trang của chính chủ + admin chi trả).
 */
const HIDDEN_PAYOUT_BANK = {
  bankCode: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  bankQrImage: true,
  bankUpdatedAt: true,
} as const;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ omit: { trainer: HIDDEN_PAYOUT_BANK, partner: HIDDEN_PAYOUT_BANK } });
  }

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
