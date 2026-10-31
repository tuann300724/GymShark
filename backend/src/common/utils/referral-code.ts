import { randomInt } from 'crypto';
import type { Prisma } from '@prisma/client';

// Bỏ I/O/0/1 cho dễ đọc nhầm khi đọc mã thành tiếng
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã giới thiệu cá nhân, dạng GYM-XXXXXXXX */
export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `GYM-${code}`;
}

/** Sinh mã chưa tồn tại (xác suất trùng gần như bằng 0, thử tối đa 10 lần) */
export async function uniqueReferralCode(db: Prisma.TransactionClient): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const found = await db.member.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!found) return code;
  }
  throw new Error('Không sinh được mã giới thiệu duy nhất, thử lại sau.');
}
