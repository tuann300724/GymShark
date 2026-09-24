import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Website')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('packages')
  @ApiOperation({ summary: 'Danh sách gói tập hiển thị trên website công khai' })
  @ApiResponse({ status: 200, description: 'Danh sách gói tập ACTIVE' })
  getPackages() {
    return this.publicService.getPackages();
  }

  @Public()
  @Get('trainers')
  @ApiOperation({ summary: 'Danh sách huấn luyện viên công khai' })
  @ApiResponse({ status: 200, description: 'Danh sách HLV đang ACTIVE' })
  getTrainers() {
    return this.publicService.getTrainers();
  }

  @Public()
  @Get('schedule')
  @ApiOperation({ summary: 'Lịch lớp học công khai' })
  @ApiResponse({ status: 200, description: 'Lịch các lớp học chưa được đặt riêng' })
  getClassSchedule() {
    return this.publicService.getClassSchedule();
  }

  @Public()
  @Get('branches')
  @ApiOperation({ summary: 'Danh sách chi nhánh (trang liên hệ)' })
  @ApiResponse({ status: 200, description: 'Danh sách chi nhánh ACTIVE' })
  getBranches() {
    return this.publicService.getBranches();
  }

  @Public()
  @Get('home-stats')
  @ApiOperation({ summary: 'Thống kê nhanh cho trang chủ' })
  @ApiResponse({ status: 200, description: 'Số liệu hội viên, HLV, chi nhánh' })
  getHomeStats() {
    return this.publicService.getHomeStats();
  }
}