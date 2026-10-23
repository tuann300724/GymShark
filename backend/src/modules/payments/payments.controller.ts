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
    summary: 'Danh sÃ¡ch giao dá»‹ch thanh toÃ¡n (admin) â€” filter, search, phÃ¢n trang kÃ¨m thá»‘ng kÃª doanh thu',
  })
  findAll(@Query() query: PaymentListQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('bank-info')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'ThÃ´ng tin tÃ i khoáº£n nháº­n tiá»n (chuyá»ƒn khoáº£n) + danh sÃ¡ch cá»•ng thanh toÃ¡n' })
  getBankInfo() {
    return this.paymentsService.getBankInfo();
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Lá»‹ch sá»­ thanh toÃ¡n cá»§a há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMyPayments(@CurrentUser('id') userId: string) {
    return this.memberService.getPayments(userId);
  }

  @Get('me/:id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiáº¿t hÃ³a Ä‘Æ¡n cá»§a há»™i viÃªn (chá»‰ xem Ä‘Æ°á»£c cá»§a chÃ­nh mÃ¬nh)' })
  getMyPayment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.memberService.getPaymentDetail(userId, id);
  }

  @Post('me')
  @Roles(Role.MEMBER)
  @ApiOperation({
    summary:
      'Táº¡o yÃªu cáº§u thanh toÃ¡n (Ä‘Äƒng kÃ½ / gia háº¡n gÃ³i). Amount do backend tÃ­nh tá»« package, khÃ´ng tin frontend.',
  })
  @ApiResponse({ status: 201, description: 'Táº¡o yÃªu cáº§u thÃ nh cÃ´ng (Payment PENDING + Invoice ISSUED)' })
  @ApiResponse({ status: 409, description: 'ÄÃ£ cÃ³ gÃ³i chá» xÃ¡c nháº­n / Ä‘ang hoáº¡t Ä‘á»™ng' })
  createPaymentRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: MemberPaymentCreateDto,
  ) {
    return this.memberService.requestPayment(userId, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiáº¿t má»™t giao dá»‹ch thanh toÃ¡n (admin)' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/confirm')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'XÃ¡c nháº­n thanh toÃ¡n: Payment PENDING â†’ PAID, Membership â†’ ACTIVE, Invoice â†’ PAID (transaction)',
  })
  @ApiParam({ name: 'id', description: 'ID giao dá»‹ch thanh toÃ¡n' })
  @ApiResponse({ status: 200, description: 'XÃ¡c nháº­n thÃ nh cÃ´ng' })
  @ApiResponse({ status: 400, description: 'Chá»‰ hÃ³a Ä‘Æ¡n PENDING xÃ¡c nháº­n Ä‘Æ°á»£c' })
  @ApiResponse({ status: 403, description: 'STAFF chá»‰ xÃ¡c nháº­n Ä‘Æ°á»£c Tiá»n máº·t / Chuyá»ƒn khoáº£n' })
  @ApiResponse({ status: 409, description: 'MÃ£ giao dá»‹ch trÃ¹ng vá»›i hÃ³a Ä‘Æ¡n khÃ¡c' })
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirm(id, user, dto);
  }

  @Post(':id/check-casso')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.MEMBER)
  @ApiOperation({ summary: 'Äá»‘i soÃ¡t tá»± Ä‘á»™ng CASSO: poll Google Sheet â†’ khá»›p GYM ... â†’ xÃ¡c nháº­n PAID' })
  @ApiParam({ name: 'id', description: 'ID thanh toÃ¡n' })
  @ApiResponse({ status: 200, description: 'Khá»›p CASSO â†’ PAID / ChÆ°a khá»›p â†’ PENDING' })
  checkCasso(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
  ) {
    return this.paymentsService.verifyCasso(id, user);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tá»« chá»‘i/há»§y thanh toÃ¡n Ä‘ang chá»: Payment â†’ CANCELLED, Membership â†’ CANCELLED' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string; fullName?: string },
    @Body() dto: RejectPaymentDto,
  ) {
    return this.paymentsService.reject(id, user, dto);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'HoÃ n tiá»n (chá»‰ ADMIN): Payment PAID â†’ REFUNDED, Invoice â†’ CANCELLED' })
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
  @ApiOperation({ summary: '[Back-compat] XÃ¡c nháº­n thanh toÃ¡n (alias cá»§a POST /:id/confirm)' })
  approve(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.paymentsService.confirm(id, user, {});
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: '[Back-compat] Há»§y hÃ³a Ä‘Æ¡n Ä‘ang chá» (alias cá»§a POST /:id/reject)' })
  cancel(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.paymentsService.cancel(id, user);
  }
}
