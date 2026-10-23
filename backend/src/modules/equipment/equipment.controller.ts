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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';
import { EquipmentService } from './equipment.service';
import {
  CompleteMaintenanceDto,
  CreateEquipmentDto,
  CreateMaintenanceDto,
  EquipmentQueryDto,
  MaintenanceQueryDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SetEquipmentStatusDto } from './dto/set-equipment-status.dto';

@ApiTags('Equipment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Tá»•ng quan thiáº¿t bá»‹: sá»‘ lÆ°á»£ng theo tráº¡ng thÃ¡i/tÃ¬nh tráº¡ng + cáº£nh bÃ¡o báº£o trÃ¬' })
  getStats() {
    return this.equipmentService.getStats();
  }

  @Get('alerts')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Cáº£nh bÃ¡o: báº£o trÃ¬ quÃ¡ háº¡n / sáº¯p tá»›i (14 ngÃ y) / thiáº¿t bá»‹ há»ng / sáº¯p háº¿t báº£o hÃ nh (30 ngÃ y)',
  })
  getAlerts() {
    return this.equipmentService.getAlerts();
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Danh sÃ¡ch thiáº¿t bá»‹ (tÃ¬m kiáº¿m, lá»c theo phÃ²ng/khá»‘i loáº¡i/tráº¡ng thÃ¡i)',
  })
  findAll(@Query() query: EquipmentQueryDto) {
    return this.equipmentService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiáº¿t thiáº¿t bá»‹ + lá»‹ch sá»­ báº£o trÃ¬ Ä‘áº§y Ä‘á»§' })
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'ThÃªm thiáº¿t bá»‹ má»›i (mÃ£ unique, serial unique náº¿u cÃ³, roomId há»£p lá»‡)' })
  create(
    @Body() dto: CreateEquipmentDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.create(dto, role, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cáº­p nháº­t thÃ´ng tin thiáº¿t bá»‹' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.update(id, dto, role, actorId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Äá»•i tráº¡ng thÃ¡i thiáº¿t bá»‹ (AVAILABLE/IN_USE/MAINTENANCE/BROKEN/RETIRED)' })
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetEquipmentStatusDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.setStatus(id, dto.status, role, actorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Thanh lÃ½ (retire) thiáº¿t bá»‹ â€” giá»¯ lá»‹ch sá»­' })
  remove(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.remove(id, role, actorId);
  }
}

// ---------------------------------------------------------------------------
// Equipment Maintenance â€” yÃªu cáº§u / lá»‹ch sá»­ báº£o trÃ¬
// ---------------------------------------------------------------------------

@ApiTags('Equipment Maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment-maintenance')
export class EquipmentMaintenanceController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch yÃªu cáº§u / lá»‹ch sá»­ báº£o trÃ¬ (lá»c theo thiáº¿t bá»‹, tráº¡ng thÃ¡i, loáº¡i)' })
  findAll(@Query() query: MaintenanceQueryDto) {
    return this.equipmentService.findAllMaintenance(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Táº¡o yÃªu cáº§u báº£o trÃ¬. Thiáº¿t bá»‹ â†’ MAINTENANCE',
  })
  create(
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.createMaintenance(dto, role, actorId);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'HoÃ n táº¥t báº£o trÃ¬ â€” thiáº¿t bá»‹ â†’ AVAILABLE (hoáº·c BROKEN náº¿u Ä‘Ã¡nh dáº¥u há»ng)' })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.completeMaintenance(id, dto, role, actorId);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Há»§y yÃªu cáº§u báº£o trÃ¬ â€” má»Ÿ láº¡i thiáº¿t bá»‹ náº¿u khÃ´ng cÃ²n báº£o trÃ¬ khÃ¡c' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.cancelMaintenance(id, role, actorId);
  }
}
