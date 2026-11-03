import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  DailyReportQueryDto,
  HourlyReportQueryDto,
  MemberAttendanceQueryDto,
} from '../checkins/dto/checkin.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Báo cáo tổng quan số liệu hệ thống (Hội viên, HLV, Check-in, Doanh thu).',
  })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('revenue')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo doanh thu: hôm nay/tuần/tháng/năm, theo ngày, theo tháng, theo phương thức, theo gói tập. Chỉ tính PAID; REFUNDED hạch toán riêng.',
  })
  getRevenue(@Query() query: RevenueReportQueryDto) {
    return this.reportsService.getRevenue(query);
  }

  @Get('overview')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Tổng hợp nhanh toàn hệ thống (STEP 8): summary + doanh thu (today/week/month/year/total) + chuyên cần (total/peak/avgPerDay).',
  })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo hội viên (STEP 8): tổng/đang hoạt động/chờ duyệt, trạng thái, tăng trưởng theo tháng, danh sách gần nhất.',
  })
  getMembers(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getMembersReport({ from, to, search });
  }

  @Get('memberships')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo gói tập (STEP 8): phổ biến nhất, trạng thái membership, số đăng ký theo tháng.',
  })
  getMemberships(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('packageId') packageId?: string,
  ) {
    return this.reportsService.getMembershipsReport({ from, to, packageId });
  }

  @Get('trainers')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Báo cáo HLV (STEP 8): số hội viên đang phụ trách, số buổi tập, số buổi hoàn thành.',
  })
  getTrainers() {
    return this.reportsService.getTrainersReport();
  }

  @Get('attendance')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo chuyên cần tổng hợp (STEP 8): cards + theo ngày / giờ / thứ trong tuần / hình thức check-in.',
  })
  getAttendance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getAttendanceReport({ from, to });
  }

  @Get('export/csv')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Xuất CSV (STEP 8): type=revenue|members|attendance|memberships (+ các filter chung). File có BOM cho Excel.',
  })
  @ApiQuery({ name: 'type', required: true, enum: ['revenue', 'members', 'attendance', 'memberships'] })
  async exportCsv(
    @Query('type') type: string,
    @Query() query: { from?: string; to?: string; search?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filename, csv } = await this.reportsService.exportCsv(type, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Dữ liệu Dashboard admin: summary + đăng ký gần đây + thanh toán chờ xác nhận.',
  })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('checkins/daily')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  getCheckInsDaily(@Query() query: DailyReportQueryDto) {
    return this.reportsService.getCheckInsDaily(query.from, query.to);
  }

  @Get('checkins/hourly')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  getCheckInsHourly(@Query() query: HourlyReportQueryDto) {
    return this.reportsService.getCheckInsHourly(query.date);
  }

  @Get('checkins/members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  getMemberAttendance(@Query() query: MemberAttendanceQueryDto) {
    return this.reportsService.getMemberAttendance(query.from, query.to, query.search);
  }
}
