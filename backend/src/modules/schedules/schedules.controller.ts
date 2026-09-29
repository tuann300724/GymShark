import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import {
  CancelSessionDto,
  CreateProgressDto,
  CreateSessionDto,
  SessionQueryDto,
  UpdateProgressDto,
  UpdateSessionDto,
} from './dto/session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ---------------------------------------------------------------------------
// Controller cũ (back-compat): GET /schedules, GET /schedules/:id
// ---------------------------------------------------------------------------

@ApiTags('Training Schedules')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[Cũ] Lấy danh sách lịch tập luyện & lớp học PT' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[Cũ] Lấy chi tiết một lịch tập' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }
}

// ---------------------------------------------------------------------------
// Controller mới: /training-sessions
// ---------------------------------------------------------------------------

@ApiTags('Training Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-sessions')
export class TrainingSessionsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('me/upcoming')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Buổi tập sắp tới của hội viên đang đăng nhập' })
  getMyUpcoming(@CurrentUser('id') userId: string) {
    return this.schedulesService.getMyUpcoming(userId);
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Toàn bộ lịch tập (sắp tới + lịch sử) của hội viên đang đăng nhập' })
  getMySessions(@CurrentUser('id') userId: string, @Query() query: SessionQueryDto) {
    return this.schedulesService.getMySessions(userId, query);
  }

  @Get('trainer/me')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Lịch dạy của HLV đang đăng nhập (kèm thống kê hôm nay/sắp tới/đã xong)' })
  getTrainerSessions(@CurrentUser('id') userId: string, @Query() query: SessionQueryDto) {
    return this.schedulesService.getTrainerSessions(userId, query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách buổi tập (lọc theo trainer/member/branch/status/type/time)' })
  findAllSessions(
    @Query() query: SessionQueryDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.findAllSessions(query, role, userId);
  }

  @Get(':id/progress')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Ghi chú tiến trình của một buổi tập' })
  getProgress(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.getProgress(id, role, userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiết buổi tập (backend tự kiểm tra quyền sở hữu)' })
  findOneSession(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.findOneSession(id, role, userId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Tạo buổi tập (kiểm tra trùng lịch HLV/member, không tạo quá khứ nếu không phải Admin)' })
  createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schedulesService.createSession(dto, role, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chỉnh sửa buổi tập (chỉ khi SCHEDULED, tự kiểm tra lại trùng lịch)' })
  updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schedulesService.updateSession(id, dto, role, actorId);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Hủy buổi tập (giữ lịch sử + lưu lý do hủy)' })
  cancelSession(
    @Param('id') id: string,
    @Body() dto: CancelSessionDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.cancelSession(id, dto, role, userId);
  }

  @Post(':id/complete')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Đánh dấu buổi tập hoàn thành' })
  completeSession(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.completeSession(id, role, userId);
  }

  @Post(':id/progress')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Thêm ghi chú tiến trình cho buổi tập (HLV/truy cập quản trị)' })
  addProgress(
    @Param('id') id: string,
    @Body() dto: CreateProgressDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.addProgress(id, dto, role, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa hẳn buổi tập (chỉ Admin)' })
  removeSession(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.schedulesService.removeSession(id, actorId);
  }
}

// ---------------------------------------------------------------------------
// Controller: /training-progress
// ---------------------------------------------------------------------------

@ApiTags('Training Progress')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-progress')
export class TrainingProgressController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.TRAINER)
  @ApiOperation({ summary: 'Chỉnh sửa ghi chú tiến trình (HLV chỉ sửa ghi chú của mình)' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.updateProgress(id, dto, role, userId);
  }
}