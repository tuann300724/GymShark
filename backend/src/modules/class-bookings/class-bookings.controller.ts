import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClassBookingsService } from './class-bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Class Bookings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('class-bookings')
export class ClassBookingsController {
  constructor(private readonly svc: ClassBookingsService) {}

  @Get('open')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Ca nhóm sắp tới đang mở đăng ký + cờ đã đăng ký' })
  listOpen(@CurrentUser('id') userId: string) {
    return this.svc.listOpen(userId);
  }

  @Get('mine')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Ca nhóm mà tôi đã đăng ký' })
  listMine(@CurrentUser('id') userId: string) {
    return this.svc.listMine(userId);
  }

  @Get('session/:scheduleId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[HLV/QTV] Danh sách hội viên đã đăng ký 1 ca' })
  listBySession(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.svc.listBySession(scheduleId, role, userId);
  }

  @Post()
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Đăng ký 1 chỗ trong ca nhóm' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.svc.create(userId, dto);
  }

  @Delete(':id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Hủy đăng ký ca nhóm (trước khi buổi bắt đầu)' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.cancel(userId, id);
  }
}
