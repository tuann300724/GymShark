import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePartnerAccountDto {
  @ApiProperty({
    example: "Gym Alpha",
    description: "Tên phòng gym/doanh nghiệp trên hồ sơ đối tác",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  businessName: string;
}
