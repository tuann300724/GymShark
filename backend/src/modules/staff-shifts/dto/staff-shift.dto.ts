import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateStaffShiftDto {
  @IsUUID()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStaffShiftDto {
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class StaffShiftQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class SettleStaffShiftDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  cashCounted: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class CreateStaffShiftTemplateDto {
  @IsUUID()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  title: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class GenerateStaffShiftsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
