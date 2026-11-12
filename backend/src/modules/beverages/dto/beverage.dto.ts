import { Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsBoolean,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  NotEquals,
  ValidateNested,
} from "class-validator";

export class BeverageProductDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string | null;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(30)
  unit: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  volumeMl?: number | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  costPrice: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  sellingPrice: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999999999)
  minStock: number;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999999999)
  initialStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  initialStockReason?: string;
}

export class UpdateBeverageProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  volumeMl?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  costPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  sellingPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999999999)
  minStock?: number;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @IsOptional()
  @IsString()
  description?: string | null;
}

export class BeverageImportItemDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(999999999999999)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  unitCost: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(100)
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateBeverageImportDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  supplierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  supplierPhone?: string;

  @IsOptional()
  @IsDateString()
  importDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BeverageImportItemDto)
  items: BeverageImportItemDto[];
}

export class CompleteBeverageSaleDto {
  @IsUUID()
  requestId: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,24}$/)
  cassoReference?: string;

  @IsUUID()
  memberId: string;

  @IsIn(["CASH", "BANK_TRANSFER"])
  paymentMethod: "CASH" | "BANK_TRANSFER";

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999999)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BeverageSaleItemDto)
  items: BeverageSaleItemDto[];
}

export class BeverageSaleItemDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(999999999999999)
  quantity: number;
}

export class BeverageStockAdjustmentDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Max(999999999999999)
  @Min(-999999999999999)
  @NotEquals(0)
  quantityChange: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(1000)
  reason: string;
}

export class BeverageQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(["day", "week", "month", "year"])
  groupBy?: "day" | "week" | "month" | "year";
}
