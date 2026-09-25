# AGENTS.md — Hướng dẫn làm việc với dự án GymShark

> File này được OpenCode tự động nạp ở mỗi phiên làm việc. Giữ nó luôn khớp với hiện trạng.
> Nguồn chuẩn giao diện: **DESIGN_SYSTEM.md** — đọc trước khi sửa bất kỳ UI nào.

## 1. Tổng quan

Dự án full-stack quản lý phòng tập gym (đồ án tốt nghiệp), toàn bộ giao diện viết bằng **tiếng Việt**:

- **frontend/** — Next.js 14 (App Router) + TypeScript + Tailwind CSS v3, chạy `http://localhost:3000`
- **backend/** — NestJS + Prisma + PostgreSQL, chạy `http://localhost:3001/api` (Swagger: `http://localhost:3001/api/docs`)
- **docker-compose.yml** — chỉ chứa PostgreSQL 16 (port 5432, user/pass `postgres`/`postgrespassword`, database `gym_db`)
- Frontend gọi REST qua Axios (`src/lib/axios.ts`), baseURL = `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:3001/api`), tự gắn JWT.

## 2. Lệnh nhanh

Thư mục `frontend/`:

```bash
npm run dev          # dev server :3000
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint (next/core-web-vitals + tailwindcss + jsx-a11y)
npm run format       # Prettier format toàn bộ
npm run format:check # Prettier kiểm tra (CI dùng)
npm run build        # build production
npm run analyze      # bundle analyzer (build kèm @next/bundle-analyzer)
npm run knip         # tìm file/export/dependency không dùng
```

Thư mục `backend/`:

```bash
npm run start:dev    # dev server :3001 (watch)
npm run build        # nest build
npm run prisma:seed  # seed dữ liệu mẫu (tài khoản xem prisma/seed.ts)
npx prisma migrate dev   # tạo/chạy migration
```

Ở thư mục gốc: `docker compose up -d` để khởi động PostgreSQL.

## 3. Cấu trúc frontend

```text
src/
├── app/
│   ├── (public)/     # công khai: /, /about, /packages, /trainers, /schedule, /contact, /blog, /login, /register
│   ├── (member)/     # khu vực hội viên (cần đăng nhập)
│   └── (admin)/      # khu vực quản trị (cần role admin)
├── components/
│   ├── home/         # khối trang chủ: hero, programs, weekly-schedule, progress-dashboard, featured-article, cta
│   ├── layout/       # public-header, public-footer
│   └── ui/           # button, card, input... (theo variants)
└── lib/              # axios (interceptor JWT), hooks, helpers
```

Ảnh tĩnh nằm ở `public/images/` — bắt buộc tông **tối, điện ảnh, tương phản mạnh**; không dùng ảnh stock sáng màu. Kèm `alt` tiếng Việt.

## 4. Quy ước design & code (bắt buộc)

1. **Palette duy nhất** (chi tiết trong `DESIGN_SYSTEM.md`): nền `#0B0D0F`, surface `#15191D`, accent neon `#B7FF00` (hover `#D0FF4D`), chữ `#F5F5F5` / phụ `#9AA0A6`, viền `#272C31`, danger `#FF4545`. Neon **chỉ** làm accent (nút, số liệu, indicator active) — không bao giờ tô nền lớn, không gradient neon.
2. **Dark-only**: không thêm toggle sáng/tối, không lớp `dark:`.
3. **Sau khi sửa UI luôn grep kiểm tra** không lẫn palette cũ: `emerald|teal-|slate-|rose-|bg-white|dark:` → phải là 0 kết quả.
4. Font chỉ 2 họ, khai báo tại `src/app/layout.tsx` (next/font/google): **Barlow Condensed** (tiêu đề) + **Be Vietnam Pro** (nội dung).
5. Icon dùng `lucide-react`. Animation dùng component `Reveal` (IntersectionObserver, tôn trọng `prefers-reduced-motion`) — hiệu ứng tiết chế, không "game hóa".
6. Gộp class bằng `cn()` (clsx + tailwind-merge). **Không cài package mới khi chưa hỏi tôi.**
7. Ảnh qua `next/image`, đường dẫn nội bộ `/images/...`.

## 5. Kiểm tra trước khi báo "xong"

Ở `frontend/` chạy tuần tự, cả 3 phải PASS:

```bash
npm run typecheck && npm run lint && npm run format:check
```

Sửa nhiều/rộng → thêm `npm run build`. Sửa backend → `npm run build` ở `backend/`.

## 6. Git

- Repo: `https://github.com/tuann300724/GymShark`, nhánh `main`.
- Message chuẩn **Conventional Commits**: `feat(frontend): ...`, `fix(admin): ...`, `ci: ...`, `docs: ...`.
- **Không push khi chưa được tôi đồng ý** (`opencode.jsonc` cũng đặt `git push` ở chế độ phải xác nhận).
- Không commit: `.env`, `.next/`, `dist/`, `node_modules/`, chụp màn hình/tập tin tạm.

## 7. QA giao diện

Ưu tiên **browser tools có sẵn** của OpenCode (mở tab → navigate → screenshot → console) thay vì viết script ngoài. Lệnh có sẵn:

- `/check` — typecheck + lint + format
- `/ui <route>` — soi 1 trang theo DESIGN_SYSTEM.md
- `/shot <route>` — chụp ảnh trang
- `/commit` — commit chuẩn Conventional Commits

Chrome chuẩn: desktop 1440px, mobile 390px (không được tràn ngang). Backend chưa chạy thì các trang có dữ liệu hiển thị **empty state** sẵn có — không coi là lỗi.

## 8. Lưu ý môi trường

- Windows + PowerShell: tên biến **không phân biệt hoa thường** (`$h` và `$H` là cùng một biến — dùng tên biến khác nhau khi cần 2 biến).
- Đường dẫn dự án chứa dấu tiếng Việt (`Đ`, `ữ`...) — luôn quote đường dẫn trong shell.
- Port 3000 hay kẹt sau khi build production; kiểm tra process đang chiếm port trước khi `npm run dev` (dùng `Get-NetTCPConnection -LocalPort 3000`).
