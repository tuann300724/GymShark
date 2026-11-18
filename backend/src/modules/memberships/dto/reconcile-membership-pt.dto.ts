import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class ReconcileMembershipPtDto {
  @ApiProperty({ minimum: 1, description: "Tổng quota PT theo hồ sơ hợp đồng" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  includedSessions!: number;

  @ApiProperty({
    minimum: 0,
    description: "Số buổi PT đã sử dụng được đối soát",
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5000)
  usedSessions!: number;

  @ApiProperty({
    minimum: 0,
    description: "Giá trị một buổi PT theo hồ sơ hợp đồng (VND)",
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  sessionValue!: number;

  @ApiProperty({
    description: "Căn cứ đối soát từ hợp đồng, phiếu thu hoặc lịch PT",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  note!: string;
}
