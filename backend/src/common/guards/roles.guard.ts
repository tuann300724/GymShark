import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Đối tác dùng chung giao diện vận hành (/admin) nhưng KHÔNG được xem dữ liệu hội viên.
 * Vì hầu hết controller chỉ khai báo ADMIN/MANAGER/STAFF, ta mở rộng riêng PARTNER
 * theo một allowlist hẹp ở đây thay vì sửa 28 controller.
 */
const OPERATIONS_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.STAFF];

type PartnerRule = { method: string; pattern: RegExp };

const PARTNER_ALLOWED: PartnerRule[] = [
  // Check-in tại quầy / quét khuôn mặt / check-out — luồng bắt buộc của đối tác
  { method: 'POST', pattern: /^\/checkins\/(staff|face-scan|face-checkout)$/ },
  { method: 'POST', pattern: /^\/checkins\/[^/]+\/checkout$/ },
  // Trang vận hành tại cơ sở: lịch sử + đang có mặt + KPI daily/hourly.
  // CheckinsService/ReportsService tự gói kết quả theo partnerId của đối tác.
  { method: 'GET', pattern: /^\/checkins(\/.*)?$/ },
  { method: 'GET', pattern: /^\/reports\/checkins\/(daily|hourly)$/ },
  // Bán nước uống (kể cả tìm hội viên để lập hóa đơn tại quầy)
  { method: 'GET', pattern: /^\/beverages(\/.*)?$/ },
  { method: 'POST', pattern: /^\/beverages(\/.*)?$/ },
  { method: 'PATCH', pattern: /^\/beverages(\/.*)?$/ },
  { method: 'DELETE', pattern: /^\/beverages(\/.*)?$/ },
  // Thông tin chuyển khoản cho POS nước uống
  { method: 'GET', pattern: /^\/payments\/bank-info$/ },
  // Tổng hợp hoa hồng của chính đối tác (không chứa dữ liệu hội viên)
  { method: 'GET', pattern: /^\/partners\/me\/commission$/ },
];

function partnerCanAccess(method: string, path: string): boolean {
  return PARTNER_ALLOWED.some((rule) => rule.method === method && rule.pattern.test(path));
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user || !user.role) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    if (user.role === Role.PARTNER && requiredRoles.some((r) => OPERATIONS_ROLES.includes(r))) {
      const rawPath: string = request.url ?? '';
      const path = rawPath.split('?')[0].replace(/^\/api/, '') || '/';
      const method: string = (request.method ?? 'GET').toUpperCase();
      if (!partnerCanAccess(method, path)) {
        throw new ForbiddenException('Đối tác không được truy cập dữ liệu hội viên hoặc quản trị hệ thống');
      }
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Yêu cầu vai trò: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
