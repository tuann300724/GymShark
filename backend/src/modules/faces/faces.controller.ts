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
  // Há»™i viÃªn â€” dá»¯ liá»‡u khuÃ´n máº·t cá»§a chÃ­nh mÃ¬nh
  // ---------------------------------------------------------------------------

  @Get('me')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Tráº¡ng thÃ¡i Ä‘Äƒng kÃ½ khuÃ´n máº·t cá»§a há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMyStatus(@CurrentUser('id') userId: string) {
    return this.facesService.getMyStatus(userId);
  }

  @Post('enroll')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'ÄÄƒng kÃ½ khuÃ´n máº·t (vector embedding + áº£nh tham chiáº¿u, Ä‘á»“ng Ã½ tÆ°á»ng minh theo Nghá»‹ Ä‘á»‹nh 13/2023)',
  })
  enroll(@CurrentUser('id') userId: string, @Body() dto: EnrollFaceDto) {
    return this.facesService.enroll(userId, dto);
  }

  @Delete('enroll')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'RÃºt lui Ä‘á»“ng Ã½ â€” xoÃ¡ toÃ n bá»™ dá»¯ liá»‡u khuÃ´n máº·t cá»§a chÃ­nh mÃ¬nh' })
  withdraw(@CurrentUser('id') userId: string) {
    return this.facesService.withdraw(userId);
  }

  // ---------------------------------------------------------------------------
  // Kiá»ƒm tra kÃ­nh (dÃ¹ng chung cho tá»± Ä‘Äƒng kÃ½ vÃ  Ä‘Äƒng kÃ½ táº¡i quáº§y)
  // ---------------------------------------------------------------------------

  @Post('check-glasses')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'Kiá»ƒm tra áº£nh cÃ³ Ä‘eo kÃ­nh khÃ´ng (Azure AI Vision). áº¢nh Ä‘Æ°á»£c chuyá»ƒn tiáº¿p lÃªn dá»‹ch vá»¥ bÃªn thá»© ba vÃ  khÃ´ng lÆ°u láº¡i. Tráº£ available=false náº¿u dá»‹ch vá»¥ chÆ°a cáº¥u hÃ¬nh/lá»—i â€” client KHÃ”NG cháº·n ngÆ°á»i dÃ¹ng khi Ä‘Ã³.',
  })
  checkGlasses(@Body() dto: CheckGlassesDto) {
    return this.azureFaceService.detect(dto.imageData);
  }

  // ---------------------------------------------------------------------------
  // Admin / Manager / Staff â€” Ä‘Äƒng kÃ½ thay & quáº£n lÃ½ Ä‘Äƒng kÃ½ khuÃ´n máº·t cá»§a há»™i viÃªn
  // ---------------------------------------------------------------------------

  @Get('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Xem tráº¡ng thÃ¡i + áº£nh Ä‘Äƒng kÃ½ khuÃ´n máº·t cá»§a má»™t há»™i viÃªn' })
  getMemberFace(@Param('memberId') memberId: string) {
    return this.facesService.getMemberFace(memberId);
  }

  @Post('member/:memberId/enroll')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'NhÃ¢n viÃªn Ä‘Äƒng kÃ½ khuÃ´n máº·t THAY há»™i viÃªn táº¡i quáº§y (kÃ¨m áº£nh chá»¥p Ä‘á»ƒ Ä‘á»‘i chiáº¿u, cáº§n xÃ¡c nháº­n Ä‘á»“ng Ã½)',
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
  @ApiOperation({ summary: 'XoÃ¡ Ä‘Äƒng kÃ½ khuÃ´n máº·t cá»§a má»™t há»™i viÃªn (khi há»™i viÃªn yÃªu cáº§u)' })
  adminWithdraw(@Param('memberId') memberId: string, @CurrentUser('id') actorId: string) {
    return this.facesService.adminWithdraw(memberId, actorId);
  }
}
