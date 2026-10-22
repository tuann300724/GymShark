import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MealPlansService } from './meal-plans.service';
import {
  CreateMealPlanDto,
  DuplicateMealPlanDto,
  MealPlanQueryDto,
  SendMealPlanDto,
  UpdateMealPlanDto,
} from './dto/meal-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SpoonacularService } from './spoonacular.service';

@ApiTags('Meal Plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('meal-plans')
export class MealPlansController {
  constructor(
    private readonly mealPlansService: MealPlansService,
    private readonly spoonacular: SpoonacularService,
  ) {}

  @Get('recipes/search')
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Tìm công thức món ăn theo tên (tiếng Việt hoặc tiếng Anh) — nguồn Spoonacular' })
  searchRecipes(@Query('query') query: string, @Query('number') number?: string) {
    return this.spoonacular.searchRecipes(query || '', Number(number) || 10);
  }

  @Get('recipes/:id')
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN)
  @ApiOperation({ summary: 'Chi tiết công thức (nguyên liệu + cách làm, đã dịch tiếng Việt)' })
  recipeDetail(@Param('id') id: string) {
    return this.spoonacular.recipeDetail(Number(id));
  }

  @Get()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Danh sách thực đơn do HLV đang đăng nhập tạo' })
  listForTrainer(
    @CurrentUser() user: { id: string; role: string },
    @Query() query: MealPlanQueryDto,
  ) {
    return this.mealPlansService.listForTrainer(user.id, query);
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Danh sách thực đơn hội viên đã nhận' })
  listForMember(@CurrentUser() user: { id: string; role: string }, @Query() query: MealPlanQueryDto) {
    return this.mealPlansService.listForMember(user.id, query);
  }

  @Post()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV tạo thực đơn (theo ngày/tuần) hoặc lưu thành thực đơn mẫu' })
  create(@CurrentUser() user: { id: string; role: string }, @Body() dto: CreateMealPlanDto) {
    return this.mealPlansService.create(user, dto);
  }

  @Get(':id')
  @Roles(Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiết thực đơn (kèm bữa ăn và thành phần)' })
  findOne(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Chỉnh sửa thực đơn (thay danh sách bữa nếu gửi kèm `meals`)' })
  update(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Xoá thực đơn' })
  remove(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.remove(user, id);
  }

  @Post(':id/duplicate')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Nhân bản thực đơn (hoặc lưu mẫu thành thực đơn cho hội viên)' })
  duplicate(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: DuplicateMealPlanDto,
  ) {
    return this.mealPlansService.duplicate(user, id, dto);
  }

  @Post(':id/send')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Gửi thực đơn vào cuộc trò chuyện với hội viên (gửi lại = bản cập nhật)' })
  send(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: SendMealPlanDto,
  ) {
    return this.mealPlansService.send(user, id, dto.content);
  }

  @Post(':id/confirm')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Hội viên xác nhận đã xem thực đơn' })
  confirm(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.confirm(user, id);
  }
}
