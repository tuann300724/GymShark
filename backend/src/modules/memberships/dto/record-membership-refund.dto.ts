import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class RecordMembershipRefundDto {
  @ApiProperty({ enum: ["BANK_TRANSFER", "CASH"] })
  @IsIn(["BANK_TRANSFER", "CASH"])
  refundMethod: "BANK_TRANSFER" | "CASH";

  @ApiPropertyOptional({
    description: "Mã giao dịch chuyển khoản hoặc mã phiếu chi",
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  refundReference?: string;
}
