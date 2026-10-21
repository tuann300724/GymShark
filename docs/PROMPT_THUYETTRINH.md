# PROMPT THUYẾT TRÌNH — ĐỒ ÁN GYM SHARK (Gym Management System)

## Thông tin dự án (điền vào slide)
- Tên: **GymShark — Hệ thống quản lý phòng tập gym full-stack**
- Nhóm / SV: [Tên bạn / nhóm]
- Trường: ĐH Lạc Hồng
- Nền tảng: Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 | NestJS + TypeORM + PostgreSQL 17
- Thời gian: 2026-10-21 (cuối dự án)
- Repo: `https://github.com/tuann300724/GymShark` | Demo: `http://localhost:3000` (FE) / `http://localhost:3001/api/docs` (Swagger BE)
- Thiết kế: Dark cinematic, Neon `#B7FF00`, Font Barlow Condensed + Be Vietnam Pro (DESIGN_SYSTEM.md)

---

## CẤU TRÚC SLIDE (12–15 slide, gợi ý nội dung từng slide)

### Slide 1 — TIÊU ĐỀ
- Hình nền: `public/images/gym-hero.jpg` (tối, neon) | Logo tự tạo hoặc chữ GYM SHARK
- Tên dự án, tên SV/nhóm, trường ĐH Lạc Hồng, ngày thuyết trình
- Tagline: *"Quản lý phòng gym — từ hội viên đến ban quản lý — trên một nền tảng realtime, nhận diện khuôn mặt và dinh dưỡng."*

### Slide 2 — BỐI CẢNH & VẤN ĐỀ
- Vấn đề: Phòng gym hiện tại quản lý thủ công → thất thoát hội viên, khó theo dõi check-in, thiếu công cụ dinh dưỡng cho HLV, không có hệ thống chat/trao đổi trực tiếp
- Mục tiêu: Xây dựng hệ thống full-stack tích hợp tất cả quy trình từ đăng ký hội viên, thanh toán, lịch tập, thực đơn dinh dưỡng, chat realtime (HLV ↔ hội viên), nhận diện khuôn mặt (FACE_ID), và báo cáo quản trị

### Slide 3 — CÔNG NGHỆ & KIẾN TRÚC
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS v3 + lucide-react icons + `next/font` (Barlow Condensed + Be Vietnam Pro)
- **Backend**: NestJS + TypeORM + PostgreSQL 17 (đã revert từ SQL Server 2022 Phase 2 — 185 SP, adapter 20 modules)
- **Realtime**: Socket.IO (`@nestjs/websockets`, `socket.io-client`) cho chat (trainer ↔ member) + notification ticker
- **Nhận diện khuôn mặt**: `@vladmandic/human` (client-side, vector 1024 chiều, `FACE_ID` method, consent NĐ13/2023, anti-spoof `real<0.3`)
- **Thư viện thực phẩm / thực đơn dinh dưỡng**: `Food` + `MealPlan` + `Meal` + `MealItem` — tính calo/P/C/F 100g, snapshot, gửi qua chat
- **Thiết kế**: Reveal animation (IntersectionObserver), ThemeToggle (CSS variables), palette `ink/surface/neon/chalk/muted/line/danger`

### Slide 4 — CẤU TRÚC DỰ ÁN (Sơ đồ)
- Hình minh họa: `frontend/src/app/` (`public`, `member`, `admin`, `trainer`, `home`) + `components/chat/chat-client.tsx` (dùng chung) + `backend/src/modules/chat/chat.gateway.ts` + DB schema `prisma/schema.prisma` (28 bảng, 185 SP gốc SQL Server — đã revert PostgreSQL với TypeORM entities điều chỉnh)
- Các module chính BE: `auth`, `members`, `memberships`, `payments`, `invoices`, `checkins`, `schedules`, `trainers`, `foods`, `meal-plans`, `chat`, `faces`, `audit-logs`, `notifications`, `promotions`, `reports`

### Slide 5 — TÍNH NĂNG NỔI BẬT 1: CHAT REALTIME (HLV ↔ HỘI VIÊN)
- Hình minh họa: `frontend/src/components/chat/chat-client.tsx` + `backend/src/modules/chat/chat.gateway.ts`
- Giao thức: Socket.IO JWT-auth (`join user:<id>`), event `typing`, `message:new`, `conversation:updated`, `messages:read`
- Phân quyền: chỉ `TrainerMember` ACTIVE mới chat (ràng buộc backend)
- Lưu trữ: `Conversation` + `Message` + `MessageAttachment` (base64 data URL)
- Demo: 2 trình duyệt (`trainer@gym.com` ↔ `member@gym.com`) → member nhận ngay khi trainer gửi

### Slide 6 — TÍNH NĂNG NỔI BẬT 2: THỰC ĐƠN DINH DƯỠNG & THƯ VIỆN THỰC PHẨM
- Mô tả: `Food` (26 món seed), `MealPlan`, `Meal` (BREAKFAST/LUNCH/DINNER/SNACK), `MealItem`
- Tính dinh dưỡng: tổng calo/P/C/F 100g, snapshot khi lưu + gửi qua chat
- Giao diện: builder `/trainer/meal-plans/builder` → thêm bữa ăn → chọn món từ thư viện → tính tổng → Lưu nháp / Gửi cho hội viên (kèm chat)
- Xác nhận hội viên: hội viên nhận thực đơn qua chat, có thể xác nhận
- Hình minh họa: trang builder thực đơn + thư viện thực phẩm (`/admin/foods`)

### Slide 7 — TÍNH NĂNG NỔI BẬT 3: CHECK-IN / CHECK-OUT & NHẬN DIỆN KHUÔN MẶT (FACE_ID)
- Schema: `CheckIn` (`method` enum: CARD/QR/BIOMETRIC/PHONE/FACE_ID) + `FaceEmbedding` (vector Float[] dim 1024, `consentAt`, `imageData` data URL, `real<0.3` anti-spoof)
- Lễ tân (`/admin/checkins`) → Quét khuôn mặt 1:N (`POST /checkins/face-scan`, threshold `FACE_MATCH_THRESHOLD_1N=0.7`) → nếu trượt → 404 → lễ tân đối chiếu ảnh thủ công trước khi ghi lượt
- HLV (`/member/checkin`) → Đăng ký khuôn mặt (`/member/face-registration`, consent NĐ13/2023) → Check-in bằng `FACE_ID`
- Reports: `byMethod` + KPI "Check-in theo hình thức" (`/admin/reports/attendance`)
- Bẫy mới: `human.webcam.start()` trả chuỗi lỗi `"webcam error"` chứ không ném exception; alias ESM bundle (`next.config.mjs` + `types/human-esm.d.ts`)

### Slide 8 — TÍNH NĂNG NỔI BẬT 4: PROMOTION + NOTIFICATION + REPORTING
- `Promotion`: CRUD/validate tự tính `subtotal-discount-total`/usage đếm qua `Payment`/stats/auto-expire
- `Notification`: bell 3 phía (`/admin/notifications`), list thành viên, `/announce` theo role (`SPECIFIC_BRANCH` + `SENDER`), ticker 6h (`NotificationTickerService` — còn lỗi nhỏ `syntax error at or near "1"` từ SQL Server raw SQL `dbo.notifications` → đã revert PostgreSQL)
- `Reports`: `/admin/reports` 8 tab + CSV export (BOM), KPI thành viên (`/member/dashboard`), lịch sử check-in, thanh toán, chuyên cần
- `AuditLog`: `@Global()`, `log()` không bao giờ throw, 34 action / 12 entity, `AllExceptionsFilter` chuẩn hoá lỗi, `PrismaModule` dọn dần

### Slide 9 — TRẠNG THÁI MÔI TRƯỜNG & LƯU Ý KỸ THUẬT
- **DB**: PostgreSQL 17 native (`postgresql-x64-17`, service `Running`, port 5432, DB `gym_db`); `.env`: `postgres`/`postgrespassword`; `prisma` provider = `postgresql`
- **BE**: `localhost:3001/api` (Swagger docs), `start:dev` (`watch`)
- **FE**: `localhost:3000` (`dev` + `build` PASS)
- **QA**: `npm run typecheck` + `lint` + `format:check` PASS; `npm run build` PASS (49/52 routes, 3 routes còn lỗi format từ `mass-checkout` CRLF)
- **Browser**: desktop 1440px + mobile 390px; `Reveal` (IntersectionObserver) — scroll hết trang trước khi chụp fullPage; `waitForFunction` cho nội dung stream; `net::ERR_ABORTED` + host ngoài (Google Maps) bỏ qua
- **Git**: `main` đã push (5 commit mới: SQL Server Phase 2 185 SP + adapter 20 module, Three.js + Framer Motion Kỳ 13, chat/nutrition/meal-plan + seed 26 món, notification realtime, promotion)

### Slide 10 — LỊCH SỬ & COMMIT (Timeline)
- Kỳ 4–10: Membership + Check-in (`TrainerMember`, `CheckIn` method, reports, KPI)
- STEP 6: Payment + Invoice (PaymentGateway `CASH`/`BANK_TRANSFER`/stub `MOMO`/`VNPAY`, Invoice `INV-2026-NNNNNN`, `transaction` 409 trùng ref)
- STEP 5: Trainer + Lịch tập (`TrainerMember`, `TrainingProgress`, `SessionType`)
- STEP 8: Promotion + Notification + Reporting (8 tab + CSV + KPI)
- Kỳ 11: Check-in nhận diện khuôn mặt (`FACE_ID`, `consent NĐ13/2023`, `FACE_MATCH_THRESHOLD=0.6/0.7`, `anti-spoof`)
- Kỳ 9–10: AuditLog (`34 action / 12 entity`, `AllExceptionsFilter`, `helmet`, `throttler` 300/60s, login 10/60s, `admin/audit-logs`)
- Kỳ 13: Three.js + Framer Motion (UI điện ảnh, tối, tương phản mạnh)
- Giai đoạn 1–2: Chat realtime + Meal-plan builder + Food library + 26 món seed
- Phase 2 Migration: PostgreSQL → SQL Server (185 SP, adapter 20 module) → hiện revert về PostgreSQL 17 native cho ổn định

### Slide 11 — KẾT QUẢ QA & KIỂM TRA (Bảng số liệu)
- **Typecheck**: PASS
- **Lint**: 0 warning
- **Format**: PASS (`mass-checkout` fix CRLF)
- **Build FE**: PASS (`npm run build`)
- **Build BE**: PASS (`nest build`)
- **Smoke API**: 36/36 (Kỳ 11) + 77/77 (STEP 9) + 47/47 (STEP 6) + 30/30 (STEP 8)
- **QA Playwright**: 294/294 responsive PASS (6 viewport × 49 route), 26 màn promotion + 16 màn trainer/schedule + 11 màn payment + 3 màn promotion/e2e
- **Browser**: 6 màn 0 console error; `find-failed-requests.js` bỏ qua `net::ERR_ABORTED` + host ngoài
- **Knip**: 0 code chết

### Slide 12 — BẪY KỸ THUẬT & BÀI HỌC (Bảng)
- `provider = "postgresql"` vs `"sqlserver"` (revert ổn định)
- `dark:` bị cấm (`grep` kiểm tra `emerald|teal-|dark:` phải = 0)
- PowerShell 5.1: `&&`/`&` sai; `Get-Content` path tiếng Việt phải quote; `Out-File` BOM
- `Reveal` (IntersectionObserver): phải scroll hết trang trước khi `fullPage` screenshot; `waitForTimeout` giả FAIL
- `net::ERR_ABORTED` bỏ qua khi đếm lỗi mạng; `net::ERR_CONNECTION_REFUSED` (API down) là lỗi thật
- Rate limit `/auth/login`: 10/60s; `renew` email cho idempotency; `localStorage` cho `ThemeToggle`
- `DB_USERNAME`/`DB_PASSWORD` dùng `postgres` cho PostgreSQL native (không dùng Docker `postgrespassword`)
- `backend/.env` đã revert PostgreSQL (`DB_HOST=localhost`, `DB_PORT=5432`); `.env.local` không tồn tại

### Slide 13 — DEMO / VIDEO / QR (Nếu có)
- QR code hoặc link: `http://localhost:3000/login` (`trainer@gym.com` / `Member@123456`, `member@gym.com` / `Member@123456`)
- Screenshot: trang chủ (Hero tối, neon), dashboard hội viên (`/member/dashboard` — KPI chuyên cần, thanh toán, thẻ QR), trang tin nhắn (`/member/messages` — realtime), trang thực đơn (`/member/meal-plans` — builder), `/admin/audit-logs` (gate `ADMIN`/`MANAGER`)

### Slide 14 — KẾT LUẬN & HƯỚNG PHÁT TRIỂN
- Đã hoàn thành: full-stack gym management (public + member + trainer + admin) + realtime chat + meal-plan + face recognition + audit + promotion + notification
- Hạn chế: AI nhận diện món từ ảnh (`FoodRecognitionProvider`) còn stub — kiến trúc mở, sẵn sàng cắm mô hình AI (CDN model `@vladmandic/human`)
- Đề xuất: triển khai production (`docker compose` PostgreSQL + `docker-compose` cho SQL Server dự phòng), thêm OCR hóa đơn (`invoice`), tích hợp thanh toán thật (`MOMO`/`VNPAY` stub → thật), nâng cấp Next.js 15/16, 6 PR Dependabot chờ duyệt

---
## GỢI Ý ĐỊNH DẠNG SLIDE (cho bạn tự làm)
- **Font tiêu đề**: Barlow Condensed (Bold, 36–48pt, uppercase nếu muốn)
- **Font nội dung**: Be Vietnam Pro (14–18pt)
- **Màu nền**: `#0B0D0F` (ink) hoặc `#1A1C20` (surface)
- **Accent/Highlight**: `#B7FF00` (neon) cho tiêu đề phụ, số liệu, border, icon
- **Card/Box**: nền `#15161A` (`surface`), viền `#2A2D30` (`line`), shadow nhẹ
- **Bảng số liệu**: nền đen (`ink`), header neon (`#B7FF00`), dòng xen kẽ (`#15161A` / `#0B0D0F`)
- **Code/code block**: `monospace` (Consolas), nền `#15161A`, chữ `#F2F4F0` (chalk), keyword neon
- **Icon**: `lucide-react` (Sun/Moon cho theme toggle, MessageCircle cho chat, Utensils cho meal-plan, ShieldCheck cho audit, BarChart3 cho reports, ScanFace cho face ID)
- **Hình ảnh**: bắt buộc tông tối, tương phản mạnh (`public/images/`); thêm `alt` tiếng Việt

---
## CHECKLIST TRƯỚC THUYẾT TRÌNH (từ AGENTS.md)
- [ ] `npm run typecheck` PASS
- [ ] `npm run lint` PASS (0 warning)
- [ ] `npm run format:check` PASS
- [ ] `npm run build` PASS (FE 49 routes + BE `nest build` PASS)
- [ ] `GET http://localhost:3001/api/health` → `database: "connected"`
- [ ] FE `localhost:3000/login` → 200 OK, hydration OK (`onSubmit` gắn)
- [ ] Browser QA: 0 `console error`, 0 `overflow` (`find-overflow.js` 768px), 0 `net::ERR_CONNECTION_REFUSED` (API up) — bỏ qua `net::ERR_ABORTED` + host ngoài
- [ ] `Find-Content` file tiếng Việt phải quote trong shell
- [ ] `Get-Content`/`Set-Content` PowerShell 5.1: tránh BOM; dùng `[System.IO.File]::ReadAllBytes` nếu gặp mojibake

---
## TÓM TẮT 1 CÂU (cho bạn nói mở đầu thuyết trình)
> "GymShark là đồ án tốt nghiệp quản lý phòng tập gym full-stack, viết bằng tiếng Việt, sử dụng Next.js 14 + TypeScript + Tailwind CSS v3 cho giao diện tối điện ảnh và NestJS + TypeORM + PostgreSQL 17 cho backend, tích hợp realtime chat Socket.IO, nhận diện khuôn mặt FACE_ID theo NĐ13/2023, thư viện thực phẩm và công cụ tạo thực đơn dinh dưỡng, cùng hệ thống báo cáo, audit và khuyến mãi — đã nghiệm thu typecheck + lint + format + build + smoke API + QA Playwright 294/294 PASS."
