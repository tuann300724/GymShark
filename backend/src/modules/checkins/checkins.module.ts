import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { FacesModule } from '../faces/faces.module';
import { MemberQrModule } from '../../common/services/member-qr.module';
import { TypeOrmCheckinsRepository } from './repository/typeorm-checkins.repository';
import { CHECKINS_REPOSITORY } from './repository/checkins.tokens';

@Module({
  imports: [FacesModule, MemberQrModule],
  controllers: [CheckinsController],
  providers: [
    CheckinsService,
    { provide: CHECKINS_REPOSITORY, useClass: TypeOrmCheckinsRepository },
  ],
  exports: [CheckinsService],
})
export class CheckinsModule {}
