import { Module } from '@nestjs/common';
import { FacesController } from './faces.controller';
import { FacesService } from './faces.service';
import { AzureFaceService } from './azure-face.service';

/**
 * Module sinh trắc học: đăng ký / rút lui / so khớp khuôn mặt.
 * AuditService lấy từ AuditLogsModule (@Global) nên không cần import ở đây.
 * CheckinsModule import module này để dùng FacesService khi quét check-in.
 *
 * AzureFaceService chỉ phục vụ bước kiểm tra kính lúc ĐĂNG KÝ (xem file service).
 */
@Module({
  controllers: [FacesController],
  providers: [FacesService, AzureFaceService],
  exports: [FacesService, AzureFaceService],
})
export class FacesModule {}
