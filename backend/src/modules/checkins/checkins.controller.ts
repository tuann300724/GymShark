import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CheckinsService } from './checkins.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

class CheckInDto {
  @ApiProperty({ example: 'MEM-0001', description: 'Mã thẻ hội viên cần check-in' })
  @IsString()
  @IsNotEmpty()
  memberCode: string;

  @ApiProperty({ required: false, description: 'ID chi nhánh (tuỳ chọn nếu lấy mặc định theo hội viên)' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

@ApiTags('Check-ins')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy lịch sử lượt check-in ra vào phòng gym' })
  findAll() {
    return this.checkinsService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Quét thẻ check-in hội viên theo mã hội viên' })
  checkIn(@Body() dto: CheckInDto) {
    return this.checkinsService.checkInByCode(dto.memberCode, dto.branchId);
  }
}
