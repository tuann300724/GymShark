import { Module } from '@nestjs/common';
import { FacesController } from './faces.controller';
import { FacesService } from './faces.service';

/**
 * Module sinh trắc học: đăng ký / rút lui / so khớp khuôn mặt.
 * AuditService lấy từ AuditLogsModule (@Global) nên không cần import ở đây.
 * CheckinsModule import module này để dùng FacesService khi quét check-in.
 */
@Module({
  controllers: [FacesController],
  providers: [FacesService],
  exports: [FacesService],
})
export class FacesModule {}
