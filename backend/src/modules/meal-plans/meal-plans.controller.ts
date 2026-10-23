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
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN, Role.STAFF, Role.MANAGER)
  @ApiOperation({ summary: 'TÃ¬m cÃ´ng thá»©c mÃ³n Äƒn theo tÃªn (tiáº¿ng Viá»‡t hoáº·c tiáº¿ng Anh) â€” nguá»“n Spoonacular' })
  searchRecipes(@Query('query') query: string, @Query('number') number?: string) {
    return this.spoonacular.searchRecipes(query || '', Number(number) || 10);
  }

  @Get('recipes/:id')
  @Roles(Role.TRAINER, Role.MEMBER, Role.ADMIN, Role.STAFF, Role.MANAGER)
  @ApiOperation({ summary: 'Chi tiáº¿t cÃ´ng thá»©c (nguyÃªn liá»‡u + cÃ¡ch lÃ m, Ä‘Ã£ dá»‹ch tiáº¿ng Viá»‡t)' })
  recipeDetail(@Param('id') id: string) {
    return this.spoonacular.recipeDetail(Number(id));
  }

  @Get()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Danh sÃ¡ch thá»±c Ä‘Æ¡n do HLV Ä‘ang Ä‘Äƒng nháº­p táº¡o' })
  listForTrainer(
    @CurrentUser() user: { id: string; role: string },
    @Query() query: MealPlanQueryDto,
  ) {
    return this.mealPlansService.listForTrainer(user.id, query);
  }

  @Get('me')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Danh sÃ¡ch thá»±c Ä‘Æ¡n há»™i viÃªn Ä‘Ã£ nháº­n' })
  listForMember(@CurrentUser() user: { id: string; role: string }, @Query() query: MealPlanQueryDto) {
    return this.mealPlansService.listForMember(user.id, query);
  }

  @Post()
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'HLV táº¡o thá»±c Ä‘Æ¡n (theo ngÃ y/tuáº§n) hoáº·c lÆ°u thÃ nh thá»±c Ä‘Æ¡n máº«u' })
  create(@CurrentUser() user: { id: string; role: string }, @Body() dto: CreateMealPlanDto) {
    return this.mealPlansService.create(user, dto);
  }

  @Get(':id')
  @Roles(Role.TRAINER, Role.MEMBER)
  @ApiOperation({ summary: 'Chi tiáº¿t thá»±c Ä‘Æ¡n (kÃ¨m bá»¯a Äƒn vÃ  thÃ nh pháº§n)' })
  findOne(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Chá»‰nh sá»­a thá»±c Ä‘Æ¡n (thay danh sÃ¡ch bá»¯a náº¿u gá»­i kÃ¨m `meals`)' })
  update(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.mealPlansService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'XoÃ¡ thá»±c Ä‘Æ¡n' })
  remove(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.remove(user, id);
  }

  @Post(':id/duplicate')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'NhÃ¢n báº£n thá»±c Ä‘Æ¡n (hoáº·c lÆ°u máº«u thÃ nh thá»±c Ä‘Æ¡n cho há»™i viÃªn)' })
  duplicate(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: DuplicateMealPlanDto,
  ) {
    return this.mealPlansService.duplicate(user, id, dto);
  }

  @Post(':id/send')
  @Roles(Role.TRAINER)
  @ApiOperation({ summary: 'Gá»­i thá»±c Ä‘Æ¡n vÃ o cuá»™c trÃ² chuyá»‡n vá»›i há»™i viÃªn (gá»­i láº¡i = báº£n cáº­p nháº­t)' })
  send(
    @CurrentUser() user: { id: string; role: string },
    @Param('id') id: string,
    @Body() dto: SendMealPlanDto,
  ) {
    return this.mealPlansService.send(user, id, dto.content);
  }

  @Post(':id/confirm')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Há»™i viÃªn xÃ¡c nháº­n Ä‘Ã£ xem thá»±c Ä‘Æ¡n' })
  confirm(@CurrentUser() user: { id: string; role: string }, @Param('id') id: string) {
    return this.mealPlansService.confirm(user, id);
  }
}
