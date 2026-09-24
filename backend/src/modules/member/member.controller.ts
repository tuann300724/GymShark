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
  @ApiOperation({ summary: 'Đăng ký gói tập mới (tạo Membership + Payment, mock payment hoàn tất)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Đang có gói tập hoạt động' })
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