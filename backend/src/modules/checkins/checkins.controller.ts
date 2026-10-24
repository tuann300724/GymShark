import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import {
  CheckInDto,
  FaceCheckInDto,
  FaceScanDto,
  GetCheckinsQueryDto,
  MyHistoryQueryDto,
  QrCheckInDto,
  QrLookupQueryDto,
  StaffCheckInDto,
} from './dto/checkin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Check-ins')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  // ---------------------------------------------------------------------------
  // Admin / Staff â€” toÃ n há»‡ thá»‘ng
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({
    summary: 'Lá»‹ch sá»­ check-in toÃ n há»‡ thá»‘ng (tÃ¬m kiáº¿m, lá»c, sáº¯p xáº¿p, phÃ¢n trang)',
  })
  findAll(@Query() query: GetCheckinsQueryDto) {
    return this.checkinsService.findAll(query);
  }

  @Get('currently-inside')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Danh sÃ¡ch há»™i viÃªn Ä‘ang cÃ³ máº·t trong phÃ²ng gym' })
  currentlyInside() {
    return this.checkinsService.currentlyInside();
  }

  @Post('staff')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Lá»… tÃ¢n check-in giÃºp há»™i viÃªn (theo memberId, khÃ´ng tin client)',
  })
  staffCheckIn(
    @Body() dto: StaffCheckInDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.checkinsService.staffCheckIn(dto, role, actorId);
  }

  @Post('face-scan')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Lá»… tÃ¢n quÃ©t khuÃ´n máº·t 1:N táº¡i quáº§y â€” server tá»± nháº­n diá»‡n há»™i viÃªn (vector) rá»“i check-in',
  })
  faceScan(
    @Body() dto: FaceScanDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.checkinsService.faceScanForStaff(dto, role, actorId);
  }

  @Get('qr/lookup')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Lá»… tÃ¢n nháº­p/dÃ¡n mÃ£ QR há»™i viÃªn Ä‘á»ƒ Ä‘á»‘i chiáº¿u há»“ sÆ¡ trÆ°á»›c khi check-in',
  })
  lookupByQr(@Query() query: QrLookupQueryDto) {
    return this.checkinsService.lookupByQr(query.token);
  }

  @Post('qr')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Check-in cho há»™i viÃªn báº±ng mÃ£ QR (ghi method = QR_CODE, Ä‘i qua cÃ¹ng kiá»ƒm tra tháº» táº­p)',
  })
  checkInByQr(
    @Body() dto: QrCheckInDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.checkinsService.checkInByQr(dto, role, actorId);
  }

  @Post('face')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary:
      'Há»™i viÃªn tá»± quÃ©t khuÃ´n máº·t Ä‘á»ƒ check-in (1:1 â€” so vector vá»›i máº«u Ä‘Ã£ Ä‘Äƒng kÃ½, khÃ´ng gá»­i áº£nh)',
  })
  faceCheckIn(@CurrentUser('id') userId: string, @Body() dto: FaceCheckInDto) {
    return this.checkinsService.faceCheckIn(userId, dto);
  }

  @Post(':id/checkout')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Admin/Staff chá»§ Ä‘á»™ng check-out cho má»™t phiÃªn táº­p Ä‘ang má»Ÿ' })
  checkoutById(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.checkinsService.checkoutById(id, actorId);
  }

  // ---------------------------------------------------------------------------
  // Member â€” chá»‰ dá»¯ liá»‡u cá»§a chÃ­nh mÃ¬nh
  // ---------------------------------------------------------------------------

  @Get('me/current')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Tráº¡ng thÃ¡i check-in hiá»‡n táº¡i cá»§a há»™i viÃªn Ä‘ang Ä‘Äƒng nháº­p' })
  getMyCurrent(@CurrentUser('id') userId: string) {
    return this.checkinsService.getCurrent(userId);
  }

  @Get('me/history')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Lá»‹ch sá»­ check-in cÃ¡ nhÃ¢n + thá»‘ng kÃª (thÃ¡ng/tuáº§n/trung bÃ¬nh)' })
  getMyHistory(@CurrentUser('id') userId: string, @Query() query: MyHistoryQueryDto) {
    return this.checkinsService.getMyHistory(userId, query);
  }

  @Post()
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({
    summary: 'Há»™i viÃªn tá»± check-in (láº¥y há»™i viÃªn tá»« JWT)',
  })
  checkIn(@CurrentUser('id') userId: string, @Body() dto: CheckInDto) {
    return this.checkinsService.checkIn(userId, dto.method);
  }

  @Post('checkout')
  @Roles(Role.MEMBER, Role.TRAINER)
  @ApiOperation({ summary: 'Há»™i viÃªn tá»± check-out phiÃªn táº­p Ä‘ang má»Ÿ cá»§a mÃ¬nh' })
  checkOut(@CurrentUser('id') userId: string) {
    return this.checkinsService.checkOut(userId);
  }

  @Post('face-checkout')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Lá»… tÃ¢n quÃ©t khuÃ´n máº·t Ä‘á»ƒ check-out (1:N â€” server tá»± nháº­n diá»‡n rá»“i check-out náº¿u Ä‘ang má»Ÿ)',
  })
  faceCheckOut(
    @Body() dto: FaceScanDto,
    @CurrentUser('role') role: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.checkinsService.faceCheckOut(dto, role, actorId);
  }
}
