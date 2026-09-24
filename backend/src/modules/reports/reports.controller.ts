import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Báo cáo tổng quan số liệu hệ thống (Hội viên, HLV, Check-in, Doanh thu)' })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('revenue')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Báo cáo xu hướng doanh thu theo các đợt thanh toán' })
  getRevenue() {
    return this.reportsService.getRevenueTrend();
  }
}
