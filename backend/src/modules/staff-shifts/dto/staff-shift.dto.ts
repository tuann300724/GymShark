import { Type } from "class-transformer";
import {
  IsDateString,
  IsArray,
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

export class QuickCreateStaffShiftsDto {
  @IsUUID()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(255)
  title: string;

  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(6, { each: true })
  weekdays: number[];

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsArray()
  shifts?: {
    title: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }[];
}
