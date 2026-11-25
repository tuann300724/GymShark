import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrainerReviewsService } from './trainer-reviews.service';
import {
  CreateTrainerReviewDto,
  TrainerReviewQueryDto,
  UpdateTrainerReviewDto,
} from './dto/trainer-review.dto';

@ApiTags('Trainer Reviews')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MEMBER)
@Controller('trainer-reviews')
export class TrainerReviewsController {
  constructor(private readonly service: TrainerReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Hội viên đánh giá HLV (cần đã hoàn thành buổi tập)' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTrainerReviewDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get('me/:trainerId')
  @ApiOperation({ summary: 'Đánh giá của tôi về HLV + quyền đánh giá' })
  mine(@CurrentUser('id') userId: string, @Param('trainerId') trainerId: string) {
    return this.service.mine(userId, trainerId);
  }

  @Get('eligibility/:trainerId')
  @ApiOperation({ summary: 'Kiểm tra hội viên có đủ điều kiện đánh giá HLV không' })
  eligibility(
    @CurrentUser('id') userId: string,
    @Param('trainerId') trainerId: string,
  ) {
    return this.service.eligibility(userId, trainerId);
  }

  @Get(':trainerId')
  @ApiOperation({ summary: 'Danh sách đánh giá công khai của một HLV' })
  list(@Param('trainerId') trainerId: string, @Query() query: TrainerReviewQueryDto) {
    return this.service.listPublic(trainerId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Hội viên sửa đánh giá của chính mình' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTrainerReviewDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hội viên xoá đánh giá của chính mình' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
