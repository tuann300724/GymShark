import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import {
  CheckInDto,
  GetCheckinsQueryDto,
  MyHistoryQueryDto,
  StaffCheckInDto,
} from './dto/checkin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Check-ins')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  // ---------------------------------------------------------------------------
  // Admin / Staff — toàn hệ thống
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Lịch sử check-in toàn hệ thống (tìm kiếm, lọc, sắp xếp, phân trang)',
  })
  findAll(@Query() query: GetCheckinsQueryDto) {
    return this.checkinsService.findAll(query);
  }

  @Get('currently-inside')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sách hội viên đang có mặt trong phòng gym' })
  currentlyInside() {
    return this.checkinsService.currentlyInside();
  }

  @Post('staff')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Lễ tân check-in giúp hội viên (theo memberId, không tin client). STAFF buộc ở chi nhánh của mình',
  })
  staffCheckIn(
    @Body() dto: StaffCheckInDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.checkinsService.staffCheckIn(dto, role, branchId, actorId);
  }

  @Post(':id/checkout')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Admin/Staff chủ động check-out cho một phiên tập đang mở' })
  checkoutById(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.checkinsService.checkoutById(id, actorId);
  }

  // ---------------------------------------------------------------------------
  // Member — chỉ dữ liệu của chính mình
  // ---------------------------------------------------------------------------

  @Get('me/current')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Trạng thái check-in hiện tại của hội viên đang đăng nhập' })
  getMyCurrent(@CurrentUser('id') userId: string) {
    return this.checkinsService.getCurrent(userId);
  }

  @Get('me/history')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Lịch sử check-in cá nhân + thống kê (tháng/tuần/trung bình)' })
  getMyHistory(@CurrentUser('id') userId: string, @Query() query: MyHistoryQueryDto) {
    return this.checkinsService.getMyHistory(userId, query);
  }

  @Post()
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'Hội viên tự check-in (member lấy từ JWT; có thể chọn chi nhánh theo gói GLOBAL / giới hạn branch)',
  })
  checkIn(@CurrentUser('id') userId: string, @Body() dto: CheckInDto) {
    return this.checkinsService.checkIn(userId, dto.method, dto.branchId);
  }

  @Post('checkout')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Hội viên tự check-out phiên tập đang mở của mình' })
  checkOut(@CurrentUser('id') userId: string) {
    return this.checkinsService.checkOut(userId);
  }
}