import { Module } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { MealPlansController } from './meal-plans.controller';
import { SpoonacularService } from './spoonacular.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [MealPlansController],
  providers: [MealPlansService, SpoonacularService],
  exports: [MealPlansService, SpoonacularService],
})
export class MealPlansModule {}
