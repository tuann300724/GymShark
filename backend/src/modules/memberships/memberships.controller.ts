import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { ExtendMembershipDto } from './dto/extend-membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Memberships')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy danh sách các hợp đồng/thẻ hội viên' })
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Lấy chi tiết một hợp đồng/thẻ hội viên' })
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Cập nhật trạng thái: SUSPENDED / ACTIVE / CANCELLED / EXPIRED' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 409, description: 'Trạng thái chuyển đổi không hợp lệ' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMembershipStatusDto, @CurrentUser('id') actorId: string) {
    return this.membershipsService.updateStatus(id, dto, actorId);
  }

  @Patch(':id/extend')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Gia hạn thêm N ngày (tạo hóa đơn chờ thu tiền)' })
  @ApiResponse({ status: 200, description: 'Gia hạn thành công' })
  extend(@Param('id') id: string, @Body() dto: ExtendMembershipDto, @CurrentUser('id') actorId: string) {
    return this.membershipsService.extend(id, dto, actorId);
  }
}