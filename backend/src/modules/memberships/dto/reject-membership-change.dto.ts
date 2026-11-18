import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectMembershipChangeDto {
  @ApiProperty({ example: "Hồ sơ chưa đáp ứng điều kiện theo hợp đồng" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
