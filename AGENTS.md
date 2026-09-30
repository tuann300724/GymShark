# AGENTS.md — Hướng dẫn làm việc với dự án GymShark

> File này được OpenCode tự động nạp ở mỗi phiên làm việc. Giữ nó luôn khớp với hiện trạng.
> Nguồn chuẩn giao diện: **DESIGN_SYSTEM.md** — đọc trước khi sửa bất kỳ UI nào.
> **QUY TẮC HÀNH ĐỘNG:** chỉ làm việc khi tôi yêu cầu cụ thể — không tự động làm thêm, không tự commit/push, không tự sửa ngoài phạm vi được giao. Thấy gì bất thường hoặc cần làm thêm → hỏi trước.

## 1. Tổng quan

Dự án full-stack quản lý phòng tập gym (đồ án tốt nghiệp), toàn bộ giao diện viết bằng **tiếng Việt**:

- **frontend/** — Next.js 14 (App Router) + TypeScript + Tailwind CSS v3, chạy `http://localhost:3000`
- **backend/** — NestJS + Prisma + PostgreSQL, chạy `http://localhost:3001/api` (Swagger: `http://localhost:3001/api/docs`)
- **docker-compose.yml** — chỉ chứa PostgreSQL 16 (port 5432, user/pass `postgres`/`postgrespassword`, database `gym_db`) — *máy dev hiện chạy PostgreSQL 17 cài native thay Docker, xem mục 8*
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
npx prisma db push   # sync schema vào DB — dự án KHÔNG có thư mục migrations, đừng chạy `prisma migrate dev`
```

Khởi động DB: máy dev hiện dùng **PostgreSQL 17 native** (service `postgresql-x64-17`, xem mục 8) — không cần Docker; máy khác mới `docker compose up -d` ở thư mục gốc.

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

Nếu **browser tools disconnected** → dùng script Playwright ở `C:\Users\USER\AppData\Local\Temp\opencode\pw\` (đã cài `playwright-core`, chạy `node <script>.js` từ chính thư mục đó, browser `channel: 'chrome'`; ảnh ra `...\Temp\opencode\shots\`). **Bẫy:** trang dùng `Reveal` (IntersectionObserver) — trước khi chụp `fullPage` phải scroll hết trang, nếu không ra ảnh trống. Mẫu có sẵn: `qa-register-flow.js`, `qa-admin-approve.js`, `qa-mobile.js`, `qa-checkin-flow.js` (check-in/attendance), `qa-step9-sweep.js` (quét 38 route × 6 viewport), `smoke-step9.js` (76 check API), `cleanup-smoke-artifacts.js` (xoá dữ liệu test).

**Script chẩn đoán dữ liệu/UI (khi cần, không phải test):**
`db-stats2.js` (bảng số liệu + kiểm tra lệch tiền/thẻ nhiều payment + audit theo action) ·
`db-check2.js` (schedule/payment/invoice/membership-thiếu-payment) · `db-audit.js` (user ↔ member ↔ audit ↔ notif) ·
`find-overflow.js` (dò phần tử tràn ngang ở viewport chỉ định) · `find-failed-requests.js` (response ≥400) ·
`scan-opacity.js` (quét class opacity không có trong scale Tailwind, vd `via-ink/92`) ·
`cleanup-demo-data.js` + `cleanup-demo-data2.js` + `cleanup-maint.js` (dọn dữ liệu demo chọn lọc).

**Bẫy endpoint khi viết script QA:** `GET /promotions` **không nhận** `?limit=` → `forbidNonWhitelisted` trả **400**; các API list khác trả `{data, total, page, limit}` chứ không phải array thuần (`/branches`, `/membership-packages` mới trả array). Luôn `await res.ok` + fallback bỏ query khi 400.

**Bẫy đo trang (rất dễ báo FAIL giả):**
- **Đừng dùng `waitForTimeout` cố định** để đo nội dung — Next stream sau `domcontentloaded` nên đo
  lúc đó ra `textLen = 0`. Dùng `page.waitForFunction(() => innerText.trim().length >= 40)`.
- Khi đếm lỗi mạng: **bỏ qua host ngoài** (Google Maps embed bị chặn offline) và bỏ qua
  `net::ERR_ABORTED` (Next huỷ prefetch RSC khi điều hướng).
- Route `/member/payments/[id]` phải dùng **ID của chính hội viên**; dùng ID lấy từ token admin sẽ 404
  (đúng — ràng buộc dữ liệu cá nhân) và báo "trang rỗng" giả.
- **Bẫy login:** phải `waitUntil: 'networkidle'` + chờ ~1.5s cho React hydration gắn `onSubmit` trước
  khi fill/click, nếu không form submit native kèm query string.

**Bẫy rate-limit khi QA nhiều lần:** `/auth/login` giới hạn 10 lần/60s theo IP. Script quét nhiều route × nhiều viewport phải **đăng nhập 1 lần/role rồi tái dùng `storageState`** cho các viewport sau (xem `qa-step9-sweep.js`), và phần test 429 phải để **cuối script** (store throttle in-memory → restart backend để reset). Với smoke script, dùng **email cố định** + fallback `renew` để chạy lại nhiều lần vẫn idempotent.

**Bẫy encoding PowerShell 5.1:** `Get-Content`/`Set-Content`/`Out-File` làm hỏng tiếng Việt (thêm BOM + double-encoding cp1252 → thành `T¿o mA� khuy�n mA�i`). **Chỉ sửa file tiếng Việt bằng tool `write`/`edit`.** Nếu buộc phải dùng shell: `[System.IO.File]::ReadAllBytes` + `WriteAllBytes` với `Encoding.GetEncoding(1252)` để đảo ngược mojibake. Khi ghi log ra file, tránh `Tee-Object` (UTF-16 + console codepage) — dùng `> file.txt` hoặc `Out-File -Encoding utf8`.

## 8. Lưu ý môi trường

- Windows + PowerShell: tên biến **không phân biệt hoa thường** (`$h` và `$H` là cùng một biến — dùng tên biến khác nhau khi cần 2 biến).
- Đường dẫn dự án chứa dấu tiếng Việt (`Đ`, `ữ`...) — luôn quote đường dẫn trong shell.
- Port 3000 hay kẹt sau khi build production; kiểm tra process đang chiếm port trước khi `npm run dev` (dùng `Get-NetTCPConnection -LocalPort 3000`).
- **Bẫy webpack cache:** không chạy `npm run build` trong lúc dev server đang dùng chung `.next` → cache corrupt (thiếu `vendor-chunks/*`, chunk 404, hydration fail giết form login). Xử lý: kill process port 3000, xóa `.next`, chạy lại `npm run dev`.
- **PostgreSQL 17 cài native** trên máy dev (service `postgresql-x64-17`, KHÔNG phải Docker — `docker` không có trong PATH). User `postgres` / **pass `postgres`** / port 5432, database `gym_db` (*pass `postgrespassword` chỉ đúng cho Docker-compose — psql native thử pass này bị auth failed*).
- `backend/.env` đã tạo local (gitignore) — nếu mất: copy `.env.example` rồi đảm bảo `DATABASE_URL` dùng pass `postgres` (giống `backend/.env` hiện tại). Kiểm tra backend: `GET http://localhost:3001/api/health` → trả `database: "connected"`.

## 9. Trạng thái & việc dang dở

Chi tiết lịch sử, quyết định, QA workflow: **WORKLOG.md** (gốc dự án) — cập nhật gần nhất: 2026-09-29 (Kỳ 11 — check-in khuôn mặt FACE_ID, 3 đợt).

- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Check-in nhận diện khuôn mặt FACE_ID (Kỳ 11 — sinh trắc học 3 đợt)** — schema `FaceEmbedding` (vector `Float[]` **dim 1024** theo model `@vladmandic/human` + `consentAt` + `imageData` **có** lưu ảnh tham chiếu data URL ở mẫu đầu tiên, dùng để lễ tân đối chiếu mặt trước khi ghi lượt tập — cả vector lẫn ảnh đều là dữ liệu cá nhân nhạy cảm nên bắt buộc consent NĐ13/2023) + enum method `FACE_ID`; backend module `faces` (enroll bắt buộc consent / tự rút lui / admin view-delete, audit `FACE_ENROLL`+`FACE_DELETE`) + `POST /checkins/face` (1:1, `FACE_MATCH_THRESHOLD=0.6`, lệch → 400) + `POST /checkins/face-scan` (1:N lễ tân, `FACE_MATCH_THRESHOLD_1N=0.7`, trượt → 404) + reports `byMethod`; FE cài `@vladmandic/human@3.3.6` (model CDN, chạy 100% client-side) + `lib/face.ts` + `components/ui/face-scanner.tsx` (anti-spoof chặn mẫu `real<0.3`) + `/member/face-registration` (consent NĐ13) + tab Khuôn mặt ở `/member/checkin` + dialog Quét khuôn mặt 1:N ở `/admin/checkins` + card trạng thái/xoá ở `/admin/members/[id]` + KPI "Check-in theo hình thức" ở `/admin/reports/attendance` + tab Chuyên cần. **Bẫy mới (chi tiết trong WORKLOG Kỳ 11):** bản server phải alias ESM bundle (`next.config.mjs` + `src/types/human-esm.d.ts` — exports map không có subpath `./dist/*`), `human.webcam.start()` trả chuỗi `"webcam error: ..."` chứ KHÔNG ném exception, mass-checkout đổi CRLF → `format:check` fail (chạy `npm run format`), shell start:dev bị cancel nhưng node child giữ port 3001. QA: smoke API **36/36** + FE 5 check PASS (build **52 routes**) + browser **6 màn 0 console error**; **chưa test camera thật** (máy QA bị deny quyền camera) — cần user quét thử bằng webcam thật. Gộp chung với Kỳ 4–10 — đã push lên `origin/main`.

- **ĐÃ COMMIT + PUSH (2026-09-29):** giai đoạn **STEP 9 — Hoàn thiện & Chốt (Kỳ 10 + 10b)** — model `AuditLog` + module `audit-logs` (@Global, `log()` không bao giờ throw) + **34 action / 12 entity** gắn vào auth/member/membership/payment/checkin/trainer/schedule/equipment/maintenance/promotion; `AllExceptionsFilter` chuẩn hoá lỗi + map Prisma error; `helmet` + `@nestjs/throttler` (global 300/60s, login 10/60s, register 5/300s) + CORS allowlist; trang `/admin/audit-logs` (gate ADMIN/MANAGER, lọc + phân trang + dialog metadata) + sidebar + `AUDIT_*` meta; `app/not-found.tsx` + `app/error.tsx`; `app/icon.svg` (favicon); seed block 16.8 (41 dòng audit log, phủ đủ 34/34 action); `README.md` viết lại hoàn toàn. **Kỳ 10b**: dọn dữ liệu demo chọn lọc (11 hội viên, 12 payment, 11 hoá đơn khớp tiền, 68 check-in, 14 buổi tập, 48 thông báo, 41 audit log), bỏ marker `" (STEP 9 demo)"` khỏi tiêu đề hiển thị (chuyển sang `notes='seed-step9'`), sửa lỗi seed trùng mã hoá đơn `INV-2026-0002…0011` → dải `INV-2026-1001…1010`, `Input` thêm `min-w-0` (fix tràn ngang 768px), `knip` 0 code chết.
  **Nghiệm thu 2026-09-29:** typecheck · lint (0 warning) · format:check · build (49 routes) · knip **PASS**; BE `nest build` + `prisma validate` **PASS**; smoke API **77/77 PASS**; QA responsive **294/294 PASS** (6 viewport × 49 route: 0 overflow, 0 console error, 0 HTTP ≥400, 0 trang rỗng) + 3/3 kiểm tra riêng (404, gate STAFF, ràng buộc dữ liệu cá nhân). Gộp chung với Kỳ 4–10 (~205 files) — đã push lên `origin/main`.

- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Promotion + Notification + Reporting (STEP 8)** — backend promotions (CRUD/validate tự tính subtotal-discount-total/usage đếm qua Payment/stats/auto-expire) + notifications (bell 3 phía, list 2 phía, /announce theo role/SPECIFIC_BRANCH, ticker 6h, trigger checkin/equipment-BROKEN/payment) + reports hub `/admin/reports` 8 tab + lọc branch + CSV export (BOM), bonus badge promo `/packages` + áp mã trong register-membership; FE thêm `components/ui/tabs.tsx` + `components/charts/bar-chart.tsx` (KHÔNG package chart mới). đã typecheck+lint+format:check+build PASS (49 routes), smoke STEP 8 **30/30** + E2E promo **6/6 PASS**, QA Playwright **26 màn PASS** (1440/390, 0 console error, 0 overflow). Gộp chung với Kỳ 4–8 (~180 files) — đã push lên `origin/main`.

- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Payment + Invoice (STEP 6)** — PaymentGateway abstraction (CASH/BANK_TRANSFER thật, MOMO/VNPAY stub), Invoice (INV-2026-NNNNNN unique, DRAFT/ISSUED/PAID/CANCELLED), Payment + paidAt/confirmedById/confirmedAt/currency/transactionRef@unique, flow register/renew/confirm/refund (transaction, 409 trùng ref), admin `/admin/payments` (+`[id]`), member `/member/payments` (+`[id]` receipt + print), `/admin/reports/revenue` (chart custom không recharts), dashboard member "Thanh toán của bạn", register-membership bank info + transfer content `GYM <CODE> <PAYMENT>` + success dialog, roles (STAFF confirm chỉ CASH/BANK_TRANSFER). đã typecheck+lint+format:check+build PASS, smoke API **47/47 PASS**, QA Playwright 11 màn PASS (desktop 1440 + mobile 390, không overflow). Gộp chung với Kỳ 4–6 (~150 files) — đã push lên `origin/main`.

- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Trainer/PT + Lịch tập (STEP 5)** — backend modules trainers/schedules + member portal stats/trainer, schema `TrainerMember`/`TrainingProgress`/`SessionType`, frontend `/admin/trainers` (+`[id]`), `/admin/schedules`, `/member/schedule`, dashboard member "PT của bạn", trainer portal `/trainer` (+`/schedule`, `/members`, `/profile`) — đã typecheck+lint+format:check+build PASS, QA Playwright 16 màn PASS, role test PASS. Gộp chung với Kỳ 4 + Kỳ 5 (~125 files) — đã push lên `origin/main`.

- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Member Management + Membership + Payment flow thật** (PENDING → approve → ACTIVE/PAID) — 32 files (backend modules member/members/memberships/payments/packages/reports + schema/seed; frontend member pages + route `/member/register-membership/[packageId]` + 5 trang admin viết lại) — đã QA PASS (Playwright + API smoke test), đã push lên `origin/main`.
- **ĐÃ COMMIT + PUSH (2026-09-29):** tính năng **Check-in / Check-out / Attendance** — schema (`CheckIn` + `method`/`updatedAt`), backend modules checkins/reports (+3 endpoint), smoke test API 15/15 + QA Playwright PASS; frontend `/member/checkin`, `/member/checkins`, `/admin/checkins`, `/admin/reports/attendance`, dashboard KPI + HourlyBars, member detail tab Attendance, menu 2 phía. Gộp chung với feature membership ở trên (~34 files) — đã push lên `origin/main`.
- Bài tập đang là dữ liệu tĩnh `frontend/src/lib/programs.ts` — tôi chọn "tạm thời vậy"; muốn chuyển backend (model `Exercise` + admin CRUD) thì hỏi lại.
- 6 PR Dependabot chờ duyệt; cân nhắc upgrade Next 14 → 15/16 (5 lỗ audit).
- Nếu phiên chưa nạp `opencode.jsonc` + 4 lệnh slash → nhắc tôi restart OpenCode.
