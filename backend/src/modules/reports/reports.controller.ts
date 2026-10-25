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
    summary: 'BÃ¡o cÃ¡o tá»•ng quan sá»‘ liá»‡u há»‡ thá»‘ng (Há»™i viÃªn, HLV, Check-in, Doanh thu).',
  })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('revenue')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'BÃ¡o cÃ¡o doanh thu: hÃ´m nay/tuáº§n/thÃ¡ng/nÄƒm, theo ngÃ y, theo thÃ¡ng, theo phÆ°Æ¡ng thá»©c, theo gÃ³i táº­p. Chá»‰ tÃ­nh PAID; REFUNDED háº¡ch toÃ¡n riÃªng.',
  })
  getRevenue(@Query() query: RevenueReportQueryDto) {
    return this.reportsService.getRevenue(query);
  }

  @Get('overview')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Tá»•ng há»£p nhanh toÃ n há»‡ thá»‘ng (STEP 8): summary + doanh thu (today/week/month/year/total) + chuyÃªn cáº§n (total/peak/avgPerDay).',
  })
  getOverview() {
    return this.reportsService.getOverview();
  }

  @Get('members')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'BÃ¡o cÃ¡o há»™i viÃªn (STEP 8): tá»•ng/Ä‘ang hoáº¡t Ä‘á»™ng/chá» duyá»‡t, tráº¡ng thÃ¡i, tÄƒng trÆ°á»Ÿng theo thÃ¡ng, danh sÃ¡ch gáº§n nháº¥t.',
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
      'BÃ¡o cÃ¡o gÃ³i táº­p (STEP 8): phá»• biáº¿n nháº¥t, tráº¡ng thÃ¡i membership, sá»‘ Ä‘Äƒng kÃ½ theo thÃ¡ng.',
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
      'BÃ¡o cÃ¡o HLV (STEP 8): sá»‘ há»™i viÃªn Ä‘ang phá»¥ trÃ¡ch, sá»‘ buá»•i táº­p, sá»‘ buá»•i hoÃ n thÃ nh.',
  })
  getTrainers() {
    return this.reportsService.getTrainersReport();
  }

  @Get('attendance')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'BÃ¡o cÃ¡o chuyÃªn cáº§n tá»•ng há»£p (STEP 8): cards + theo ngÃ y / giá» / thá»© trong tuáº§n / hÃ¬nh thá»©c check-in.',
  })
  getAttendance(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getAttendanceReport({ from, to });
  }

  @Get('export/csv')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Xuáº¥t CSV (STEP 8): type=revenue|members|attendance|memberships (+ cÃ¡c filter chung). File cÃ³ BOM cho Excel.',
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
    summary: 'Dá»¯ liá»‡u Dashboard admin: summary + Ä‘Äƒng kÃ½ gáº§n Ä‘Ã¢y + thanh toÃ¡n chá» xÃ¡c nháº­n.',
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
