# Gym Management & Operations Web Application (Full-Stack)

Hệ thống web quản lý hội viên và vận hành chuỗi phòng tập gym chuyên nghiệp, được xây dựng theo kiến trúc hiện đại, tách biệt hoàn toàn **Frontend (Next.js)** và **Backend (NestJS + Prisma + PostgreSQL)** giao tiếp qua chuẩn REST API.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/), Radix/shadcn design foundation, [Lucide React](https://lucide.dev/) Icons
- **Theme**: Hỗ trợ chuyển đổi Dark / Light mode linh hoạt
- **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **HTTP Client**: [Axios](https://axios-http.com/) với Auth Interceptors tự động gắn JWT
- **Form & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts & Data Viz**: [Recharts](https://recharts.org/)

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js, TypeScript)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/)
- **API Documentation**: [Swagger / OpenAPI](https://swagger.io/) với cơ chế gắn Bearer Auth
- **Bảo mật & Xác thực**: JWT (JSON Web Tokens), `bcryptjs`, RBAC Guards & Decorators
- **Validation**: `class-validator`, `class-transformer`

---

## 📁 Cấu trúc Dự án

```text
Web gym/
├── docker-compose.yml          # Container PostgreSQL 16 tiện lợi
├── README.md                   # Hướng dẫn chi tiết chạy dự án
├── backend/                    # NestJS REST API Server
│   ├── .env.example            # Biến môi trường mẫu
│   ├── .env                    # Biến môi trường thực tế
│   ├── prisma/
│   │   ├── schema.prisma       # 14 Entity Models, Enums, Foreign Keys & Indexes
│   │   └── seed.ts             # Dữ liệu khởi tạo (Admin, Packages, Branch, Member)
│   └── src/
│       ├── main.ts             # Swagger (/api/docs), CORS, Validation, Port 3001
│       ├── app.module.ts       # Module gốc tích hợp toàn bộ các phân hệ
│       ├── prisma/             # PrismaModule & PrismaService
│       ├── common/
│       │   ├── decorators/     # @Roles(), @CurrentUser(), @Public()
│       │   ├── guards/         # JwtAuthGuard, RolesGuard
│       │   └── enums/          # Role (ADMIN, MANAGER, STAFF, TRAINER)
│       └── modules/            # 14 Phân hệ nghiệp vụ backend
│           ├── auth/           # Đăng nhập, đăng ký, JWT Strategy
│           ├── health/         # Healthcheck API (/api/health)
│           ├── users/          # Quản lý tài khoản và phân quyền
│           ├── members/        # Hồ sơ hội viên
│           ├── trainers/       # Huấn luyện viên (PT)
│           ├── branches/       # Chi nhánh phòng tập
│           ├── packages/       # Gói tập gym
│           ├── memberships/    # Thẻ hội viên & hợp đồng
│           ├── checkins/       # Quét thẻ ra vào thời gian thực
│           ├── payments/       # Hóa đơn & thu phí
│           ├── schedules/      # Lịch tập luyện & PT
│           ├── promotions/     # Khuyến mãi & Voucher
│           ├── equipment/      # Thiết bị & bảo trì máy móc
│           ├── notifications/  # Thông báo hệ thống
│           └── reports/        # Báo cáo doanh thu & vận hành
│
└── frontend/                   # Next.js App Router Client (Port 3000)
    ├── .env.example
    ├── .env.local
    └── src/
        ├── lib/
        │   ├── axios.ts        # Axios client cấu hình interceptors
        │   └── utils.ts        # Utility format tiền tệ, ngày giờ, CSS cn
        ├── providers/
        │   ├── query-provider.tsx # TanStack Query Provider
        │   └── theme-provider.tsx # Dark / Light mode provider
        ├── components/
        │   ├── layout/         # AdminSidebar, AdminHeader, MobileNav
        │   └── ui/             # Button, Card, Badge, Input, StatCard
        └── app/
            ├── layout.tsx      # Root layout
            ├── page.tsx        # Redirect -> /dashboard
            ├── (auth)/
            │   └── login/      # Trang đăng nhập kèm tài khoản mẫu
            └── (dashboard)/    # Admin Layout bọc toàn bộ routes
                ├── dashboard/  # Bảng điều khiển KPI & Bàn quét thẻ nhanh
                ├── members/    # Quản lý hội viên
                │   └── [id]/   # Chi tiết hồ sơ & lịch sử tập luyện
                ├── membership-packages/ # Danh mục gói tập gym
                ├── memberships/         # Quản lý thẻ hội viên
                ├── checkins/            # Trạm kiểm soát quét thẻ ra vào
                ├── trainers/            # Đội ngũ huấn luyện viên (PT)
                ├── schedules/           # Lịch tập & Lớp học
                ├── payments/            # Hóa đơn & Sổ quỹ
                ├── promotions/          # Quản lý voucher & khuyến mãi
                ├── equipment/           # Quản lý thiết bị máy móc
                ├── branches/            # Quản lý chi nhánh
                ├── reports/             # Báo cáo & Thống kê
                ├── notifications/       # Thông báo hệ thống
                └── settings/            # Cài đặt & Phân quyền
```

---

## ⚡ Hướng dẫn Khởi chạy Dự án

### Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL

Bạn có thể chọn 1 trong 3 cách sau:

#### Cách A: Chạy bằng Docker (Khuyên dùng nếu có Docker)
Tại thư mục gốc `Web gym/`:
```bash
docker compose up -d
```
Container PostgreSQL 16 sẽ tự động chạy tại cổng `5432`.

#### Cách B: Dùng PostgreSQL cài trên máy cục bộ
1. Cài đặt PostgreSQL (hoặc qua winget: `winget install PostgreSQL.PostgreSQL.16`).
2. Mở pgAdmin hoặc công cụ SQL tạo một database tên: `gym_db`.
3. Kiểm tra thông tin kết nối trong file `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:mat_khau_cua_ban@localhost:5432/gym_db?schema=public"
   ```

#### Cách C: Dùng PostgreSQL Cloud miễn phí (Neon / Supabase / Aiven)
1. Đăng ký tài khoản miễn phí tại [Neon.tech](https://neon.tech) hoặc [Supabase.com](https://supabase.com).
2. Tạo project và copy connection string (dạng `postgresql://user:pass@host/dbname?sslmode=require`).
3. Dán vào `backend/.env`:
   ```env
   DATABASE_URL="chuỗi_kết_nối_cloud_của_bạn"
   ```

---

### Bước 2: Chạy Backend (NestJS REST API)

1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt thư viện (nếu chưa cài):
   ```bash
   npm install
   ```

3. Sinh Prisma Client và đồng bộ cấu trúc bảng vào Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Nạp dữ liệu mẫu ban đầu (Admin, Gói tập, Chi nhánh, Hội viên test):
   ```bash
   npx ts-node prisma/seed.ts
   ```

5. Khởi động máy chủ backend ở chế độ phát triển:
   ```bash
   npm run start:dev
   ```

6. Truy cập và kiểm tra:
   - **REST API Base URL**: `http://localhost:3001/api`
   - **Swagger OpenAPI Docs**: `http://localhost:3001/api/docs`
   - **Healthcheck**: `http://localhost:3001/api/health`

---

### Bước 3: Chạy Frontend (Next.js Web Client)

1. Mở một cửa sổ terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

2. Cài đặt thư viện (nếu chưa cài):
   ```bash
   npm install
   ```

3. Khởi động máy chủ frontend:
   ```bash
   npm run dev
   ```

4. Truy cập giao diện web tại:
   👉 **`http://localhost:3000`**

---

## 🔐 Tài khoản Đăng nhập Mẫu (RBAC Test)

Hệ thống đã chuẩn bị sẵn tài khoản demo tương ứng với 4 vai trò phân quyền:

| Vai trò (Role) | Email | Mật khẩu mặc định | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@gym.com` | `Admin@123456` | Toàn quyền quản trị hệ thống, tài chính, báo cáo, chi nhánh |
| **MANAGER** | `manager@gym.com` | `Manager@123456` | Quản lý chi nhánh, hội viên, lịch tập, duyệt gói tập |
| **STAFF** | `staff@gym.com` | `Staff@123456` | Lễ tân, quét thẻ check-in, đăng ký hội viên mới, tạo hóa đơn |
| **TRAINER** | `trainer@gym.com` | `Trainer@123456` | Huấn luyện viên, xem lịch dạy cá nhân, học viên phụ trách |

*(Trên trang `/login` có sẵn các nút bấm 1 chạm để điền nhanh các tài khoản trên)*

---

## 🎯 Kiểm tra Tích hợp Hệ thống

- **Kết nối Backend - Frontend**: Khi mở giao diện Dashboard, ở thanh Header góc phải sẽ có biểu tượng đèn báo màu xanh lá `API Connected` được ping tự động qua React Query tới endpoint `/api/health`.
- **Trạm Check-in Trực tiếp**: Nhập mã thẻ `MEM-0001` tại Dashboard hoặc trang `/checkins` và bấm Quét thẻ để kiểm tra luồng ghi nhận lượt tập thời gian thực từ Database.
"# GymShark" 
