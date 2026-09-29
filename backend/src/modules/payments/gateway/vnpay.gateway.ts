import { Injectable } from '@nestjs/common';
import {
  GatewayCreateOrderInput,
  GatewayCreateOrderResult,
  GatewayMethod,
  PaymentGateway,
} from './payment-gateway.interface';

/**
 * Nền tảng cho VNPay — CHƯA tích hợp cổng thật (thiếu credentials).
 * Giữ stub để Step 7 implement VNPayPaymentGateway với IPN callback.
 */
@Injectable()
export class VnpayGateway implements PaymentGateway {
  readonly method: GatewayMethod = 'VNPAY';
  readonly manualConfirmation = false;
  readonly integrated = false;

  createOrder(_input: GatewayCreateOrderInput): GatewayCreateOrderResult {
    return {
      requiresRedirect: false,
      instructions:
        'Cổng thanh toán VNPay chưa được kích hoạt. Vui lòng chọn Tiền mặt hoặc Chuyển khoản.',
    };
  }
}