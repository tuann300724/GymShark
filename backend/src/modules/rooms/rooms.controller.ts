import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { resolveOwnerScope, type ScopeActor } from '../../common/utils/partner-scope';
import { CreateRoomDto, SetRoomStatusDto, UpdateRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Rooms')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Đối tác chỉ thao tác phòng tập của phòng gym mình */
  private scope(actor: ScopeActor) {
    return resolveOwnerScope(this.prisma, actor);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách phòng tập' })
  async findAll(@CurrentUser() actor: ScopeActor) {
    return this.roomsService.findAll(await this.scope(actor));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết một phòng tập' })
  async findOne(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.roomsService.findOne(id, await this.scope(actor));
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo phòng mới (mã phòng unique toàn hệ thống)' })
  async create(@Body() dto: CreateRoomDto, @CurrentUser() actor: ScopeActor) {
    return this.roomsService.create(dto, await this.scope(actor));
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật phòng' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.roomsService.update(id, dto, await this.scope(actor));
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Đổi trạng thái phòng (chỉ phòng AVAILABLE mới đặt lịch được)' })
  async setRoomStatus(
    @Param('id') id: string,
    @Body() dto: SetRoomStatusDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.roomsService.setRoomStatus(id, dto, await this.scope(actor));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xóa phòng — chỉ khi không còn thiết bị / buổi tập liên quan' })
  async remove(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    return this.roomsService.remove(id, await this.scope(actor));
  }
}
