import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FoodsService } from './foods.service';
import { FoodQueryDto, CreateFoodDto, UpdateFoodDto } from './dto/food.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Foods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch thá»±c pháº©m (lá»c theo tÃªn/nhÃ³m, phÃ¢n trang)' })
  findAll(@Query() query: FoodQueryDto) {
    return this.foodsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiáº¿t thá»±c pháº©m' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'ThÃªm thá»±c pháº©m vÃ o thÆ° viá»‡n' })
  create(@Body() dto: CreateFoodDto, @CurrentUser('id') userId: string, @Ip() ip: string) {
    return this.foodsService.create(dto, { userId, ip });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cáº­p nháº­t thá»±c pháº©m' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFoodDto,
    @CurrentUser('id') userId: string,
    @Ip() ip: string,
  ) {
    return this.foodsService.update(id, dto, { userId, ip });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'áº¨n thá»±c pháº©m khá»i thÆ° viá»‡n (xoÃ¡ má»m)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string, @Ip() ip: string) {
    return this.foodsService.remove(id, { userId, ip });
  }
}
