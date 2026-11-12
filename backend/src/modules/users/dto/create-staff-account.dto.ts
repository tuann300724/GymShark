import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from "class-validator";

export class CreateStaffAccountDto {
  @ApiProperty({ example: "Nguyễn Văn A" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(400)
  fullName: string;

  @ApiProperty({ example: "nhanvien@example.com" })
  @IsEmail()
  @MaxLength(400)
  email: string;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  phone?: string;
}
