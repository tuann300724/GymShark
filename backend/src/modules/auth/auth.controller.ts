import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MemberRegisterDto } from './dto/member-register.dto';
import { ResendMemberVerifyCodeDto } from './dto/resend-member-verify-code.dto';
import { VerifyMemberRegisterDto } from './dto/verify-member-register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập hệ thống (Lấy JWT Access Token)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về token' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu sai' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req.ip);
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới' })
  @ApiResponse({ status: 201, description: 'Tài khoản được tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('member-register/send-code')
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Bước 1 đăng ký hội viên — gửi mã xác minh 6 số về email',
    description:
      'Nhận thông tin đăng ký, lưu tạm và gửi mã 6 chữ số tới chính email hội viên khai báo. ' +
      'Chưa tạo tài khoản — phải gọi /auth/member-register/verify với mã đó mới đăng ký thành công.',
  })
  @ApiResponse({ status: 201, description: 'Mã xác minh đã được gửi về email' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  @ApiResponse({ status: 503, description: 'Không gửi được email (SMTP lỗi / chưa cấu hình)' })
  async memberRegisterSendCode(@Body() dto: MemberRegisterDto, @Req() req: Request) {
    return this.authService.requestMemberRegistrationCode(dto, req.ip);
  }

  @Public()
  @Post('member-register/resend-code')
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Gửi lại mã xác minh đăng ký hội viên' })
  @ApiResponse({ status: 201, description: 'Đã gửi lại mã xác minh' })
  @ApiResponse({ status: 404, description: 'Không có yêu cầu đăng ký đang chờ cho email này' })
  @ApiResponse({ status: 429, description: 'Gửi lại quá sớm, cần chờ hết khoảng nghỉ' })
  async memberRegisterResendCode(@Body() dto: ResendMemberVerifyCodeDto, @Req() req: Request) {
    return this.authService.resendMemberVerificationCode(dto.email, req.ip);
  }

  @Public()
  @Post('member-register/verify')
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bước 2 đăng ký hội viên — xác minh mã và tạo tài khoản',
    description: 'Mã đúng và còn hạn thì tạo User (role MEMBER) + hồ sơ Member + thông báo chào mừng.',
  })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công, tài khoản đã được tạo' })
  @ApiResponse({ status: 400, description: 'Mã sai / hết hạn / hết lượt thử' })
  @ApiResponse({ status: 409, description: 'Email đã được dùng để đăng ký tài khoản khác' })
  async memberRegisterVerify(@Body() dto: VerifyMemberRegisterDto, @Req() req: Request) {
    return this.authService.confirmMemberRegistration(dto, req.ip);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực hoặc token hết hạn' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Endpoint thử nghiệm RBAC dành riêng cho ADMIN' })
  testAdmin(@CurrentUser() user: any) {
    return {
      message: 'Bạn có quyền ADMIN tối cao!',
      user,
    };
  }
}
