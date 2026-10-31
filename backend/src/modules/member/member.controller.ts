import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterMembershipDto } from './dto/register-membership.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Member Portal')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MEMBER, Role.TRAINER)
@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  // ---------------- Profile ----------------

  @Get('me')
  @ApiOperation({ summary: 'Thông tin hồ sơ hội viên của tài khoản đang đăng nhập' })
  getMe(@CurrentUser('id') userId: string) {
    return this.memberService.getMe(userId);
  }

  @Get('me/referral')
  @ApiOperation({ summary: 'Mã giới thiệu cá nhân + thống kê những người đã giới thiệu' })
  getMyReferral(@CurrentUser('id') userId: string) {
    return this.memberService.getMyReferral(userId);
  }

  @Get('qr')
  @ApiOperation({
    summary: 'Mã QR cá nhân của hội viên (thẻ ra vào — lễ tân quét để check-in)',
  })
  getQr(@CurrentUser('id') userId: string) {
    return this.memberService.getQr(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ hội viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.updateMe(userId, dto);
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu hiện tại sai' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.memberService.changePassword(userId, dto);
  }

  // ---------------- Dashboard stats ----------------

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê cho Member Dashboard' })
  getStats(@CurrentUser('id') userId: string) {
    return this.memberService.getStats(userId);
  }

  @Get('trainer')
  @ApiOperation({ summary: 'HLV hiện tại đang phụ trách hội viên đang đăng nhập' })
  getTrainer(@CurrentUser('id') userId: string) {
    return this.memberService.getTrainer(userId);
  }

  // ---------------- Memberships ----------------

  @Get('memberships')
  @ApiOperation({ summary: 'Lịch sử + gói tập hiện tại của hội viên' })
  getMemberships(@CurrentUser('id') userId: string) {
    return this.memberService.getMemberships(userId);
  }

  @Get('memberships/current')
  @ApiOperation({ summary: 'Gói tập đang hoạt động (nếu có)' })
  getCurrentMembership(@CurrentUser('id') userId: string) {
    return this.memberService.getCurrentMembership(userId);
  }

  @Post('memberships')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Đăng ký gói tập mới (tạo Membership + Payment PENDING, chờ xác nhận)' })
  @ApiResponse({ status: 201, description: 'Đã gửi yêu cầu đăng ký' })
  @ApiResponse({ status: 409, description: 'Đang có gói hoạt động hoặc đang chờ xác nhận' })
  registerMembership(@CurrentUser('id') userId: string, @Body() dto: RegisterMembershipDto) {
    return this.memberService.registerMembership(userId, dto);
  }

  @Post('memberships/renew')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Gia hạn gói tập đang hoạt động' })
  @ApiResponse({ status: 201, description: 'Gia hạn thành công' })
  renewMembership(@CurrentUser('id') userId: string, @Body() dto: RegisterMembershipDto) {
    return this.memberService.renewMembership(userId, dto);
  }

  @Post('payments/:id/cancel')
  @Roles(Role.MEMBER)
  @ApiOperation({
    summary:
      'Hội viên tự hủy yêu cầu đang chờ thanh toán: Payment + Membership + Invoice → CANCELLED',
  })
  @ApiResponse({ status: 200, description: 'Đã hủy yêu cầu' })
  @ApiResponse({ status: 400, description: 'Không ở trạng thái PENDING' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hoặc không thuộc hội viên này' })
  cancelPendingPayment(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.memberService.cancelPendingRequest(userId, id);
  }

  // ---------------- Check-ins ----------------

  @Get('checkins')
  @ApiOperation({ summary: 'Lịch sử check-in của hội viên (phân trang)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getCheckins(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit || '10', 10) || 10));
    return this.memberService.getCheckins(userId, p, l);
  }

  // ---------------- Schedules ----------------

  @Get('schedules')
  @ApiOperation({ summary: 'Lịch tập sắp tới của hội viên' })
  getSchedules(@CurrentUser('id') userId: string) {
    return this.memberService.getSchedules(userId);
  }

  // ---------------- Payments ----------------

  @Get('payments')
  @ApiOperation({ summary: 'Lịch sử thanh toán của hội viên' })
  getPayments(@CurrentUser('id') userId: string) {
    return this.memberService.getPayments(userId);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Chi tiết hóa đơn / invoice' })
  getPaymentDetail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.memberService.getPaymentDetail(userId, id);
  }

  // ---------------- Notifications ----------------

  @Get('notifications')
  @ApiOperation({ summary: 'Danh sách thông báo của hội viên' })
  getNotifications(@CurrentUser('id') userId: string) {
    return this.memberService.getNotifications(userId);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  markNotificationRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.memberService.markNotificationRead(userId, id);
  }

  @Patch('notifications/read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  markAllNotificationsRead(@CurrentUser('id') userId: string) {
    return this.memberService.markAllNotificationsRead(userId);
  }
}