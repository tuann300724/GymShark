import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import {
  CreateBranchDto,
  CreateRoomDto,
  SetBranchStatusDto,
  SetRoomStatusDto,
  UpdateBranchDto,
  UpdateRoomDto,
} from './dto/branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy danh sách chi nhánh (STAFF/TRAINER chỉ thấy chi nhánh của mình)' })
  findAll(
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.branchesService.findAll(role, branchId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy chi tiết chi nhánh, phòng tập và thiết bị' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.branchesService.findOne(id, role, branchId);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Số liệu tổng hợp của một chi nhánh (hội viên, doanh thu, thiết bị...)' })
  getStats(@Param('id') id: string) {
    return this.branchesService.getStats(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo chi nhánh mới (ADMIN/MANAGER)' })
  create(@Body() dto: CreateBranchDto, @CurrentUser('role') role: string) {
    return this.branchesService.create(dto, role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật thông tin chi nhánh' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.update(id, dto, role);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Kích hoạt / ngừng hoạt động chi nhánh (INACTIVE chặn tạo buổi tập & check-in mới)',
  })
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetBranchStatusDto,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.setStatus(id, dto, role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xóa chi nhánh — chỉ khi không còn dữ liệu liên quan (nên dùng INACTIVE)' })
  remove(@Param('id') id: string, @CurrentUser('role') role: string) {
    return this.branchesService.remove(id, role);
  }
}

// ---------------------------------------------------------------------------
// Rooms — quản lý phòng theo từng chi nhánh
// ---------------------------------------------------------------------------

@ApiTags('Rooms')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches/:branchId/rooms')
export class RoomsController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách phòng của chi nhánh' })
  getRooms(
    @Param('branchId') branchId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('branchId') userBranchId?: string | null,
  ) {
    return this.branchesService.getRooms(branchId, role, userBranchId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết một phòng trong chi nhánh' })
  async getRoom(@Param('id') id: string, @Param('branchId') branchId: string) {
    const rooms = await this.branchesService.getRooms(branchId, 'ADMIN', null);
    const room = rooms.find((r) => r.id === id);
    if (!room) throw new NotFoundException('Không tìm thấy phòng trong chi nhánh này.');
    return room;
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo phòng mới trong chi nhánh (mã phòng unique trong branch)' })
  createRoom(
    @Param('branchId') branchId: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.createRoom(branchId, dto, role);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật phòng' })
  updateRoom(
    @Param('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.updateRoom(branchId, id, dto, role);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Đổi trạng thái phòng (chỉ phòng AVAILABLE mới đặt lịch được)' })
  setRoomStatus(
    @Param('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: SetRoomStatusDto,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.setRoomStatus(branchId, id, dto, role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xóa phòng — chỉ khi không còn thiết bị / buổi tập liên quan' })
  removeRoom(
    @Param('branchId') branchId: string,
    @Param('id') id: string,
    @CurrentUser('role') role: string,
  ) {
    return this.branchesService.removeRoom(branchId, id, role);
  }
}