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
    summary:
      'Báo cáo tổng quan số liệu hệ thống (Hội viên, HLV, Check-in, Doanh thu). Hỗ trợ lọc theo chi nhánh ?branchId=',
  })
  @ApiQuery({ name: 'branchId', required: false, description: 'Lọc theo chi nhánh' })
  getSummary(@Query('branchId') branchId?: string) {
    return this.reportsService.getSummary(branchId);
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
      'Tổng hợp nhanh toàn hệ thống (STEP 8): summary + doanh thu (today/week/month/year/total) + chuyên cần (total/peak/avgPerDay). ?branchId=',
  })
  @ApiQuery({ name: 'branchId', required: false, description: 'Lọc theo chi nhánh' })
  getOverview(@Query('branchId') branchId?: string) {
    return this.reportsService.getOverview({ branchId });
  }

  @Get('members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo hội viên (STEP 8): tổng/đang hoạt động/chờ duyệt, trạng thái, tăng trưởng theo tháng, danh sách gần nhất.',
  })
  getMembers(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getMembersReport({ branchId, from, to, search });
  }

  @Get('memberships')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo gói tập (STEP 8): phổ biến nhất, trạng thái membership, số đăng ký theo tháng.',
  })
  getMemberships(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('packageId') packageId?: string,
  ) {
    return this.reportsService.getMembershipsReport({ branchId, from, to, packageId });
  }

  @Get('trainers')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Báo cáo HLV (STEP 8): số hội viên đang phụ trách, số buổi tập, số buổi hoàn thành, theo chi nhánh.',
  })
  getTrainers(@Query('branchId') branchId?: string) {
    return this.reportsService.getTrainersReport({ branchId });
  }

  @Get('attendance')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Báo cáo chuyên cần tổng hợp (STEP 8): cards + theo ngày / giờ / thứ trong tuần / chi nhánh. ?from=&to=&branchId=',
  })
  getAttendance(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getAttendanceReport({ from, to, branchId });
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
    @Query() query: { branchId?: string; from?: string; to?: string; search?: string },
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
    summary:
      'Dữ liệu Dashboard admin: summary + đăng ký gần đây + thanh toán chờ xác nhận. Hỗ trợ ?branchId=',
  })
  getDashboard(@Query('branchId') branchId?: string) {
    return this.reportsService.getDashboard(branchId);
  }

  @Get('branches')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: 'Tổng quan từng chi nhánh: hội viên, check-in, doanh thu, thiết bị, HLV.',
  })
  getBranches() {
    return this.reportsService.getBranchOverview();
  }

  @Get('equipment')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Thống kê thiết bị hệ thống.' })
  getEquipment() {
    return this.reportsService.getEquipmentStats();
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