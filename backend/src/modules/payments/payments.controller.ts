import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MemberService } from '../member/member.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentListQueryDto } from './dto/payment-list-query.dto';
import { MemberPaymentCreateDto } from './dto/member-payment-create.dto';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly memberService: MemberService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Danh sách giao dịch thanh toán (admin) — filter, search, phân trang kèm thống kê doanh thu',
  })
  findAll(@Query() query: PaymentListQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('bank-info')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Thông tin tài khoản nhận tiền (chuyển khoản) + danh sách cổng thanh toán' })
  getBankInfo() {
    return this.paymentsService.getBankInfo();
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Lịch sử thanh toán của hội viên đang đăng nhập' })
  getMyPayments(@CurrentUser('id') userId: string) {
    return this.memberService.getPayments(userId);
  }

  @Get('me/:id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiết hóa đơn của hội viên (chỉ xem được của chính mình)' })
  getMyPayment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.memberService.getPaymentDetail(userId, id);
  }

  @Post('me')
  @Roles(Role.MEMBER)
  @ApiOperation({
    summary:
      'Tạo yêu cầu thanh toán (đăng ký / gia hạn gói). Amount do backend tính từ package, không tin frontend.',
  })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu thành công (Payment PENDING + Invoice ISSUED)' })
  @ApiResponse({ status: 409, description: 'Đã có gói chờ xác nhận / đang hoạt động' })
  createPaymentRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: MemberPaymentCreateDto,
  ) {
    return this.memberService.requestPayment(userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiết một giao dịch thanh toán (admin)' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/confirm')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Xác nhận thanh toán: Payment PENDING → PAID, Membership → ACTIVE, Invoice → PAID (transaction)',
  })
  @ApiParam({ name: 'id', description: 'ID giao dịch thanh toán' })
  @ApiResponse({ status: 200, description: 'Xác nhận thành công' })
  @ApiResponse({ status: 400, description: 'Chỉ hóa đơn PENDING xác nhận được' })
  @ApiResponse({ status: 403, description: 'STAFF chỉ xác nhận được Tiền mặt / Chuyển khoản' })
  @ApiResponse({ status: 409, description: 'Mã giao dịch trùng với hóa đơn khác' })
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirm(id, user, dto);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Từ chối/hủy thanh toán đang chờ: Payment → CANCELLED, Membership → CANCELLED' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
    @Body() dto: RejectPaymentDto,
  ) {
    return this.paymentsService.reject(id, user, dto);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Hoàn tiền (chỉ ADMIN): Payment PAID → REFUNDED, Invoice → CANCELLED' })
  refund(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(id, user, dto);
  }

  // ---------- Back-compat (STEP 4) ----------

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: '[Back-compat] Xác nhận thanh toán (alias của POST /:id/confirm)' })
  approve(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.paymentsService.confirm(id, user, {});
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: '[Back-compat] Hủy hóa đơn đang chờ (alias của POST /:id/reject)' })
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.paymentsService.cancel(id, user);
  }
}