import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class ApproveMembershipChangeDto {
  @ApiPropertyOptional({ description: "Ghi chú phê duyệt" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
