import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BodyMetricsService } from './body-metrics.service';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Body Metrics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('body-metrics')
export class BodyMetricsController {
  constructor(private readonly svc: BodyMetricsService) {}

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Lịch sử số đo cơ thể của tôi' })
  @ApiQuery({ name: 'limit', required: false })
  listMine(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.svc.listMine(userId, limit ? Number(limit) : undefined);
  }

  @Get('member/:memberId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: '[HLV/QTV] Số đo cơ thể của 1 hội viên' })
  @ApiQuery({ name: 'limit', required: false })
  listForMember(
    @Param('memberId') memberId: string,
    @CurrentUser('role') role: string,
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listForMember(memberId, role, userId, limit ? Number(limit) : undefined);
  }

  @Post()
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Ghi số đo cơ thể (ít nhất 1 chỉ số)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBodyMetricDto) {
    return this.svc.create(userId, dto);
  }

  @Delete(':id')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: '[Hội viên] Xóa bản ghi số đo của mình' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.remove(userId, id);
  }
}
