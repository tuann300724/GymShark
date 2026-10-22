# Công nghệ

* ngôn ngữ lập trình: NestJS 10.3 + TypeScript 5.4 (backend REST API, Swagger /api/docs)
* Database: Microsoft SQL Server 2019 (Type ORM)

  * Thao tác  dữ liệu thực hiện qua thủ tục (Store procedure)
  * Sử dụng Try catch trong thủ tục
  * Sử  dụng transaction  trong các tác vụ nhiều tạc vụ
* Css: Tailwind CSS v3 (design system 1 palette: nền tối #0B0D0F / sáng #F2F4F0, accent neon #B7FF00; token màu là CSS variables, không dùng class `dark:` thủ công) — font Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung), icon `lucide-react`
* Frontend: Next.js 14 (App Router) + TypeScript + React 18 + TanStack Query v5 + Socket.IO client + Axios (interceptor tự gắn JWT)
* Realtime: Socket.IO 4 (`@nestjs/platform-socket.io`) cho chat HLV ↔ hội viên + thông báo
* Xác thực: JWT (Passport) + RBAC theo `UserRole` (ADMIN / MANAGER / STAFF / TRAINER / MEMBER), `bcryptjs` mã hoá mật khẩu
* Bảo mật: `helmet`, `@nestjs/throttler` (global 300 req/60s; login 10/60s; register 5/300s), CORS allowlist, `ValidationPipe` (whitelist + forbidNonWhitelisted), `AllExceptionsFilter` chuẩn hoá lỗi
* Nhận diện khuôn mặt: `@vladmandic/human` 3.3.6 (chạy 100% client-side, trích vector 1024 chiều, cosine similarity, anti-spoof)
* Thư viện UI: shadcn-style component tự viết (`components/ui`) — button, card, input, tabs, dialog, badge, skeleton, empty-state…
* Email: `nodemailer` (xác minh tài khoản, đặt lại mật khẩu)
* Tài liệu API: Swagger / OpenAPI (`@nestjs/swagger`)

# Architechture

* Clean Architechture
* Mô hình thực tế: **Module-based Monolith** (NestJS) — `AppModule` import 26 feature module: auth, users, members, member, trainers, branches, packages, memberships, checkins, faces, payments, invoices, schedules, promotions, equipment, notifications, reports, public, audit-logs, mail, foods, meal-plans, chat, health
* Tầng `common/` dùng chung: `guards/` (JwtAuthGuard, RolesGuard), `decorators/` (@Roles, @Public, @CurrentUser), `filters/` (AllExceptionsFilter), `services/` (MemberQrService), `enums/`
* Mỗi module theo cấu trúc: `controller` (HTTP + WebSocket gateway) → `service` (nghiệp vụ, gọi Prisma) → `dto` (class-validator) → `entity`; service gọi nhau qua `imports` của module
* Lớp truy cập dữ liệu: `PrismaModule` / `PrismaService` (kế thừa `PrismaClient`, `onModuleInit` kết nối) — service không tự query DB trực tiếp ngoài PrismaService
* Audit: `AuditLogsModule` là `@Global()` — `log()` không bao giờ throw, ghi 34 action / 12 entity
* Frontend: Next.js App Router chia theo route group — `(public)`, `(auth)`, `(member)`, `(trainer)`, `(admin)` — mỗi group có layout riêng + middleware phân quyền theo role
* Luồng dữ liệu: Client (Next.js) → Axios (JWT interceptor) → REST `/api/\*` → Controller → Service → Prisma → PostgreSQL; realtime qua WebSocket (Socket.IO) broadcast từ Gateway về client
* Triển khai: Backend `http://localhost:3001/api` (prefix toàn cục `/api`), Frontend `http://localhost:3000`, baseURL = `NEXT\_PUBLIC\_API\_URL`

