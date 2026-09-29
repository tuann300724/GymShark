import { Injectable } from '@nestjs/common';
import {
  GatewayCreateOrderInput,
  GatewayCreateOrderResult,
  GatewayMethod,
  PaymentGateway,
} from './payment-gateway.interface';

/** Thanh toán tiền mặt tại quầy — lễ tân thu tiền rồi xác nhận PAID thủ công. */
@Injectable()
export class CashGateway implements PaymentGateway {
  readonly method: GatewayMethod = 'CASH';
  readonly manualConfirmation = true;
  readonly integrated = true;

  createOrder(_input: GatewayCreateOrderInput): GatewayCreateOrderResult {
    return {
      requiresRedirect: false,
      instructions: 'Thanh toán tiền mặt tại quầy lễ tân. Nhân viên sẽ xác nhận sau khi thu tiền.',
    };
  }
}