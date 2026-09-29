import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePromotionDto,
  PromotionQueryDto,
  PromotionUsagesQueryDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from './dto/promotion.dto';

@ApiTags('Promotions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary:
      'Danh sách mã khuyến mãi (tìm kiếm theo code/name, lọc status/type/ngày) + thống kê Active / Sắp hết hạn / Hết hạn / Tổng lượt dùng',
  })
  findAll(@Query() query: PromotionQueryDto) {
    return this.promotionsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Thống kê nhanh mã khuyến mãi cho Dashboard admin' })
  getStats() {
    return this.promotionsService.getStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiết mã khuyến mãi (usage, remaining, unique members)' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Get(':id/usages')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Lịch sử dùng mã: Member + Payment + Discount amount + thời điểm',
  })
  getUsages(@Param('id') id: string, @Query() query: PromotionUsagesQueryDto) {
    return this.promotionsService.getUsages(id, query);
  }

  @Post('validate')
  @Roles(Role.MEMBER, Role.STAFF, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Member kiểm tra mã khuyến mãi trước khi đăng ký: tính subtotal/discount/total. Backend tự kiểm tra mọi ràng buộc.',
  })
  validate(@Body() dto: ValidatePromotionDto, @CurrentUser('id') userId?: string, @CurrentUser('role') role?: string) {
    return this.promotionsService.validateCode(dto, userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Tạo mã khuyến mãi mới' })
  create(@Body() dto: CreatePromotionDto, @CurrentUser('id') actorId: string) {
    return this.promotionsService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật mã khuyến mãi (không sửa code nếu đã được dùng)' })
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto, @CurrentUser('id') actorId: string) {
    return this.promotionsService.update(id, dto, actorId);
  }

  @Post(':id/activate')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Kích hoạt mã khuyến mãi (chặn nếu đã hết hạn)' })
  activate(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.promotionsService.activate(id, actorId);
  }

  @Post(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Ngừng kích hoạt mã khuyến mãi' })
  deactivate(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.promotionsService.deactivate(id, actorId);
  }
}