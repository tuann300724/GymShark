import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { ExtendMembershipDto } from './dto/extend-membership.dto';
import { CreateCancelRequestDto } from './dto/create-cancel-request.dto';
import { ApproveCancelRequestDto } from './dto/approve-cancel-request.dto';
import { RejectCancelRequestDto } from './dto/reject-cancel-request.dto';
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

  // ---------------- Yêu cầu hủy gói (hội viên gửi → admin duyệt) ----------------

  @Post(':id/cancel-request')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên gửi yêu cầu hủy gói đang hoạt động (chờ admin xét duyệt)' })
  @ApiResponse({ status: 201, description: 'Đã gửi yêu cầu hủy gói' })
  @ApiResponse({ status: 409, description: 'Gói không ACTIVE hoặc đã gửi yêu cầu trước đó' })
  createCancelRequest(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCancelRequestDto,
  ) {
    return this.membershipsService.createCancelRequest(userId, id, dto);
  }

  @Post(':id/cancel-request/approve')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Duyệt yêu cầu hủy gói: hủy Membership + hoàn tiền (refund > 0 chỉ ADMIN)' })
  @ApiResponse({ status: 201, description: 'Đã hủy gói (kèm hoàn tiền nếu có)' })
  @ApiResponse({ status: 403, description: 'MANAGER/STAFF không được duyệt hoàn tiền > 0' })
  approveCancelRequest(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ApproveCancelRequestDto,
  ) {
    return this.membershipsService.approveCancelRequest(id, dto, role, actorId);
  }

  @Post(':id/cancel-request/reject')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Từ chối yêu cầu hủy gói — gói tiếp tục hoạt động' })
  @ApiResponse({ status: 201, description: 'Đã từ chối yêu cầu' })
  rejectCancelRequest(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: RejectCancelRequestDto,
  ) {
    return this.membershipsService.rejectCancelRequest(id, dto, actorId);
  }
}
