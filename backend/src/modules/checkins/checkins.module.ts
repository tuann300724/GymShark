import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { FacesModule } from '../faces/faces.module';
import { MemberQrModule } from '../../common/services/member-qr.module';

@Module({
  imports: [FacesModule, MemberQrModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
