# GymMaster Pro — Hệ thống Quản lý & Vận hành Phòng tập Gym (Full-Stack)

> Đồ án tốt nghiệp — Website + REST API quản lý chuỗi phòng tập gym: hội viên, thẻ tập,
> thanh toán & hóa đơn, check-in thời gian thực, huấn luyện viên, lịch tập, thiết bị,
> khuyến mãi, báo cáo, thông báo và **nhật ký hệ thống (audit log)**.
>
> Toàn bộ giao diện & thông báo API viết bằng **tiếng Việt**.

| | |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 — http://localhost:3000 |
| **Backend** | NestJS 10 · Prisma 5 · PostgreSQL 16 — http://localhost:3001/api |
| **Tài liệu API** | Swagger UI — http://localhost:3001/api/docs |
| **Kiểm tra sức khoẻ** | `GET /api/health` → `{"status":"ok","database":"connected"}` |

---

## 📑 Mục lục

1. [Tính năng](#-tính-năng)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Khởi chạy nhanh (Quickstart)](#-khởi-chạy-nhanh)
4. [Tài khoản demo](#-tài-khoản-demo)
5. [Phân quyền (RBAC)](#-phân-quyền-rbac)
6. [Cấu trúc dự án](#-cấu-trúc-dự-án)
7. [Mô hình dữ liệu](#-mô-hình-dữ-liệu)
8. [Bảo mật](#-bảo-mật)
9. [Hệ thống thiết kế giao diện](#-hệ-thống-thiết-kế-giao-diện)
10. [Lệnh phát triển & kiểm thử](#-lệnh-phát-triển--kiểm-thử)
11. [Kết quả kiểm thử](#-kết-quả-kiểm-thử)
12. [Triển khai (deploy)](#-triển-khai-deploy)
13. [Hạn chế & hướng phát triển](#-hạn-chế--hướng-phát-triển)
14. [Cấu trúc commit / tài liệu nội bộ](#-cấu-trúc-commit--tài-liệu-nội-bộ)

---

## ✨ Tính năng

### Cổng công khai (không cần đăng nhập)
- Trang chủ (hero, chương trình tập, lịch tuần, tiến trình, bài viết nổi bật, CTA)
- Giới thiệu · Gói tập · Huấn luyện viên · Lịch tập · Blog · Liên hệ
- Đăng ký hội viên mới (`/register`) — **2 bước**: điền thông tin → nhận mã xác minh 6 số
  qua email (SMTP) → nhập mã mới tạo tài khoản · Đăng nhập (`/login`)
- Trang `404` và `error` riêng, không để lộ thông tin kỹ thuật

### Khu vực hội viên `/member` — vai trò `MEMBER`
- Dashboard cá nhân: gói tập hiện tại, số buổi tập tháng này, PT phụ trách, thanh toán gần nhất
- **Đăng ký / gia hạn gói tập** online (áp dụng mã khuyến mãi, chọn CASH / BANK_TRANSFER / MoMo / VNPay)
- **Check-in / Check-out** tự phục vụ (QR) hoặc lễ tân hỗ trợ
- Lịch sử check-in, lịch tập cá nhân, huấn luyện viên phụ trách
- Hóa đơn: danh sách + chi tiết + **in biên lao**
- Hồ sơ cá nhân, chuỗi thông báo, cập nhật mật khẩu

### Khu vực quản trị `/admin` — vai trò `ADMIN` / `MANAGER` / `STAFF`
| Nhóm | Màn hình |
| :--- | :--- |
| Tổng quan | Dashboard KPI, biểu đồ lượt tập theo giờ |
| Hội viên & vận hành | Lượt check-in (quét thẻ), hội viên (+ chi tiết/tab lịch sử), thẻ hội viên, gói tập, HLV, lịch tập & lớp học |
| Tài chính | Hóa đơn & thu phí (+ xác nhận / từ chối / hoàn tiền), báo cáo doanh thu, khuyến mãi & voucher |
| Cơ sở & thiết bị | Thiết bị máy móc (+ lịch sử bảo trì), chi nhánh, phòng tập |
| Hệ thống | Báo cáo thống kê (8 tab), thông báo, **nhật ký hệ thống**, cài đặt & phân quyền |

### Khu vực huấn luyện viên `/trainer` — vai trò `TRAINER`
- Dashboard: lịch dạy hôm nay, số học viên, tổng buổi đã hoàn thành
- Lịch dạy, danh sách học viên phụ trách, ghi nhận tiến trình tập, hồ sơ cá nhân

### Nhật ký hệ thống (Audit Log) — *tính năng STEP 9*
- Ghi lại **40 loại hành động** trên 12 entity: đăng nhập, đổi mật khẩu, tạo/cập nhật hội viên,
  đăng ký hội viên kèm mã xác minh email (gửi / gửi lại / sai mã), đổi trạng thái & gia hạn thẻ,
  xác nhận/từ chối/hoàn tiền, check-in/out, sinh trắc học khuôn mặt, thao tác HLV,
  tạo/sửa/hủy/hoàn thành lịch tập, thiết bị & bảo trì, khuyến mãi
- **Không bao giờ** ghi mật khẩu, `passwordHash` hay token
- Trang `/admin/audit-logs`: lọc theo người dùng / hành động / entity / từ ngày / đến ngày /
  tìm kiếm nội dung, phân trang, xem metadata dạng JSON — chỉ `ADMIN` & `MANAGER`

---

## 🛠 Công nghệ sử dụng

### Frontend — `frontend/`
| Nhóm | Công nghệ |
| :--- | :--- |
| Framework | Next.js 14 (App Router) · React 18 · TypeScript |
| Styling | Tailwind CSS 3 (thiết kế riêng, xem [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)) |
| Font | `Barlow Condensed` (tiêu đề) + `Be Vietnam Pro` (nội dung) — `next/font/google` |
| Icon | `lucide-react` |
| Data fetching | `@tanstack/react-query` v5 (`staleTime` 2 phút, `retry: 1`) |
| HTTP | `axios` + interceptor tự gắn JWT & điều hướng 401 |
| Form | `react-hook-form` + `zod` |
| Tiện ích | `clsx` + `tailwind-merge` (`cn()`) |
| Kiểm tra | ESLint (`next/core-web-vitals` + `tailwindcss` + `jsx-a11y`) · Prettier · `tsc --noEmit` · Knip |

> **Không** dùng thư viện biểu đồ ngoài — biểu đồ được vẽ tay bằng SVG trong
> `src/components/charts/`.

### Backend — `backend/`
| Nhóm | Công nghệ |
| :--- | :--- |
| Framework | NestJS 10 · TypeScript |
| ORM / DB | Prisma 5 + PostgreSQL 16 |
| Xác thực | Passport + JWT (`@nestjs/jwt`), `bcryptjs` (10 vòng) |
| Validation | `class-validator` + `class-transformer` (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Bảo mật HTTP | `helmet` + `@nestjs/throttler` (rate limit) + CORS allowlist |
| Tài liệu | `@nestjs/swagger` (OpenAPI 3) |

---

## 🚀 Khởi chạy nhanh

### Yêu cầu
- **Node.js ≥ 20** (khuyến nghị 22/24) và **npm ≥ 10**
- **PostgreSQL ≥ 14** — hoặc dùng Docker

### Bước 1 — Khởi động cơ sở dữ liệu

**Cách A — Docker (đơn giản nhất):**
```bash
docker compose up -d
```
Sẽ tạo PostgreSQL 16 tại `localhost:5432`, database `gym_db`, user `postgres`, mật khẩu `postgrespassword`.

**Cách B — PostgreSQL cài sẵn trên máy:**
```sql
CREATE DATABASE gym_db;
```
rồi đảm bảo user/password trong `backend/.env` khớp với PostgreSQL của bạn.

### Bước 2 — Chạy Backend (cổng 3001)
```bash
cd backend
npm install

# Tạo file .env từ mẫu
cp .env.example .env         # Windows PowerShell:  copy .env.example .env
# Sửa DATABASE_URL + JWT_SECRET trong .env

# Đồng bộ schema vào database và sinh Prisma Client
npx prisma generate
npx prisma db push

# Nạp dữ liệu demo (idempotent — chạy lại nhiều lần vẫn an toàn)
npm run prisma:seed

# Chạy development server
npm run start:dev
```

Kiểm tra:
- API: <http://localhost:3001/api>
- Swagger: <http://localhost:3001/api/docs>
- Health: <http://localhost:3001/api/health> → `database: "connected"`

> ⚠️ **Dự án KHÔNG dùng thư mục `prisma/migrations`.** Luôn đồng bộ schema bằng
> `npx prisma db push` (dev) hoặc `npx prisma migrate deploy` với migration do bạn tự sinh (prod).

### Bước 3 — Chạy Frontend (cổng 3000)
```bash
cd frontend
npm install
cp .env.example .env.local     # Windows PowerShell:  copy .env.example .env.local
npm run dev
```

Mở trình duyệt: **<http://localhost:3000>**

---

## 🔐 Tài khoản demo

Mật khẩu được đặt trong `backend/prisma/seed.ts`. Trang `/login` có nút bấm nhanh để điền.

| Vai trò | Email | Mật khẩu | Khu vực |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@gym.com` | `Admin@123456` | `/admin` — toàn quyền, kể cả phân quyền & cài đặt |
| **MANAGER** | `manager@gym.com` | `Manager@123456` | `/admin` — vận hành + xem nhật ký hệ thống |
| **STAFF** | `staff@gym.com` | `Staff@123456` | `/admin` — lễ tân: check-in, hội viên, thu phí (không xem nhật ký) |
| **TRAINER** | `trainer@gym.com` | `Trainer@123456` | `/trainer` — lịch dạy, học viên, tiến trình |
| **MEMBER** | `member@gym.com` | `Member@123456` | `/member` — hội viên chính (`MEM-0001`, thẻ `MEM-0001`) |
| MEMBER | `member2@gym.com` … `member11@gym.com` | `Member@123456` | Hội viên demo `MEM-0002` … `MEM-0011` |

**Dữ liệu demo có sẵn** (sau `npm run prisma:seed`):
3 chi nhánh · 5 phòng tập · 3 gói tập · 3 huấn luyện viên · 17 tài khoản · **11 hội viên** ·
11 thẻ tập đa trạng thái (`ACTIVE` / `EXPIRED` / `PENDING` / `CANCELLED`) ·
11 hóa đơn (mỗi thẻ đúng 1 đơn, tổng hoá đơn khớp số tiền thanh toán) + 1 giao dịch `FAILED` ·
**68 lượt check-in** lịch sử · 14 buổi tập (PT & lớp nhóm) & tiến trình tập ·
5 thiết bị kèm 3 lịch bảo trì · 5 mã khuyến mãi (đang chạy & đã hết hạn) · thông báo mẫu ·
**41 dòng nhật ký hệ thống** phủ **34/40 loại hành động** để demo trang `/admin/audit-logs`
(chưa có trong seed: `FACE_ENROLL`/`FACE_DELETE`/`MEMBER_CREATE` và 3 action đăng ký qua
mã xác minh email — chỉ sinh ra khi dùng chức năng tương ứng).

> Tài khoản trên **chỉ dùng cho môi trường demo/đồ án**. Khi triển khai thật, hãy đổi
> `JWT_SECRET`, xoá tài khoản demo và dùng HTTPS.

---

## 🛡 Phân quyền (RBAC)

Phân quyền được kiểm soát **hai lớp**: `JwtAuthGuard` → `RolesGuard` ở backend (thứ tự route),
và `AdminGuard` / `MemberGuard` / `TrainerGuard` ở frontend (điều hướng + ẩn menu).

| Nhóm chức năng | ADMIN | MANAGER | STAFF | TRAINER | MEMBER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Dashboard tổng quan, báo cáo thống kê | ✅ | ✅ | ✅ | — | — |
| Hội viên / thẻ tập / gói tập / lịch tập / HLV | ✅ | ✅ | ✅ (đọc) | — | — |
| Check-in thủ công (lễ tân) | ✅ | ✅ | ✅ | — | — |
| Xác nhận / từ chối / hoàn tiền | ✅ | ✅ | ✅¹ | — | — |
| Khuyến mãi & voucher | ✅ | ✅ | (đọc) | — | — |
| Chi nhánh / phòng / thiết bị / bảo trì | ✅ | ✅ | (đọc) | — | — |
| Quản lý tài khoản & đổi vai trò | ✅ | — | — | — | — |
| **Nhật ký hệ thống** | ✅ | ✅ | ❌ (403) | ❌ | ❌ |
| Giao diện huấn luyện viên | — | — | — | ✅ | — |
| Đăng ký/gia hạn gói, hóa đơn, lịch tập, hồ sơ | — | — | — | — | ✅ (của chính mình) |

¹ `STAFF` chỉ xác nhận được thanh toán **CASH / BANK_TRANSFER**; `MoMo` & `VNPay` (cổng
ngoài) chỉ `ADMIN` / `MANAGER` mới đối soát được.

Dữ liệu cá nhân của hội viên **luôn** lấy từ `sub` trong JWT — không nhận `memberId` từ
request body, nên không thể đọc dữ liệu của người khác.

---

## 📁 Cấu trúc dự án

```text
Web gym/
├── docker-compose.yml            # PostgreSQL 16 cho môi trường dev
├── README.md                     # Tài liệu này
├── AGENTS.md                     # Quy ước làm việc cho AI agent / developer
├── DESIGN_SYSTEM.md              # Chuẩn giao diện (bắt buộc đọc trước khi sửa UI)
├── WORKLOG.md                    # Nhật ký phát triển từng giai đoạn
├── .github/workflows/ci.yml      # CI: typecheck · lint · format · build (FE + BE)
│
├── backend/                      # ── NestJS REST API (:3001) ──
│   ├── .env.example              # Mẫu biến môi trường (KHÔNG commit .env thật)
│   ├── prisma/
│   │   ├── schema.prisma         # 18 model · 21 enum · index
│   │   └── seed.ts               # Dữ liệu demo idempotent
│   └── src/
│       ├── main.ts               # Swagger · CORS · helmet · ValidationPipe · port
│       ├── app.module.ts         # ThrottlerModule + APP_GUARD
│       ├── prisma/               # PrismaModule · PrismaService
│       ├── common/
│       │   ├── decorators/       # @Roles · @CurrentUser · @Public
│       │   ├── filters/          # AllExceptionsFilter (chuẩn hoá lỗi)
│       │   └── guards/           # JwtAuthGuard · RolesGuard
│       └── modules/              # 19 module nghiệp vụ
│           ├── auth/             # Đăng nhập · đăng ký · JWT strategy
│           ├── users/            # Tài khoản & phân quyền
│           ├── audit-logs/       # Nhật ký hệ thống (@Global)
│           ├── members/          # Hồ sơ hội viên
│           ├── member/           # Cổng API riêng cho hội viên
│           ├── memberships/      # Thẻ hội viên
│           ├── packages/         # Gói tập
│           ├── payments/         # Thanh toán (CASH/BANK/MoMo/VNPay)
│           ├── invoices/         # Hóa đơn INV-YYYY-NNNNNN
│           ├── checkins/         # Check-in / check-out
│           ├── trainers/         # Huấn luyện viên
│           ├── schedules/        # Lịch tập · lớp học · tiến trình
│           ├── equipment/        # Thiết bị & bảo trì
│           ├── promotions/       # Khuyến mãi
│           ├── notifications/    # Thông báo & ticker
│           ├── reports/          # Báo cáo tổng hợp (8 nhóm)
│           ├── branches/         # Chi nhánh
│           ├── public/           # API công khai cho website
│           └── health/           # Healthcheck
│
└── frontend/                     # ── Next.js App Router (:3000) ──
    ├── .env.example
    └── src/
        ├── app/
        │   ├── (public)/         # / · /about · /packages · /trainers · /schedule · /blog · /contact
        │   ├── (auth)/           # /login · /register
        │   ├── (member)/         # Cổng hội viên
        │   ├── (trainer)/        # Cổng huấn luyện viên
        │   ├── (admin)/          # Khu vực quản trị
        │   ├── not-found.tsx     # 404
        │   └── error.tsx         # 500
        ├── components/
        │   ├── ui/               # Button Card Input Select Dialog Badge StatCard Tabs Toast …
        │   ├── layout/           # Header · Footer · AdminSidebar · MemberNav · TrainerNav
        │   ├── guards/           # AdminGuard · MemberGuard · TrainerGuard
        │   ├── home/             # Các khối trang chủ
        │   ├── charts/           # Biểu đồ SVG tự vẽ
        │   ├── notifications/    # Chuông thông báo + ticker
        │   └── training/         # Khối lịch tập / tiến trình
        ├── services/             # 15 service gọi REST API + toàn bộ TypeScript type
        ├── lib/                  # axios · auth · status (nhãn tiếng Việt) · utils · programs
        └── providers/            # QueryProvider (TanStack Query)
```

---

## 🗄 Mô hình dữ liệu

**18 model**, liên kết bằng khoá ngoại có chủ đích để không mất lịch sử:

```text
Branch ─┬─ Room ──── Equipment ──── EquipmentMaintenance
        ├─ User ─┬─ Trainer ─┬─ TrainingSchedule
        │        │           └─ TrainerMember ── TrainingProgress
        │        │           └─ TrainingSchedule
        │        └─ Member ─┬─ Membership ─┬─ Payment ── Invoice
        │                   │              └─ Promotion (SetNull)
        │                   ├─ CheckIn
        │                   ├─ TrainingSchedule
        │                   └─ Notification
        └─ CheckIn
User ── AuditLog (SetNull)      # xoá user không mất nhật ký
```

Quy ước quan hệ:
- `Cascade` — dữ liệu con **phụ thuộc sống** (Room của Branch, Trainer của User, Membership của Member)
- `SetNull` — dữ liệu lịch sử **được giữ lại** (AuditLog.userId, Payment.promotionId, Payment.confirmedById)
- `Restrict` — dữ liệu tài chính / vận hành quan trọng (Payment.memberId, Membership.packageId)

Index được đặt theo truy vấn thực tế (theo `status`, `branchId`, `memberId`, `createdAt`,
`code`, `email`…), không thêm index thừa.

---

## 🔒 Bảo mật

| Hạng mục | Cách thực hiện |
| :--- | :--- |
| Mật khẩu | `bcryptjs`, **10 vòng salt**; không bao giờ trả `passwordHash` ra API |
| JWT | Payload **tối thiểu**: `{ sub, email, role, iat, exp }`; `JWT_SECRET` phải ≥ 32 ký tự |
| Xác thực | `JwtAuthGuard` toàn cục + `@Public()` cho route công khai |
| Phân quyền | `RolesGuard` đọc `@Roles(...)` từ metadata; trả `403` rõ ràng khi thiếu quyền |
| Input validation | `ValidationPipe` toàn cục: `whitelist`, `forbidNonWhitelisted`, `transform` → field lạ trong body bị từ chối `400` |
| HTTP headers | `helmet` (HSTS, `X-Content-Type-Options`, ẩn `X-Powered-By`, CSP…) |
| Rate limit | `@nestjs/throttler`: toàn cục **300 req/phút**; `POST /auth/login` **10/60s**; `POST /auth/register` **5/300s**; đăng ký hội viên tự do: `member-register/send-code` & `resend-code` **5/300s**, `member-register/verify` **10/300s** |
| CORS | Allowlist qua `CORS_ORIGIN` (danh sách phân tách dấu phẩy) |
| Lỗi | `AllExceptionsFilter` chuẩn hoá `{ statusCode, message, error, path, timestamp }`, map lỗi Prisma, **luôn** log chi tiết ở server |
| Nhật ký | `AuditService` (@Global) ghi 40 loại hành động; `log()` **không bao giờ throw** để không làm hỏng nghiệp vụ chính; không lưu mật khẩu/token |
| Rò rỉ thông tin | `.env` nằm trong `.gitignore`; chỉ commit `.env.example` |

Biến môi trường bắt buộc (xem `backend/.env.example`):
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:MAT_KHAU@localhost:5432/gym_db?schema=public"
JWT_SECRET="CHUOI_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
```

---

## 🎨 Hệ thống thiết kế giao diện

Nguồn chuẩn: **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — tóm tắt:

| Token | Mã màu | Dùng cho |
| :--- | :--- | :--- |
| `ink` | `#0B0D0F` | Nền trang |
| `surface` | `#15191D` | Thẻ, panel, sidebar |
| `neon` | `#B7FF00` (hover `#D0FF4D`) | **Chỉ** làm accent: nút chính, số liệu, indicator active |
| `chalk` | `#F5F5F5` | Chữ chính |
| `muted` | `#9AA0A6` | Chữ phụ |
| `line` | `#272C31` | Viền |
| `danger` | `#FF4545` | Lỗi, huỷ, xoá |

Nguyên tắc bắt buộc:
- **Dark-only** — không có toggle sáng/tối, không dùng class `dark:`
- Neon **không** tô nền lớn, không gradient neon
- Font: `Barlow Condensed` (tiêu đề) + `Be Vietnam Pro` (nội dung)
- Icon: `lucide-react` · Animation: component `Reveal` (IntersectionObserver, tôn trọng `prefers-reduced-motion`)
- Gộp class bằng `cn()`; ảnh qua `next/image` với `alt` tiếng Việt

---

## 🧪 Lệnh phát triển & kiểm thử

### `frontend/`
```bash
npm run dev           # dev server :3000
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (next/core-web-vitals + tailwindcss + jsx-a11y)
npm run format        # Prettier --write
npm run format:check  # Prettier --check  (CI dùng)
npm run build         # next build
npm run analyze       # build kèm @next/bundle-analyzer
npm run knip          # phát hiện file/export/dependency không dùng
```

### `backend/`
```bash
npm run start:dev     # nest start --watch :3001
npm run build         # nest build
npm run prisma:generate
npm run prisma:seed   # ts-node prisma/seed.ts
npm run prisma:studio # trình duyệt dữ liệu
npx prisma db push    # đồng bộ schema (KHÔNG dùng migrations)
npx prisma validate   # kiểm tra schema
```

### Kiểm tra trước khi báo cáo "xong"
```bash
cd frontend && npm run typecheck && npm run lint && npm run format:check
cd ../backend && npm run build
```

> **Lưu ý Windows:** đường dẫn dự án có dấu tiếng Việt → luôn quote đường dẫn trong PowerShell.
> Không chạy `next build` khi `next dev` đang dùng chung thư mục `.next` (sẽ hỏng cache);
> nếu lỡ chạy: dừng process ở cổng 3000 → xoá `.next` → chạy lại `npm run dev`.

---

## ✅ Kết quả kiểm thử

| Hạng mục | Kết quả |
| :--- | :--- |
| `npm run typecheck` (FE) | ✅ PASS — 0 lỗi TypeScript |
| `npm run lint` (FE) | ✅ PASS — 0 lỗi, 1 warning có sẵn |
| `npm run format:check` (FE) | ✅ PASS |
| `npm run build` (FE) | ✅ PASS — **49 routes**, không lỗi |
| `npm run build` (BE) | ✅ PASS |
| `prisma validate` | ✅ PASS |
| Smoke test API (STEP 9) | ✅ **76/76 PASS** |
| QA giao diện Playwright | ✅ **0** console error · **0** tràn ngang ở 375/430/768/1280/1440/1920px |

**Smoke test API** (`smoke-step9.js`) kiểm tra: security header helmet · RBAC 401/403 ·
E2E đăng ký hội viên → đăng ký gói → admin xác nhận thanh toán → check-in/out · ghi và truy vấn
audit log (34 loại action) · lọc & phân trang · ràng buộc dữ liệu cá nhân · validation DTO ·
rate limit 429.

**QA giao diện** (`qa-step9-sweep.js`) quét **38 route × 6 viewport** với 3 vai trò đăng nhập,
đối chiếu: không overflow ngang, không lỗi console, trang không render rỗng.

---

## 📦 Triển khai (deploy)

### Backend
```bash
cd backend
npm ci
npm run build
npx prisma migrate deploy     # dùng migration đã sinh & commit cho production
NODE_ENV=production node dist/src/main.js
```
Bắt buộc khi deploy:
- `DATABASE_URL` trỏ tới PostgreSQL quản lý (Heroku/Supabase/Neon/RDS…)
- `JWT_SECRET` ngẫu nhiên ≥ 32 ký tự (VD: `openssl rand -hex 32`)
- `CORS_ORIGIN` = domain thật của frontend
- Đặt sau reverse proxy HTTPS (nginx/Caddy) — `helmet` đã bật HSTS
- Rate limit đang lưu in-memory → khi chạy nhiều instance, cần Redis store

### Frontend
```bash
cd frontend
NEXT_PUBLIC_API_URL="https://api.example.com/api" npm run build
npm run start               # next start -p 3000
```
> `NEXT_PUBLIC_API_URL` được nhúng lúc build → phải set **trước** `next build`.

### CI/CD
`.github/workflows/ci.yml` tự chạy khi push/PR lên `main`:
Frontend `typecheck → lint → format:check → build` và Backend `prisma validate → generate → build`.

---

## ⚠️ Hạn chế & hướng phát triển

- **Bài tập tập luyện** đang là dữ liệu tĩnh trong `frontend/src/lib/programs.ts` — chưa có
  model `Exercise` + CRUD quản trị.
- **Cổng thanh toán** `MoMo` / `VNPay` mới ở mức *stub* (ghi nhận mã giao dịch, chưa gọi API
  thật). `CASH` và `BANK_TRANSFER` đã hoạt động đầy đủ.
- **Gửi email / tin nhắn** chưa tích hợp — thông báo chỉ lưu trong database và hiển thị
  qua chuông + ticker.
- **Chưa có test tự động** (unit/e2e test runner) — kiểm thử hiện dùng smoke test script
  Node.js + Playwright chạy thủ công.
- **Refresh token** chưa triển khai — hết hạn JWT (7 ngày) thì đăng nhập lại.
- Ảnh thumbnail động tĩnh; nên chuyển sang object storage khi chạy thật.

---

## 📚 Cấu trúc commit & tài liệu nội bộ

Commit theo **Conventional Commits**: `feat(frontend): …`, `fix(admin): …`, `ci: …`, `docs: …`.

| Tài liệu | Nội dung |
| :--- | :--- |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Chuẩn giao diện — đọc trước khi sửa UI |
| [AGENTS.md](AGENTS.md) | Quy ước làm việc, lệnh kiểm tra, bẫy môi trường dev |
| [WORKLOG.md](WORKLOG.md) | Nhật ký phát triển & quyết định thiết kế từng giai đoạn |

---

## 📄 Giấy phép & Tác giả

Đồ án tốt nghiệp — Trường Đại học Lạc Hồng. Toàn quyền thuộc về nhóm tác giả.
