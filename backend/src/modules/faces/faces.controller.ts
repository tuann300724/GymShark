import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FacesService } from './faces.service';
import { AzureFaceService } from './azure-face.service';
import { CheckGlassesDto, EnrollFaceDto } from './dto/faces.dto';
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
  constructor(
    private readonly facesService: FacesService,
    private readonly azureFaceService: AzureFaceService,
  ) {}

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
      'Đăng ký khuôn mặt (vector embedding + ảnh tham chiếu, đồng ý tường minh theo Nghị định 13/2023)',
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
  // Kiểm tra kính (dùng chung cho tự đăng ký và đăng ký tại quầy)
  // ---------------------------------------------------------------------------

  @Post('check-glasses')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'Kiểm tra ảnh có đeo kính không (Azure AI Vision). Ảnh được chuyển tiếp lên dịch vụ bên thứ ba và không lưu lại. Trả available=false nếu dịch vụ chưa cấu hình/lỗi — client KHÔNG chặn người dùng khi đó.',
  })
  checkGlasses(@Body() dto: CheckGlassesDto) {
    return this.azureFaceService.detect(dto.imageData);
  }

  // ---------------------------------------------------------------------------
  // Admin / Manager / Staff — đăng ký thay & quản lý đăng ký khuôn mặt của hội viên
  // ---------------------------------------------------------------------------

  @Get('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Xem trạng thái + ảnh đăng ký khuôn mặt của một hội viên' })
  getMemberFace(@Param('memberId') memberId: string) {
    return this.facesService.getMemberFace(memberId);
  }

  @Post('member/:memberId/enroll')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Nhân viên đăng ký khuôn mặt THAY hội viên tại quầy (kèm ảnh chụp để đối chiếu, cần xác nhận đồng ý)',
  })
  adminEnroll(
    @Param('memberId') memberId: string,
    @Body() dto: EnrollFaceDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.facesService.enrollForMember(memberId, dto, actorId);
  }

  @Delete('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Xoá đăng ký khuôn mặt của một hội viên (khi hội viên yêu cầu)' })
  adminWithdraw(@Param('memberId') memberId: string, @CurrentUser('id') actorId: string) {
    return this.facesService.adminWithdraw(memberId, actorId);
  }
}
