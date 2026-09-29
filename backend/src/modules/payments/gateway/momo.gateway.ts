import { Injectable } from '@nestjs/common';
import {
  GatewayCreateOrderInput,
  GatewayCreateOrderResult,
  GatewayMethod,
  PaymentGateway,
} from './payment-gateway.interface';

/**
 * Nền tảng cho ví MoMo — CHƯA tích hợp cổng thật (thiếu credentials).
 * Giữ stub để Step 7 implement MomoPaymentGateway với API momo/v2/create.
 */
@Injectable()
export class MomoGateway implements PaymentGateway {
  readonly method: GatewayMethod = 'MOMO';
  readonly manualConfirmation = false;
  readonly integrated = false;

  createOrder(_input: GatewayCreateOrderInput): GatewayCreateOrderResult {
    return {
      requiresRedirect: false,
      instructions:
        'Cổng thanh toán MoMo chưa được kích hoạt. Vui lòng chọn Tiền mặt hoặc Chuyển khoản.',
    };
  }
}