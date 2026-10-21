import { Module } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { FoodsController } from './foods.controller';
import { FoodsRepository } from './repository/foods.repository';
import { TypeOrmFoodsRepository } from './repository/typeorm-foods.repository';
import { FOODS_REPOSITORY } from './repository/foods.tokens';

@Module({
  controllers: [FoodsController],
  providers: [
    FoodsService,
    { provide: FOODS_REPOSITORY, useClass: TypeOrmFoodsRepository },
  ],
  exports: [FoodsService],
})
export class FoodsModule {}
