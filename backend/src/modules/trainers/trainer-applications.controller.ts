import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveOwnerScope, type ScopeActor } from '../../common/utils/partner-scope';
import { TrainerApplicationsService } from './trainer-applications.service';
import {
  CreateTrainerApplicationDto,
  TrainerApplicationQueryDto,
} from './dto/trainer-application.dto';
import { TrainerReviewDto } from './dto/trainer.dto';

@ApiTags('Trainer Applications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainer-applications')
export class TrainerApplicationsController {
  constructor(
    private readonly service: TrainerApplicationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({
    summary: 'PT tự do gửi đơn đăng ký (kèm ảnh bằng cấp) — chưa tạo tài khoản, chờ admin duyệt',
  })
  @ApiResponse({ status: 201, description: 'Đã nhận đơn' })
  @ApiResponse({ status: 409, description: 'Email/SĐT đã có tài khoản hoặc đã có đơn chờ duyệt' })
  create(@Body() dto: CreateTrainerApplicationDto, @Req() req: Request) {
    return this.service.create(dto, req.ip);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Danh sách đơn đăng ký PT theo trạng thái (mặc định PENDING)' })
  async list(@Query() query: TrainerApplicationQueryDto, @CurrentUser() actor: ScopeActor) {
    await this.assertSystemActor(actor);
    return this.service.list(query);
  }

  @Get(':id/documents')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Ảnh bằng cấp / chứng chỉ của một đơn' })
  async documents(@Param('id') id: string, @CurrentUser() actor: ScopeActor) {
    await this.assertSystemActor(actor);
    return this.service.documents(id);
  }

  @Post(':id/review')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Duyệt (tạo tài khoản PT + email mật khẩu tạm) hoặc từ chối đơn (email lý do)',
  })
  async review(
    @Param('id') id: string,
    @Body() dto: TrainerReviewDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    await this.assertSystemActor(actor);
    return this.service.review(id, dto, actor.id);
  }

  /** Chỉ quản trị viên GymMaster duyệt PT tự do (đối tác không được) */
  private async assertSystemActor(actor: ScopeActor) {
    if ((await resolveOwnerScope(this.prisma, actor)) !== null) {
      throw new ForbiddenException('Chỉ quản trị viên GymMaster được duyệt đơn PT.');
    }
  }
}
