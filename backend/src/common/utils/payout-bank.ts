import { ApiPropertyOptional } from "@nestjs/swagger";
import { BadRequestException } from "@nestjs/common";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { AVATAR_DATA_URL_PATTERN, MAX_AVATAR_DATA_URL_LENGTH } from "./avatar";

/**
 * Tài khoản nhận tiền (STK + ảnh QR) của đối tác / PT — dùng chung cho Partner và Trainer.
 * Admin dùng để chuyển hoa hồng / tiền buổi PT ở trang Báo cáo doanh thu.
 */
export const PAYOUT_BANK_SELECT = {
  bankCode: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  bankQrImage: true,
  bankUpdatedAt: true,
} as const;

export interface PayoutBankFields {
  bankCode: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankQrImage: string | null;
  bankUpdatedAt: Date | null;
}

export class UpdatePayoutBankDto {
  @ApiPropertyOptional({ description: "Mã ngân hàng theo VietQR (vd MB, VCB, TCB)" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9]*$/, { message: "Mã ngân hàng không hợp lệ" })
  bankCode?: string;

  @ApiPropertyOptional({ description: "Tên ngân hàng hiển thị" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @ApiPropertyOptional({ description: "Số tài khoản (chỉ chữ số)" })
  @IsOptional()
  @IsString()
  @Matches(/^\d{0,30}$/, { message: "Số tài khoản chỉ gồm chữ số (tối đa 30 số)" })
  bankAccountNumber?: string;

  @ApiPropertyOptional({ description: "Tên chủ tài khoản" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankAccountName?: string;

  @ApiPropertyOptional({ description: "Ảnh QR nhận tiền (data URL đã nén) — chuỗi rỗng để xoá" })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_AVATAR_DATA_URL_LENGTH)
  bankQrImage?: string;
}

/** Chuẩn hoá dữ liệu gửi lên → các cột bank* để ghi vào Partner / Trainer */
export function toPayoutBankData(dto: UpdatePayoutBankDto) {
  const clean = (v?: string) => (v === undefined ? undefined : v.trim() || null);
  const qr = clean(dto.bankQrImage);
  if (qr && !AVATAR_DATA_URL_PATTERN.test(qr)) {
    throw new BadRequestException("Ảnh QR phải là ảnh JPG, PNG hoặc WEBP.");
  }
  const accountNumber = clean(dto.bankAccountNumber);
  const bankCode = clean(dto.bankCode)?.toUpperCase() ?? clean(dto.bankCode);
  if (accountNumber && !bankCode) {
    throw new BadRequestException("Vui lòng chọn ngân hàng cho số tài khoản.");
  }
  return {
    bankCode,
    bankName: clean(dto.bankName),
    bankAccountNumber: accountNumber,
    bankAccountName: clean(dto.bankAccountName)?.toUpperCase() ?? clean(dto.bankAccountName),
    bankQrImage: qr,
    bankUpdatedAt: new Date(),
  };
}
