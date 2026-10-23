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
// Controller cÅ© (back-compat): GET /schedules, GET /schedules/:id
// ---------------------------------------------------------------------------

@ApiTags('Training Schedules')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[CÅ©] Láº¥y danh sÃ¡ch lá»‹ch táº­p luyá»‡n & lá»›p há»c PT' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[CÅ©] Láº¥y chi tiáº¿t má»™t lá»‹ch táº­p' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }
}

// ---------------------------------------------------------------------------
// Controller má»›i: /training-sessions
// ---------------------------------------------------------------------------

@ApiTags('Training Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training-sessions')
export class TrainingSessionsController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('me/upcoming')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Buá»•i táº­p sáº¯p tá»›i cá»§a há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMyUpcoming(@CurrentUser('id') userId: string) {
    return this.schedulesService.getMyUpcoming(userId);
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'ToÃ n bá»™ lá»‹ch táº­p (sáº¯p tá»›i + lá»‹ch sá»­) cá»§a há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMySessions(@CurrentUser('id') userId: string, @Query() query: SessionQueryDto) {
    return this.schedulesService.getMySessions(userId, query);
  }

  @Get('trainer/me')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Lá»‹ch dáº¡y cá»§a HLV Ä‘ang Ä‘Äƒng nháº­p (kÃ¨m thá»‘ng kÃª hÃ´m nay/sáº¯p tá»›i/Ä‘Ã£ xong)' })
  getTrainerSessions(@CurrentUser('id') userId: string, @Query() query: SessionQueryDto) {
    return this.schedulesService.getTrainerSessions(userId, query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch buá»•i táº­p (lá»c theo trainer/member/status/type/time)' })
  findAllSessions(
    @Query() query: SessionQueryDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.findAllSessions(query, role, userId);
  }

  @Get(':id/progress')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Ghi chÃº tiáº¿n trÃ¬nh cá»§a má»™t buá»•i táº­p' })
  getProgress(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.getProgress(id, role, userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiáº¿t buá»•i táº­p (backend tá»± kiá»ƒm tra quyá»n sá»Ÿ há»¯u)' })
  findOneSession(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.findOneSession(id, role, userId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Táº¡o buá»•i táº­p (kiá»ƒm tra trÃ¹ng lá»‹ch HLV/member, khÃ´ng táº¡o quÃ¡ khá»© náº¿u khÃ´ng pháº£i Admin)' })
  createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.schedulesService.createSession(dto, role, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chá»‰nh sá»­a buá»•i táº­p (chá»‰ khi SCHEDULED, tá»± kiá»ƒm tra láº¡i trÃ¹ng lá»‹ch)' })
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
  @ApiOperation({ summary: 'Há»§y buá»•i táº­p (giá»¯ lá»‹ch sá»­ + lÆ°u lÃ½ do há»§y)' })
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
  @ApiOperation({ summary: 'ÄÃ¡nh dáº¥u buá»•i táº­p hoÃ n thÃ nh' })
  completeSession(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.completeSession(id, role, userId);
  }

  @Post(':id/progress')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'ThÃªm ghi chÃº tiáº¿n trÃ¬nh cho buá»•i táº­p (HLV/truy cáº­p quáº£n trá»‹)' })
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
  @ApiOperation({ summary: 'XÃ³a háº³n buá»•i táº­p (chá»‰ Admin)' })
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
  @ApiOperation({ summary: 'Chá»‰nh sá»­a ghi chÃº tiáº¿n trÃ¬nh (HLV chá»‰ sá»­a ghi chÃº cá»§a mÃ¬nh)' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.schedulesService.updateProgress(id, dto, role, userId);
  }
}
