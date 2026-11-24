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
