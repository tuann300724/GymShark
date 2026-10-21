import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PublicRepository } from './repository/public.repository';
import { TypeOrmPublicRepository } from './repository/typeorm-public.repository';
import { PUBLIC_REPOSITORY } from './repository/public.tokens';

@Module({
  controllers: [PublicController],
  providers: [
    PublicService,
    { provide: PUBLIC_REPOSITORY, useClass: TypeOrmPublicRepository },
  ],
  exports: [PublicService],
})
export class PublicModule {}
