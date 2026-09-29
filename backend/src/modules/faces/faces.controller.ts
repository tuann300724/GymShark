import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FacesService } from './faces.service';
import { EnrollFaceDto } from './dto/faces.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Face Recognition')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('faces')
export class FacesController {
  constructor(private readonly facesService: FacesService) {}

  // ---------------------------------------------------------------------------
  // Hội viên — dữ liệu khuôn mặt của chính mình
  // ---------------------------------------------------------------------------

  @Get('me')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Trạng thái đăng ký khuôn mặt của hội viên đang đăng nhập' })
  getMyStatus(@CurrentUser('id') userId: string) {
    return this.facesService.getMyStatus(userId);
  }

  @Post('enroll')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'Đăng ký khuôn mặt (gửi vector embedding + đồng ý tường minh theo Nghị định 13/2023, không gửi ảnh)',
  })
  enroll(@CurrentUser('id') userId: string, @Body() dto: EnrollFaceDto) {
    return this.facesService.enroll(userId, dto);
  }

  @Delete('enroll')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Rút lui đồng ý — xoá toàn bộ dữ liệu khuôn mặt của chính mình' })
  withdraw(@CurrentUser('id') userId: string) {
    return this.facesService.withdraw(userId);
  }

  // ---------------------------------------------------------------------------
  // Admin / Manager — quản lý đăng ký của hội viên (hỗ trợ khi hội viên cần xoá)
  // ---------------------------------------------------------------------------

  @Get('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xem trạng thái đăng ký khuôn mặt của một hội viên' })
  getMemberFace(@Param('memberId') memberId: string) {
    return this.facesService.getMemberFace(memberId);
  }

  @Delete('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xoá đăng ký khuôn mặt của một hội viên (khi hội viên yêu cầu)' })
  adminWithdraw(@Param('memberId') memberId: string, @CurrentUser('id') actorId: string) {
    return this.facesService.adminWithdraw(memberId, actorId);
  }
}
