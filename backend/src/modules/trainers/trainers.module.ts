import { Module } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { TrainersController } from './trainers.controller';
import { TrainersRepository } from './repository/trainers.repository';
import { TypeOrmTrainersRepository } from './repository/typeorm-trainers.repository';
import { TRAINERS_REPOSITORY } from './repository/trainers.tokens';

@Module({
  controllers: [TrainersController],
  providers: [
    TrainersService,
    { provide: TRAINERS_REPOSITORY, useClass: TypeOrmTrainersRepository },
  ],
  exports: [TrainersService],
})
export class TrainersModule {}
