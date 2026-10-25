import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayService } from './gateway/payment-gateway.service';
import { CashGateway } from './gateway/cash.gateway';
import { BankTransferGateway } from './gateway/bank-transfer.gateway';
import { MomoGateway } from './gateway/momo.gateway';
import { MemberModule } from '../member/member.module';
import { CassoModule } from '../casso/casso.module';

@Module({
  imports: [MemberModule, CassoModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentGatewayService,
    CashGateway,
    BankTransferGateway,
    MomoGateway,
  ],
  exports: [PaymentsService, PaymentGatewayService],
})
export class PaymentsModule {}