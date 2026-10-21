import { Module } from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { InvoicesRepository } from "./repository/invoices.repository";
import { TypeOrmInvoicesRepository } from "./repository/typeorm-invoices.repository";
import { INVOICES_REPOSITORY } from "./repository/invoices.tokens";

@Module({
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    { provide: INVOICES_REPOSITORY, useClass: TypeOrmInvoicesRepository },
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
