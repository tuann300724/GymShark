import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateMembershipChangeDto {
  @ApiProperty({ enum: ["CANCEL_REFUND", "FREEZE"] })
  @IsIn(["CANCEL_REFUND", "FREEZE"])
  type: "CANCEL_REFUND" | "FREEZE";

  @ApiPropertyOptional({ example: "Thay đổi kế hoạch cá nhân" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 30, example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  freezeDays?: number;
}
