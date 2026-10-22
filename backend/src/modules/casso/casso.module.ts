import { Module } from '@nestjs/common';
import { CassoService } from './casso.service';

@Module({
  providers: [CassoService],
  exports: [CassoService],
})
export class CassoModule {}
