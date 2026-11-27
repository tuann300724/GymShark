import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreatePartnerAccountDto {
  @ApiProperty({
    example: "Gym Alpha",
    description: "Tên phòng gym/doanh nghiệp trên hồ sơ đối tác",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  businessName: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: "Thời hạn hợp đồng (tháng), mặc định 1 tháng theo bảng giá /tháng; hợp đồng dài hạn do admin thỏa thuận nội bộ",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Thời hạn hợp đồng phải là số tháng nguyên" })
  @Min(1)
  @Max(60)
  termMonths?: number;
}
