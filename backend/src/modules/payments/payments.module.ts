import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PaymentGatewayService } from "./gateway/payment-gateway.service";
import { CashGateway } from "./gateway/cash.gateway";
import { BankTransferGateway } from "./gateway/bank-transfer.gateway";
import { MomoGateway } from "./gateway/momo.gateway";
import { VnpayGateway } from "./gateway/vnpay.gateway";
import { MemberModule } from "../member/member.module";
import { PaymentsRepository } from "./repository/payments.repository";
import { TypeOrmPaymentsRepository } from "./repository/typeorm-payments.repository";
import { PAYMENTS_REPOSITORY } from "./repository/payments.tokens";

@Module({
  imports: [MemberModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentGatewayService,
    CashGateway,
    BankTransferGateway,
    MomoGateway,
    VnpayGateway,
    { provide: PAYMENTS_REPOSITORY, useClass: TypeOrmPaymentsRepository },
  ],
  exports: [PaymentsService, PaymentGatewayService],
})
export class PaymentsModule {}
