import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PtSessionsService } from './pt-sessions.service';
import {
  AcceptPtSessionDto,
  CreatePtSessionDto,
  DeclinePtSessionDto,
  PtPayoutDto,
  PtSessionQueryDto,
} from './dto/pt-session.dto';

@ApiTags('PT Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pt-sessions')
export class PtSessionsController {
  constructor(private readonly service: PtSessionsService) {}

  // --- PT ---
  @Post()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'PT gửi đề nghị buổi tập (thẻ trong chat) cho hội viên đã nhắn tin' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePtSessionDto) {
    return this.service.create(userId, dto);
  }

  @Get('trainer/me')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'PT: các buổi đã đề nghị + thu nhập sau chiết khấu' })
  listForTrainer(@CurrentUser('id') userId: string) {
    return this.service.listForTrainer(userId);
  }

  @Get('trainer/payouts/:payoutId/proof')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'PT: ảnh chứng từ một lần GymMaster chi trả' })
  payoutProof(@CurrentUser('id') userId: string, @Param('payoutId') payoutId: string) {
    return this.service.getMyPayoutProof(userId, payoutId);
  }

  @Post(':id/cancel')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'PT huỷ đề nghị hội viên chưa chấp nhận' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.cancelByTrainer(userId, id);
  }

  // --- Hội viên ---
  @Get('member/me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên: các buổi PT đã được đề nghị / đã đặt' })
  listForMember(@CurrentUser('id') userId: string) {
    return this.service.listForMember(userId);
  }

  @Post(':id/accept')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên chấp nhận buổi tập → tạo hoá đơn chờ thanh toán' })
  accept(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AcceptPtSessionDto,
  ) {
    return this.service.accept(userId, id, dto);
  }

  @Post(':id/decline')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên từ chối đề nghị buổi tập' })
  decline(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: DeclinePtSessionDto,
  ) {
    return this.service.decline(userId, id, dto);
  }

  // --- Admin ---
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Admin: buổi PT đặt qua hệ thống + tổng hợp chiết khấu / chi trả theo PT' })
  adminList(@Query() query: PtSessionQueryDto) {
    return this.service.adminList(query);
  }

  @Post('payout')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Admin ghi nhận đã chi trả phần của PT (buổi đã thanh toán + đã diễn ra)' })
  payout(@CurrentUser('id') userId: string, @Body() dto: PtPayoutDto) {
    return this.service.payout(dto.trainerId, userId, dto);
  }
}
