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
  @ApiOperation({ summary: 'Tổng quan thiết bị: số lượng theo trạng thái/tình trạng + cảnh báo bảo trì' })
  getStats() {
    return this.equipmentService.getStats();
  }

  @Get('alerts')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Cảnh báo: bảo trì quá hạn / sắp tới (14 ngày) / thiết bị hỏng / sắp hết bảo hành (30 ngày)',
  })
  getAlerts(
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.equipmentService.getAlerts(role, branchId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Danh sách thiết bị (tìm kiếm, lọc). STAFF/TRAINER chỉ thấy thiết bị chi nhánh của mình',
  })
  findAll(
    @Query() query: EquipmentQueryDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.equipmentService.findAll(query, role, branchId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết thiết bị + lịch sử bảo trì đầy đủ' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.equipmentService.findOne(id, role, branchId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Thêm thiết bị mới (mã unique, serial unique nếu có, room thuộc branch)' })
  create(
    @Body() dto: CreateEquipmentDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.create(dto, role, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật thông tin thiết bị' })
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
  @ApiOperation({ summary: 'Đổi trạng thái thiết bị (AVAILABLE/IN_USE/MAINTENANCE/BROKEN/RETIRED)' })
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetEquipmentStatusDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.setStatus(id, dto.status, role, branchId, actorId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Thanh lý (retire) thiết bị — giữ lịch sử' })
  remove(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.remove(id, role, branchId, actorId);
  }
}

// ---------------------------------------------------------------------------
// Equipment Maintenance — yêu cầu / lịch sử bảo trì
// ---------------------------------------------------------------------------

@ApiTags('Equipment Maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment-maintenance')
export class EquipmentMaintenanceController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách yêu cầu / lịch sử bảo trì (lọc theo thiết bị, branch, trạng thái)' })
  findAll(
    @Query() query: MaintenanceQueryDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.equipmentService.findAllMaintenance(query, role, branchId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Tạo yêu cầu bảo trì (STAFF chỉ tạo cho thiết bị chi nhánh mình). Thiết bị → MAINTENANCE',
  })
  create(
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.createMaintenance(dto, role, branchId, actorId);
  }

  @Patch(':id/complete')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Hoàn tất bảo trì — thiết bị → AVAILABLE (hoặc BROKEN nếu đánh dấu hỏng)' })
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceDto,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.completeMaintenance(id, dto, role, branchId, actorId);
  }

  @Post(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Hủy yêu cầu bảo trì — mở lại thiết bị nếu không còn bảo trì khác' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.equipmentService.cancelMaintenance(id, role, branchId, actorId);
  }
}