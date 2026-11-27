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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AttributePaymentDto } from './dto/attribute-payment.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { UpdatePartnerTierDto } from './dto/update-tier.dto';
import {
  RenewalRequestDto,
  UpdatePartnerContractDto,
  UpdatePartnershipPlanDto,
} from './dto/partnership.dto';
import { PartnerDecisionDto } from './dto/partner-decision.dto';
import { QueryPartnersDto } from './dto/query-partners.dto';
import { PartnersService } from './partners.service';
import { PartnerBranchDto } from './dto/update-partner-branch.dto';

@ApiTags('Partners')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners/me')
export class PartnerSelfController {
  constructor(private readonly service: PartnersService) {}

  @Get('commission')
  @ApiOperation({ summary: 'Tổng hợp hoa hồng của chính đối tác (không chứa dữ liệu hội viên)' })
  commission(@CurrentUser('id') userId: string) {
    return this.service.getMyCommission(userId);
  }

  @Get('network-members')
  @ApiOperation({
    summary:
      'Hội viên Gym Master đã tập tại phòng của đối tác (thông tin tối thiểu, không SĐT/email)',
  })
  networkMembers(@CurrentUser('id') userId: string) {
    return this.service.getMyNetworkMembers(userId);
  }

  @Get('partnership')
  @ApiOperation({
    summary: 'Hợp đồng hợp tác của chính đối tác: loại gói, phí, thời hạn, hạng phòng, gói tập được vào',
  })
  partnership(@CurrentUser('id') userId: string) {
    return this.service.getMyPartnership(userId);
  }

  @Post('renewal-request')
  @ApiOperation({ summary: 'Đối tác gửi yêu cầu gia hạn hợp đồng — báo admin xử lý' })
  renewalRequest(@CurrentUser('id') userId: string, @Body() dto: RenewalRequestDto) {
    return this.service.requestRenewal(userId, dto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Danh sách cơ sở thuộc doanh nghiệp đang đăng nhập' })
  branches(@CurrentUser('id') userId: string) {
    return this.service.listMyBranches(userId);
  }

  @Post('branches')
  @ApiOperation({ summary: 'Tạo cơ sở mới cho doanh nghiệp đang đăng nhập' })
  createBranch(@CurrentUser('id') userId: string, @Body() dto: PartnerBranchDto) {
    return this.service.createBranch(userId, dto);
  }

  @Patch('branches/:branchId')
  @ApiOperation({ summary: 'Cập nhật cơ sở thuộc doanh nghiệp đang đăng nhập' })
  updateBranch(
    @CurrentUser('id') userId: string,
    @Param('branchId') branchId: string,
    @Body() dto: PartnerBranchDto,
  ) {
    return this.service.updateBranch(userId, branchId, dto);
  }

  @Delete('branches/:branchId')
  @ApiOperation({ summary: 'Xóa cơ sở thuộc doanh nghiệp đang đăng nhập' })
  deleteBranch(@CurrentUser('id') userId: string, @Param('branchId') branchId: string) {
    return this.service.deleteBranch(userId, branchId);
  }
}

@ApiTags('Admin — Partnership plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/partnership-plans')
export class AdminPartnershipPlansController {
  constructor(private readonly service: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Bảng giá 2 gói hợp tác đối tác' })
  list() {
    return this.service.listPlans();
  }

  @Patch(':code')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Sửa giá gói hợp tác (chỉ ADMIN) — áp dụng cho hợp đồng ký mới' })
  update(
    @Param('code') code: string,
    @Body() dto: UpdatePartnershipPlanDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.updatePlan(code, dto, actorId);
  }
}

@ApiTags('Admin — Partners')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Controller('admin/partners')
export class AdminPartnersController {
  constructor(private readonly service: PartnersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đối tác (admin/manager)' })
  list(@Query() query: QueryPartnersDto) {
    return this.service.adminList(query);
  }

  @Get(':id/commission')
  @ApiOperation({ summary: 'Tổng hợp hoa hồng + lượt tập tại đối tác' })
  commission(@Param('id') id: string) {
    return this.service.adminCommission(id);
  }

  @Patch(':id/commission')
  @ApiOperation({ summary: 'Cập nhật tỷ lệ hoa hồng của đối tác' })
  updateCommission(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminUpdateCommission(id, dto.commissionRate, actorId);
  }

  @Patch(':id/tier')
  @ApiOperation({ summary: 'Xếp hạng / đánh giá lại hạng phòng gym của đối tác' })
  updateTier(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerTierDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminUpdateTier(id, dto.gymTier, dto.note, actorId);
  }

  @Patch(':id/contract')
  @ApiOperation({ summary: 'Đổi loại hợp tác / gia hạn thời hạn hợp đồng đối tác' })
  updateContract(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerContractDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminUpdateContract(id, dto, actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hồ sơ đối tác' })
  detail(@Param('id') id: string) {
    return this.service.adminDetail(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Duyệt đăng ký đối tác' })
  approve(
    @Param('id') id: string,
    @Body() dto: PartnerDecisionDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminDecision(id, 'APPROVE', dto.note, actorId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Từ chối đăng ký đối tác' })
  reject(
    @Param('id') id: string,
    @Body() dto: PartnerDecisionDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminDecision(id, 'REJECT', dto.note, actorId);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Tạm khóa đối tác' })
  suspend(
    @Param('id') id: string,
    @Body() dto: PartnerDecisionDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminDecision(id, 'SUSPEND', dto.note, actorId);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Gán giao dịch vào doanh thu riêng của đối tác' })
  assignPayment(
    @Param('id') id: string,
    @Body() dto: AttributePaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminAssignPayment(id, dto.paymentCode, actorId);
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Bỏ gán giao dịch khỏi đối tác' })
  unassignPayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.service.adminUnassignPayment(id, paymentId, actorId);
  }
}
