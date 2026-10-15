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
  @ApiOperation({ summary: 'Danh sách thực phẩm (lọc theo tên/nhóm, phân trang)' })
  findAll(@Query() query: FoodQueryDto) {
    return this.foodsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: 'Chi tiết thực phẩm' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Thêm thực phẩm vào thư viện' })
  create(@Body() dto: CreateFoodDto, @CurrentUser('id') userId: string, @Ip() ip: string) {
    return this.foodsService.create(dto, { userId, ip });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cập nhật thực phẩm' })
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
  @ApiOperation({ summary: 'Ẩn thực phẩm khỏi thư viện (xoá mềm)' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string, @Ip() ip: string) {
    return this.foodsService.remove(id, { userId, ip });
  }
}
