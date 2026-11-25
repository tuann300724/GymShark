import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../../common/decorators/public.decorator';
import { TrainerReviewQueryDto } from '../trainer-reviews/dto/trainer-review.dto';

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
  @Get('trainers/:id')
  @ApiOperation({ summary: 'Hồ sơ công khai của 1 huấn luyện viên' })
  @ApiResponse({ status: 200, description: 'Thông tin HLV đã lọc, kèm số liệu công khai' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy HLV đang ACTIVE' })
  getTrainer(@Param('id') id: string) {
    return this.publicService.getTrainer(id);
  }

  @Public()
  @Get('trainers/:id/reviews')
  @ApiOperation({ summary: 'Đánh giá công khai của 1 huấn luyện viên' })
  @ApiResponse({ status: 200, description: 'Danh sách đánh giá + điểm trung bình' })
  getTrainerReviews(
    @Param('id') id: string,
    @Query() query: TrainerReviewQueryDto,
  ) {
    return this.publicService.getTrainerReviews(id, query);
  }

  @Public()
  @Get('schedule')
  @ApiOperation({ summary: 'Lịch lớp học công khai' })
  @ApiResponse({ status: 200, description: 'Lịch các lớp học chưa được đặt riêng' })
  getClassSchedule() {
    return this.publicService.getClassSchedule();
  }

  @Public()
  @Get('home-stats')
  @ApiOperation({ summary: 'Thống kê nhanh cho trang chủ' })
  @ApiResponse({ status: 200, description: 'Số liệu hội viên, HLV' })
  getHomeStats() {
    return this.publicService.getHomeStats();
  }
}