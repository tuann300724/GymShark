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

  // --- Phòng gym tự quản lý (đợt 1) ---
  // Các service tự gói dữ liệu theo ownerPartnerId (common/utils/partner-scope.ts):
  // đối tác chỉ thấy/sửa hội viên, gói tập, thẻ, giao dịch, hoá đơn của phòng mình.
  { method: 'GET', pattern: /^\/members(\/[^/]+)?$/ },
  { method: 'GET', pattern: /^\/members\/[^/]+\/trainers$/ },
  { method: 'POST', pattern: /^\/members$/ },
  { method: 'PATCH', pattern: /^\/members\/[^/]+$/ },
  { method: 'POST', pattern: /^\/members\/[^/]+\/(memberships|change-package)$/ },
  { method: 'GET', pattern: /^\/membership-packages(\/[^/]+)?$/ },
  { method: 'POST', pattern: /^\/membership-packages$/ },
  { method: 'PATCH', pattern: /^\/membership-packages\/[^/]+$/ },
  { method: 'DELETE', pattern: /^\/membership-packages\/[^/]+$/ },
  { method: 'GET', pattern: /^\/memberships(\/[^/]+)?$/ },
  { method: 'PATCH', pattern: /^\/memberships\/[^/]+\/(status|extend)$/ },
  { method: 'GET', pattern: /^\/payments(\/[^/]+)?$/ },
  { method: 'POST', pattern: /^\/payments\/[^/]+\/(confirm|reject)$/ },
  { method: 'PATCH', pattern: /^\/payments\/[^/]+\/(approve|cancel)$/ },
  { method: 'GET', pattern: /^\/invoices(\/[^/]+)?$/ },
  { method: 'GET', pattern: /^\/reports\/revenue$/ },

  // --- Phòng gym tự quản lý (đợt 2): PT, phòng tập, lịch tập & lớp, nhân viên ---
  { method: 'GET', pattern: /^\/trainers(\/[^/]+)?$/ },
  { method: 'GET', pattern: /^\/trainers\/[^/]+\/members$/ },
  { method: 'POST', pattern: /^\/trainers$/ },
  { method: 'PATCH', pattern: /^\/trainers\/[^/]+$/ },
  { method: 'DELETE', pattern: /^\/trainers\/[^/]+$/ },
  { method: 'POST', pattern: /^\/trainers\/[^/]+\/members\/[^/]+$/ },
  { method: 'DELETE', pattern: /^\/trainers\/[^/]+\/members\/[^/]+$/ },
  { method: 'GET', pattern: /^\/rooms(\/[^/]+)?$/ },
  { method: 'POST', pattern: /^\/rooms$/ },
  { method: 'PATCH', pattern: /^\/rooms\/[^/]+(\/status)?$/ },
  { method: 'DELETE', pattern: /^\/rooms\/[^/]+$/ },
  { method: 'GET', pattern: /^\/schedules(\/[^/]+)?$/ },
  { method: 'GET', pattern: /^\/training-sessions(\/[^/]+)?(\/progress)?$/ },
  { method: 'POST', pattern: /^\/training-sessions$/ },
  { method: 'PATCH', pattern: /^\/training-sessions\/[^/]+$/ },
  { method: 'POST', pattern: /^\/training-sessions\/[^/]+\/(cancel|complete|progress)$/ },
  { method: 'GET', pattern: /^\/class-bookings\/session\/[^/]+$/ },
  { method: 'POST', pattern: /^\/class-bookings\/session\/[^/]+\/members$/ },
  { method: 'DELETE', pattern: /^\/class-bookings\/session\/[^/]+\/members\/[^/]+$/ },
  // Chuông thông báo cá nhân (service tự giới hạn theo userId của chính tài khoản)
  { method: 'GET', pattern: /^\/notifications\/me(\/unread)?$/ },
  { method: 'PATCH', pattern: /^\/notifications\/(read-all|[^/]+\/read)$/ },
  { method: 'DELETE', pattern: /^\/notifications\/[^/]+$/ },
  // Đăng ký khuôn mặt cho hội viên riêng của phòng (FacesService tự kiểm tra phạm vi)
  { method: 'GET', pattern: /^\/faces\/member\/[^/]+$/ },
  { method: 'POST', pattern: /^\/faces\/member\/[^/]+\/enroll$/ },
  { method: 'POST', pattern: /^\/faces\/check-glasses$/ },
  { method: 'DELETE', pattern: /^\/faces\/member\/[^/]+$/ },
  // Nhân viên của phòng (chỉ chủ đối tác — kiểm tra thêm ở UsersController)
  { method: 'GET', pattern: /^\/users\/staff$/ },
  { method: 'POST', pattern: /^\/users\/staff$/ },
  { method: 'PATCH', pattern: /^\/users\/staff\/[^/]+\/status$/ },
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
