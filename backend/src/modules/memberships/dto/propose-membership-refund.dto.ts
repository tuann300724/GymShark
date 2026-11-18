import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ProposeMembershipRefundDto {
  @ApiPropertyOptional({
    minimum: 0,
    description:
      "Số tiền đề xuất; nếu bỏ trống, hệ thống tính theo thời gian và quota PT còn lại",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  refundAmount?: number;

  @ApiPropertyOptional({ description: "Giải trình cách tính tiền hoàn" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
