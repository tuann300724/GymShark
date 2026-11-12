import { Module } from "@nestjs/common";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CassoModule } from "../casso/casso.module";
import { BeveragesController } from "./beverages.controller";
import { BeveragesService } from "./beverages.service";

@Module({
  imports: [AuditLogsModule, CassoModule],
  controllers: [BeveragesController],
  providers: [BeveragesService],
  exports: [BeveragesService],
})
export class BeveragesModule {}
