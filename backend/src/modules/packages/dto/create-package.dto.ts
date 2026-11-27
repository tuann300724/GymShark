import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { GYM_TIER_VALUES } from "../../../common/constants/db-enums";

/// Loại hình gói cho phép tạo/sửa — KHÔNG nhận SESSION_BASED (gói theo buổi cũ đã ngừng bán)
export const CREATABLE_PACKAGE_TYPES = ["FIXED_TERM", "CREDIT_BASED"] as const;
export type CreatablePackageType = (typeof CREATABLE_PACKAGE_TYPES)[number];

export class CreatePackageDto {
  @ApiProperty({ example: "Gói Standard 1 Tháng", description: "Tên gói tập" })
  @IsNotEmpty({ message: "Tên gói tập không được để trống" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Tập luyện tại mạng lưới phòng gym đối tác" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: {
      title: "Gói Standard",
      items: ["Tập luyện tại tất cả phòng gym thuộc hạng Standard & Plus"],
    },
    description: "Danh sách tính năng nổi bật của gói",
  })
  @IsOptional()
  @IsObject()
  features?: { title?: string; items: string[] };

  @ApiProperty({
    enum: CREATABLE_PACKAGE_TYPES,
    default: "FIXED_TERM",
    description:
      "Loại hình gói: FIXED_TERM (theo thời hạn) hoặc CREDIT_BASED (theo số lượt)",
  })
  @IsOptional()
  @IsIn(CREATABLE_PACKAGE_TYPES, {
    message: "Loại hình gói phải là Theo thời hạn (FIXED_TERM) hoặc Theo số lượt (CREDIT_BASED)",
  })
  type?: CreatablePackageType;

  @ApiProperty({ example: 30, description: "Thời hạn sử dụng (số ngày, > 0)" })
  @Type(() => Number)
  @IsInt({ message: "Thời hạn phải là số nguyên" })
  @Min(1, { message: "Thời hạn phải lớn hơn 0" })
  @Max(3650, { message: "Thời hạn quá lớn" })
  durationDays: number;

  @ApiPropertyOptional({
    example: 20,
    description:
      "Giới hạn số lượt tập. Gói CREDIT_BASED: tổng số lượt (bắt buộc). Gói FIXED_TERM: số lượt tối đa/tháng (bỏ trống = không giới hạn).",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  )
  @Type(() => Number)
  @IsInt({ message: "Giới hạn số lượt phải là số nguyên" })
  @Min(1, { message: "Giới hạn số lượt phải lớn hơn 0" })
  @Max(100000, { message: "Giới hạn số lượt quá lớn" })
  visitLimit?: number | null;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: "Tối đa số lượt check-in mỗi ngày (chống gian lận), mặc định 1",
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === "" || value === null || value === undefined ? undefined : Number(value),
  )
  @Type(() => Number)
  @IsInt({ message: "Giới hạn lượt/ngày phải là số nguyên" })
  @Min(1, { message: "Giới hạn lượt/ngày phải lớn hơn 0" })
  @Max(10, { message: "Giới hạn lượt/ngày tối đa là 10" })
  dailyVisitLimit?: number;

  @ApiProperty({
    example: ["TIER_1", "TIER_2"],
    description: "Hạng phòng gym đối tác được phép tập",
    type: [String],
  })
  @IsOptional() // gói riêng của đối tác không áp dụng hạng phòng; gói hệ thống bắt buộc (kiểm ở service)
  @IsArray({ message: "Hạng phòng gym phải là danh sách" })
  @ArrayNotEmpty({ message: "Phải chọn ít nhất một hạng phòng gym" })
  @IsIn(GYM_TIER_VALUES, {
    each: true,
    message: "Hạng phòng gym không hợp lệ (chỉ có Tier 1, Tier 2, Tier 3)",
  })
  gymTierAccess?: string[];

  @ApiProperty({ example: 450000, description: "Giá bán (VND, >= 0)" })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Giá phải là số hợp lệ" })
  @Min(0, { message: "Giá không được âm" })
  price: number;

  @ApiPropertyOptional({ enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  @IsOptional()
  @IsString()
  @IsIn(["ACTIVE", "INACTIVE"], { message: "Trạng thái phải là Đang bán hoặc Ngừng bán" })
  status?: "ACTIVE" | "INACTIVE";
}

export type PackageFeatureInput = { title?: string; items: string[] };
