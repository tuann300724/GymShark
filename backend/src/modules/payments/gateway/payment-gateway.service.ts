import { Injectable } from '@nestjs/common';
import { CashGateway } from './cash.gateway';
import { BankTransferGateway } from './bank-transfer.gateway';
import { MomoGateway } from './momo.gateway';
import { VnpayGateway } from './vnpay.gateway';
import { GatewayMethod, PaymentGateway } from './payment-gateway.interface';

/**
 * Registry các cổng thanh toán. PaymentsService dùng service này để lấy gateway
 * theo phương thức thay vì if/else — dễ mở rộng MOMO/VNPAY thật ở Step 7.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly gateways = new Map<GatewayMethod, PaymentGateway>();

  constructor(
    cashGateway: CashGateway,
    bankTransferGateway: BankTransferGateway,
    momoGateway: MomoGateway,
    vnpayGateway: VnpayGateway,
  ) {
    this.register(cashGateway);
    this.register(bankTransferGateway);
    this.register(momoGateway);
    this.register(vnpayGateway);
  }

  private register(gateway: PaymentGateway) {
    this.gateways.set(gateway.method, gateway);
  }

  getGateway(method: GatewayMethod): PaymentGateway {
    const gateway = this.gateways.get(method);
    if (!gateway) {
      throw new Error(`Chưa đăng ký cổng thanh toán cho phương thức ${method}`);
    }
    return gateway;
  }

  /** Danh sách các phương thức + trạng thái tích hợp (cho Swagger / UI) */
  listGateways() {
    return Array.from(this.gateways.values()).map((g) => ({
      method: g.method,
      manualConfirmation: g.manualConfirmation,
      integrated: g.integrated,
    }));
  }
}