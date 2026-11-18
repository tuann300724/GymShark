import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePackageDto {
  @ApiProperty({ example: "Gói Cơ Bản 1 Tháng", description: "Tên gói tập" })
  @IsNotEmpty({ message: "Tên gói tập không được để trống" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Tập luyện không giới hạn tại phòng tập" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: {
      title: "Gói Cơ Bản",
      items: ["Phòng Gym + Cardio", "Tủ đồ cá nhân"],
    },
    description: "Danh sách tính năng của gói",
  })
  @IsOptional()
  @IsObject()
  features?: { title?: string; items: string[] };

  @ApiProperty({ example: 30, description: "Số ngày hiệu lực của gói (> 0)" })
  @Type(() => Number)
  @IsInt({ message: "Thời hạn phải là số nguyên" })
  @Min(1, { message: "Thời hạn phải lớn hơn 0" })
  @Max(3650, { message: "Thời hạn quá lớn" })
  durationDays: number;

  @ApiProperty({ example: 450000, description: "Giá gói tập (>= 0)" })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Giá phải là số hợp lệ" })
  @Min(0, { message: "Giá không được âm" })
  price: number;

  @ApiPropertyOptional({
    example: 3,
    description: "Số buổi tập cùng huấn luyện viên được kèm trong gói",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === "" || value === null ? null : Number(value),
  )
  @IsInt()
  @Min(1)
  sessions?: number | null;

  @ApiPropertyOptional({
    example: 150000,
    description:
      "Giá trị một buổi PT, dùng để tính phần dịch vụ chưa sử dụng khi hoàn tiền",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === "" || value === null ? null : Number(value),
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "Giá trị buổi PT phải là số hợp lệ" },
  )
  @Min(0, { message: "Giá trị buổi PT không được âm" })
  ptSessionValue?: number | null;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  @IsOptional()
  @IsString()
  status?: "ACTIVE" | "INACTIVE";
}

export type PackageFeatureInput = { title?: string; items: string[] };
