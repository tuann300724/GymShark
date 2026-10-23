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
      'Danh sÃ¡ch mÃ£ khuyáº¿n mÃ£i (tÃ¬m kiáº¿m theo code/name, lá»c status/type/ngÃ y) + thá»‘ng kÃª Active / Sáº¯p háº¿t háº¡n / Háº¿t háº¡n / Tá»•ng lÆ°á»£t dÃ¹ng',
  })
  findAll(@Query() query: PromotionQueryDto) {
    return this.promotionsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Thá»‘ng kÃª nhanh mÃ£ khuyáº¿n mÃ£i cho Dashboard admin' })
  getStats() {
    return this.promotionsService.getStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: 'Chi tiáº¿t mÃ£ khuyáº¿n mÃ£i (usage, remaining, unique members)' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Get(':id/usages')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: 'Lá»‹ch sá»­ dÃ¹ng mÃ£: Member + Payment + Discount amount + thá»i Ä‘iá»ƒm',
  })
  getUsages(@Param('id') id: string, @Query() query: PromotionUsagesQueryDto) {
    return this.promotionsService.getUsages(id, query);
  }

  @Post('validate')
  @Roles(Role.MEMBER, Role.STAFF, Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary:
      'Member kiá»ƒm tra mÃ£ khuyáº¿n mÃ£i trÆ°á»›c khi Ä‘Äƒng kÃ½: tÃ­nh subtotal/discount/total. Backend tá»± kiá»ƒm tra má»i rÃ ng buá»™c.',
  })
  validate(@Body() dto: ValidatePromotionDto, @CurrentUser('id') userId?: string, @CurrentUser('role') role?: string) {
    return this.promotionsService.validateCode(dto, userId, role);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Táº¡o mÃ£ khuyáº¿n mÃ£i má»›i' })
  create(@Body() dto: CreatePromotionDto, @CurrentUser('id') actorId: string) {
    return this.promotionsService.create(dto, actorId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cáº­p nháº­t mÃ£ khuyáº¿n mÃ£i (khÃ´ng sá»­a code náº¿u Ä‘Ã£ Ä‘Æ°á»£c dÃ¹ng)' })
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto, @CurrentUser('id') actorId: string) {
    return this.promotionsService.update(id, dto, actorId);
  }

  @Post(':id/activate')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'KÃ­ch hoáº¡t mÃ£ khuyáº¿n mÃ£i (cháº·n náº¿u Ä‘Ã£ háº¿t háº¡n)' })
  activate(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.promotionsService.activate(id, actorId);
  }

  @Post(':id/deactivate')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Ngá»«ng kÃ­ch hoáº¡t mÃ£ khuyáº¿n mÃ£i' })
  deactivate(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.promotionsService.deactivate(id, actorId);
  }
}
