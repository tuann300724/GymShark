# WORKLOG — Nhật ký làm việc GymShark

> Ghi lại **trạng thái, quyết định và việc dang dở** giữa các phiên làm việc với AI.
> Cập nhật mỗi khi kết thúc đợt làm việc. Hướng dẫn nhanh xem `AGENTS.md`.

---

## 2026-09-29 — Kỳ 11: Check-in nhận diện khuôn mặt (FACE_ID) — sinh trắc học 3 đợt

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4–10 + toàn bộ code faces — đã push lên `origin/main`.

### 🎯 Mục tiêu (hoàn thành 3/3 đợt)

- **Đợt 1** — hội viên tự quét 1:1: đăng ký khuôn mặt (consent NĐ13) + check-in bằng khuôn mặt.
- **Đợt 2** — lễ tân quét 1:N tại quầy: dialog quét → nhận diện → check-in cho hội viên.
- **Đợt 3** — anti-spoof + ngưỡng env + KPI báo cáo theo hình thức check-in.

### ✅ Backend (smoke API **36/36 PASS**, `nest build` PASS)

- Model `FaceEmbedding` (vector Float[192], `consentAt`, FK member cascade) + enum `CheckInMethod` thêm `FACE_ID`; đã `prisma db push` + regenerate client.
- Module `faces` (@Global): `POST /faces/enroll` (bắt buộc `consent: true`, thay toàn bộ mẫu cũ), `GET /faces/me`, `DELETE /faces/me` (tự rút lui), `GET/DELETE /faces/member/:memberId` (admin/manager).
- Check-in: `POST /checkins/face` (1:1 — `FACE_MATCH_THRESHOLD=0.6`, lệch → **400** tránh interceptor logout), `POST /checkins/face-scan` (1:N — `FACE_MATCH_THRESHOLD_1N=0.7`, không khớp → **404**), cosine tính server-side.
- Audit `FACE_ENROLL`/`FACE_DELETE` (action String, không sửa schema audit); **chỉ lưu vector, không lưu ảnh/video** (NĐ13/2023).
- Reports: `getAttendanceReport` thêm `byMethod` (checkIn.groupBy method) cho KPI.
- Smoke test API **36/36 PASS** (script `C:\Users\tuanv\AppData\Local\Temp\opencode\face-api-test.ps1`) — mọi validate 400/403/404/409 đều đúng; **đã dọn dữ liệu test** (xem dưới).

### ✅ Frontend (typecheck · lint 0 warning · format:check · knip · build **52 routes** — PASS)

- Cài `@vladmandic/human@3.3.6` (1 package đã đồng ý) — model tải từ CDN + cache IndexedDB, chạy 100% phía trình duyệt, chỉ gửi vector lên server.
- `lib/face.ts` (singleton + config: face detector/description bật, mesh/iris/emotion/body/hand tắt, `antispoof.enabled`, `ANTI_SPOOF_MIN=0.3` chặn bắt mẫu), `components/ui/face-scanner.tsx` (mode enroll/verify, ổn định 600ms, cooldown 900ms, 5 mẫu, gợi ý pose, chống-spoof), `services/face.service.ts` (5 API).
- `/member/face-registration` (mới): consent NĐ13 → quét 5 mẫu → đăng ký / đăng ký lại / xoá (dialog xác nhận).
- `/member/checkin`: tab **Thủ công | Khuôn mặt** (chưa đăng ký → CTA sang trang đăng ký; đã đăng ký → quét 1:1 + `faceCheckIn`, retry = remount `key=attempt`).
- `/admin/checkins`: nút **Quét khuôn mặt** + dialog 1:N (hiện tên/MÃ/độ khớp %, invalidate list), quét lại sau lỗi.
- `/admin/members/[id]` tab Lịch sử Check-in: card trạng thái khuôn mặt (số mẫu, consentAt, badge) + nút **Xoá đăng ký** (admin/manager, dialog xác nhận).
- `METHOD_META` FACE_ID ở 3 trang; `AUDIT_ACTION_META` thêm `FACE_ENROLL`/`FACE_DELETE`.
- KPI: card **Check-in theo hình thức** ở `/admin/reports/attendance` (số lượt + % + thanh tiến độ, FACE_ID tô neon) và card **Theo hình thức check-in** ở tab Chuyên cần `/admin/reports` (MethodBars, grid 3 cột).

### 🐞 Lỗi/bẫy mới (đã xử lý)

- **Build fail `@tensorflow/tfjs-node`**: gói `exports` của `@vladmandic/human` **không có subpath `./dist/*`** (các key `dist/*` là *condition*), condition `node` đứng đầu map → bản server resolve `human.node.js` (require tfjs-node chưa cài). Fix: alias trong `next.config.mjs` trỏ `@vladmandic/human/dist/human.esm.js` → `path.join(dirname(require.resolve('@vladmandic/human')), 'human.esm.js')` + `src/types/human-esm.d.ts` (shim type cho subpath) + guard `typeof window` trong `loadHuman`.
- **`human.webcam.start()` KHÔNG ném exception**: nội bộ catch rồi **trả chuỗi** — lỗi `"webcam error: ..."`, thành công `"webcam: <tên>"`. Không check return value → status kẹt "searching" với video chết khi bị từ chối camera. Fix: check prefix `webcam error` → throw → `cameraErrorMessage` match cả `err.message` (chứa `NotAllowedError`) → thanh trạng thái đỏ + toast. **Đã verify bằng trình duyệt**: chặn camera → hiển thị đúng "Bạn đã chặn quyền truy cập camera...".
- `<li className="flex gap-2.5">` với text thuần → text nodes thành flex items rời → vỡ cách chữ trong điều khoản NĐ13. Fix: bọc nội dung trong `<span>` (inline flow).
- **EOL CRLF hàng loạt**: 8:46 sáng có thao tác mass-checkout đổi ~77 file sang CRLF (autocrlf=true) trong khi `.prettierrc` đòi `endOfLine: "lf"` → `format:check` fail 77 file dù content không đổi. Fix: `npm run format` (chỉ đổi EOL + format file mới).
- **EADDRINUSE 3001 sau khi OpenCode restart**: shell `npm run start:dev` bị cancel nhưng node child sống mồ côi giữ port (PID cũ 9776, sau này 30380). Fix: kill PID listening 3001 rồi start lại; watch nest vẫn recompile (verify `byMethod` qua API thật).
- **Ảnh screenshot browser tool lag 1 navigation** (nội dung DOM qua innerText/snapshot vẫn đúng) — xác minh bằng snapshot/snapshot text; `fullPage` chụp fresh hơn. Bẫy hydration: sau navigate cần chờ ~2–4s (evaluate `setTimeout`) trước khi `check`/`click`, nếu không React handler chưa gắn (nút không đổi state).
- PowerShell 5.1: `>` redirect phá tiếng Việt (mojibake) — debug EOL/format phải đọc ghi qua Node/UTF-8, không qua shell.

### 🧹 Dọn dữ liệu test (psql `-f`, không `-c`)

- DELETE 2 check-in `method='FACE_ID'` + 4 notification `type='CHECKIN'` (tạo lúc smoke test 03:28 UTC); kiểm tra không đụng check-in thường (0 rows bị ảnh hưởng).
- `FaceEmbedding` về 0 (vector test không khớp mặt thật — để hội viên đăng ký lại bằng mặt thật; audit `FACE_ENROLL`=2 / `FACE_DELETE`=2 **giữ nguyên**).

### 📌 Nghiệm thu cuối (2026-09-29)

- FE: `typecheck` · `lint` (0 warning, kể cả warning cũ đã hết) · `format:check` · `knip` · `build` (52 routes) — **PASS cả 5**. Grep palette cũ = 0 (chỉ false-positive `translate-*`).
- BE: `nest build` PASS; smoke API 36/36; `GET /reports/attendance` trả `byMethod`.
- QA browser OpenCode **6 màn PASS, 0 console error**: face-registration (consent gate → scanner mount → camera-denied hiển thị lỗi đúng), member/checkin 2 tab + CTA, admin dialog quét 1:N, member detail card khuôn mặt (Chưa đăng ký), reports tab Chuyên cần (byMethod), reports/attendance KPI. Human 3.3.6 load thật (log `version: 3.3.6`, WebGPU adapter) trong QA.
- Lưu ý thực tế: máy/ browser QA không có camera (permission denied) → **check-in khuôn mặt thật cần user test bằng webcam thật**: đăng ký 5 mẫu ở `/member/face-registration` rồi quét ở tab Khuôn mặt.

---

## 2026-09-28 — Kỳ 10b: Dọn dữ liệu demo, fix overflow & dọn code chết

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4–10 (~205 files) — đã push lên `origin/main`.

### 🎯 Mục tiêu

Rà lại chất lượng dữ liệu demo (số liệu lệch nhau do QA/smoke cũ), dọn code chết (`knip`),
vá lỗi tràn ngang ở viewport 768px, và xoá 404 favicon ở mọi trang.

### 🐞 Lỗi thật tìm được

1. **Seed block 16.2 trùng mã hoá đơn** — dùng `INV-2026-0002…0011` **trùng** với block gốc
   (mục 8 đã chiếm `INV-2026-0001…0006`). `payment.findUnique(code)` thấy sẵn nên **bỏ qua âm thầm**,
   còn `invoice` vẫn tạo với `s.pkg.price` → **lệch tổng hoá đơn** (`INV-2026-0002` total 4.200.000
   vs payment 450.000). → Đổi sang dải tự sinh `INV-2026-1001…1010`.
2. **Số tiền lấy từ `s.pkg.price` thay vì thẻ thực tế** — tái chạy seed thẻ cũ thuộc gói khác → lệch.
   → Lấy `membership.finalAmount ?? price`; block 16.8 lookup payment theo `memberId` thay vì mã cứng.
3. **Tràn ngang ở 768px** — nguyên nhân gốc: `Input` bọc `<div>` và thẻ `<input>` đều thiếu `min-w-0`;
   `input type=date` có min-content ≈ 165px không co lại được trong grid/flex. → Thêm `min-w-0` vào
   `components/ui/input.tsx` (fix chung cho **mọi** form, không chỉ `/admin/audit-logs`).
4. **404 `/favicon.ico` ở mọi trang** → thêm `frontend/src/app/icon.svg` (favicon SVG neon theo brand).
5. **`via-ink/92`** — opacity không có trong scale Tailwind → gradient mất điểm giữa. → đổi `/90`.
6. **88 thông báo "Chương trình khuyến mãi mới 🔥" mồ côi** — QA Kỳ 8 tạo rồi xoá promotion, nhưng
   `Notification.referenceId` trỏ theo id nên thông báo còn treo. → `cleanup-smoke-artifacts.js` nay
   **gom id promotion TRƯỚC khi xoá** rồi dọn thông báo theo `referenceId`.
7. **21 thông báo "Test STEP 8"** còn trong danh sách thông báo của hội viên/nhân viên demo (announce
   của smoke test gửi cho mọi vai trò). → dọn theo `title contains 'Test STEP'`.

### 🧹 Dọn code chết (`knip` → 0)

- Xoá `frontend/src/services/schedule.service.ts` (không ai import).
- Xoá 5 type orphan: `BranchOverviewRow`, `AppNotification`, `TrainerStatus`,
  `MyTrainerResponse`, `MemberSchedule`.
- Bỏ `export` 15 type chỉ dùng nội bộ (`ADMIN_ROLES` trong `lib/auth.ts` chỉ còn `isAdminRole` dùng).
- Xoá `PROMOTION_DISCOUNT_TYPE_META`, `fetchActiveTrainers`, `sessionsByDate`.
- ⚠️ Regex greedy xoá nhầm `SessionType`/`ScheduleStatus`/`TrainerUser` → đã khôi phục (không export)
  trong `services/types.ts`.

### 🗃️ Dọn dữ liệu demo (chọn lọc, KHÔNG xoá sạch rồi seed lại)

- Xoá 3 user MEMBER orphan sinh từ QA (`flowtest@`, `qa1790393869041@`, `tuann@gmail.com`) + 27 thông báo.
- Xoá trainer `trainer1@gym.com` + bản ghi Trainer (phải xoá schedule trước vì `TrainingSchedule.trainerId`
  = `Restrict`).
- Mỗi hội viên giữ **membership tạo sớm nhất**, xoá phần còn lại (xoá `Payment`/`Invoice` trước vì
  `membershipId` là `SetNull`).
- Đồng bộ `Member.email` `MEM-0002/3/4` → `member2/3/4@gym.com` (bị ghi đè khi QA tạo account trùng).
- Bỏ marker `" (STEP 9 demo)"` khỏi **tiêu đề lịch** và mô tả bảo trì (dữ liệu demo nhìn ra giao diện
  phải sạch). Marker chuyển sang field **không hiển thị**: `TrainingSchedule.notes = 'seed-step9'`;
  bảo trì khoá idempotent bằng `(equipmentId, description)` vì model không có `notes`.

### 📌 Quy tắc nghiệm thu dữ liệu đã đặt (chạy lại seed phải giữ được)

- 1 thẻ tập = 1 đơn thanh toán = 1 hoá đơn; `Invoice.total` = `Payment.amount` (0 lệch).
- 0 hoá đơn mồ côi, 0 thẻ có >1 payment, 0 bản ghi bảo trì trùng.
- Audit log phủ **đủ 34/34 loại action** để trang `/admin/audit-logs` demo đủ sắc thái.

### 📊 Số liệu demo cuối cùng

| Bảng | Số lượng | Bảng | Số lượng |
| --- | ---: | --- | ---: |
| `user` | 17 | `trainingSchedule` | 14 |
| `member` | 11 | `trainer` | 3 |
| `membershipPackage` | 3 | `trainerMember` | 4 |
| `membership` | 11 | `trainingProgress` | 2 |
| `payment` | 12 (11 + 1 `FAILED`) | `equipment` | 5 |
| `invoice` | 11 | `equipmentMaintenance` | 3 |
| `checkIn` | 68 | `promotion` | 5 |
| `branch` | 3 | `room` | 5 |
| `notification` | 48 | `auditLog` | 41 |

### 🐞 Bẫy mới

1. **`GET /promotions` không nhận `?limit=`** → `forbidNonWhitelisted` trả **400**. Script QA phải
   fallback gọi trần khi gặp 400 có query string.
2. `Payment.invoice` là quan hệ **1-1** → không dùng `_count: { invoices }`; `Trainer` dùng
   `trainerMembers` (không có `_count.members`).
3. Đọc file log ghi bằng `Out-File -Encoding utf8` có **BOM** → phải cắt `0xFEFF` trước khi parse,
   và nội dung tiếng Việt vẫn hiện mojibake khi `read` (script ghi file tiếng Việt không hỏng DB).
4. `Payment.membershipId`/`Invoice.membershipId`/`Invoice.paymentId` = `SetNull`;
   `Notification.userId`/`memberId` = `Cascade`; `AuditLog.userId` = `SetNull` — thứ tự xoá phải đúng.
5. **Đừng đo nội dung trang bằng `waitForTimeout` cố định** — Next stream sau `domcontentloaded`
   nên đo lúc đó `textLen = 0` (đã báo FAIL giả 1 lần ở `/admin` 1280px). → `page.waitForFunction`
   chờ `innerText.length >= 40`. Ngoài ra bỏ qua `net::ERR_ABORTED` (Next huỷ prefetch RSC) và
   **host ngoài** (Google Maps embed bị chặn khi offline) khi đếm lỗi mạng.
6. **Assertion phải kiểm đúng bản chất, không kiểm chuỗi thô** — 2 lần smoke FAIL giả do script:
   - quét `/password|token/` trong JSON audit → trúng `{"method":"password"}` của AUTH_LOGIN
     (đó là *phương thức* đăng nhập) → đổi sang quét **tên khoá** + mẫu bcrypt `$2[aby]$`.
   - đòi `current membership` trả đúng thẻ vừa gia hạn → sai, vì gia hạn cố ý đặt
     `startDate = endDate gói cũ + 1 ngày` nên `current` vẫn trả gói đang chạy. → tách assertion
     theo nhánh đăng-ký / gia-hạn.
7. **Route `/member/payments/[id]` phải dùng ID của chính hội viên** khi QA bằng session MEMBER;
   dùng ID lấy từ token admin sẽ 404 (đúng — ràng buộc dữ liệu cá nhân) và báo "trang rỗng" giả.

### 📌 Nghiệm thu cuối (2026-09-29)

| Hạng mục | Kết quả |
| --- | --- |
| `frontend` typecheck | **PASS** |
| `frontend` lint (next/core-web-vitals + tailwindcss + jsx-a11y) | **PASS** — 0 cảnh báo |
| `frontend` format:check | **PASS** |
| `frontend` build | **PASS** — 49 routes |
| `frontend` knip | **0 code chết** |
| Quét palette cũ + opacity ngoài scale | **0 kết quả** |
| `backend` build (`nest build`) | **PASS** |
| `prisma validate` | **PASS** |
| Smoke API STEP 9 | **77/77 PASS** |
| QA responsive (6 viewport × 49 route) | **294/294 PASS** — 0 overflow, 0 console error, 0 HTTP ≥400, 0 trang rỗng |
| QA riêng (404 · gate STAFF · ràng buộc dữ liệu cá nhân) | **3/3 PASS** |
| Trang `/admin/audit-logs` | 20 dòng/khối, lọc `action`/`entity` + phân trang chạy, 0 lỗi JS ở 1440 & 375 |
| Bất biến dữ liệu demo | 0 hoá đơn lệch tiền · 0 hoá đơn mồ côi · 0 thẻ có >1 payment |

**Quy trình chạy lại được** (không reset DB):
`npm run prisma:seed` → `node cleanup-smoke-artifacts.js` → `npm run prisma:seed` → `node smoke-step9.js`
→ `node cleanup-smoke-artifacts.js` → `npm run prisma:seed` → `node qa-step9-sweep.js`.

---

## 2026-09-27 — Kỳ 10: Hoàn thiện & Chốt (STEP 9 — FINALIZATION)

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4–9 (~200 files tổng) — đã push lên `origin/main`.

### 🎯 Mục tiêu

Rà soát & hoàn thiện toàn hệ thống: **bảo mật**, **audit log**, **chất lượng dữ liệu**,
**responsive + a11y**, **hiệu năng backend**, **dữ liệu demo**, **tài liệu**, **kiểm thử**.

### ✅ Bảo mật

- **Schema**: thêm model `AuditLog` (userId SetNull, action, entity, entityId, metadata Json, ip,
  createdAt) + 5 index (`userId`, `action`, `entity`, `entityId`, `createdAt`).
- **`AuditService`** (`@Global`): `log()` **không bao giờ throw** (nuốt lỗi + log server) để audit
  không làm hỏng nghiệp vụ chính; luôn gọi **sau** guard/throw và **sau** `$transaction`.
- **34 hành động / 12 entity** (nguồn chuẩn: `AUDIT_ACTION_META` trong `lib/status.ts`):
  AUTH_LOGIN, PASSWORD_CHANGE, USER_CREATE,
  MEMBER_REGISTER/UPDATE/PROFILE_UPDATE, MEMBERSHIP_STATUS_CHANGE/EXTEND/REGISTER/RENEW,
  PAYMENT_CONFIRM/REJECT/REFUND, CHECK_IN/CHECK_OUT,
  TRAINER_CREATE/UPDATE/REMOVE, SCHEDULE_CREATE/UPDATE/CANCEL/COMPLETE/DELETE,
  EQUIPMENT_CREATE/UPDATE/STATUS_CHANGE/RETIRE, MAINTENANCE_CREATE/COMPLETE/CANCEL,
  PROMOTION_CREATE/UPDATE/ACTIVATE/DEACTIVATE.
- **`AllExceptionsFilter`**: chuẩn hoá `{ statusCode, message, error, path, timestamp }`, map lỗi
  Prisma sang thông báo tiếng Việt, **luôn** log chi tiết ở server, không rò rỉ stack trace.
- **`helmet`** (HSTS, nosniff, ẩn `X-Powered-By`) + **CORS allowlist** từ `CORS_ORIGIN`.
- **`@nestjs/throttler`**: toàn cục `[{ttl:60000, limit:300}]` qua `APP_GUARD`; `@Throttle` cho
  `POST /auth/login` (10/60s), `register` (5/300s), `member-register` (5/300s).
- `.env.example` chuẩn hoá (PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN,
  FRONTEND_URL); `.env` thật nằm trong `.gitignore`.
- Xác minh: JWT payload chỉ `{sub, email, role, iat, exp}`; không response nào chứa `passwordHash`.

### ✅ Trang nhật ký hệ thống `/admin/audit-logs`

- Backend `audit-logs/`: `GET /audit-logs` (ADMIN+MANAGER) trả
  `{ data, total, page, limit, totalPages, actions }`, lọc `userId / action / entity / from / to / search`.
  **Không** có `GET /:id` (FE dùng dialog metadata từ list — tránh endpoint thừa).
- Frontend: `services/audit-log.service.ts` + types `AuditLogItem`/`AuditLogsListResponse`;
  `lib/status.ts` thêm `AUDIT_ACTION_META` / `AUDIT_ENTITY_LABEL` / `AUDIT_ROLE_LABEL`;
  trang có StatCard + lọc (search/action/entity/from/to) + bảng + phân trang + dialog metadata +
  empty/loading/error + **gate `role === 'ADMIN' || 'MANAGER'`** (STAFF bị backend 403);
  sidebar thêm mục "Nhật ký hệ thống" trong section "Hệ thống" (icon `ScrollText`).

### ✅ Chất lượng dữ liệu demo

- Seed bổ sung block **16.8**: `AuditLog` demo (đủ **34 loại action**, rải theo ngày/giờ,
  `metadata` có `transactionRef`/`from→to`/`cost`…), idempotent (`chỉ tạo khi bảng còn trống`).
  *(Kỳ 10b nâng lên **41 dòng** — xem mục Kỳ 10b ở đầu file.)*
- Dữ liệu sau seed: 3 branch · 5 room · 3 gói tập · 3 HLV · 11 hội viên · 11 thẻ đa trạng thái ·
  11 hóa đơn + 1 giao dịch FAILED · **68 lượt check-in** · lịch tập + tiến trình · 5 thiết bị +
  lịch bảo trì · 5 mã khuyến mãi (ACTIVE + EXPIRED) · thông báo mẫu.

### ✅ Frontend

- `app/not-found.tsx` (404) + `app/error.tsx` (500) — không lộ thông tin kỹ thuật.
- Mọi trang có trạng thái **loading / empty / error**; 401 → về `/login`, 403 → thông báo phù hợp.
- Responsive đã quét ở **375 / 430 / 768 / 1280 / 1440 / 1920 px** — không tràn ngang.
- `README.md` **viết lại hoàn toàn**: tính năng, tech stack, quickstart, tài khoản demo,
  ma trận RBAC, cấu trúc, sơ đồ quan hệ, mục bảo mật, design system, lệnh kiểm thử,
  kết quả kiểm thử, hướng dẫn deploy, hạn chế & hướng phát triển.

### ✅ Kiểm thử

- **Smoke API `smoke-step9.js` → 76/76 PASS**: helmet headers · RBAC (401/403) · E2E
  "đăng ký hội viên mới → đăng ký gói → admin xác nhận thanh toán (có `transactionRef`) →
  check-in → check-in lần 2 bị chặn → check-out" · 25+ action audit · lọc `action`/`entity`/`from`/
  `search`/phân trang · STAFF 403 · ràng buộc dữ liệu cá nhân · validation DTO (400 tiếng Việt,
  enum sai, route sai 404) · **rate limit 429**.
- **QA giao diện `qa-step9-sweep.js`** — 38 route × 6 viewport, đăng nhập 1 lần/role rồi tái dùng
  `storageState` (tránh đụng throttle 10 lần/60s): kiểm tra overflow ngang, lỗi console, trang rỗng.
- FE `typecheck` / `lint` / `format:check` / `build` PASS; BE `build` + `prisma validate` PASS.

### 🐞 Bẫy gặp phải (đã xử lý)

1. **Throttle theo IP + route** → chạy smoke nhiều lần liên tiếp sẽ 429 chính endpoint cần test.
   → Đưa section rate-limit xuống **cuối** script; restart backend để xoá store in-memory;
   dùng email cố định + fallback `renew` để smoke **idempotent**.
2. `POST /member/memberships` nhận `paymentMethod` (không phải `method`) và chặn hội viên đang có
   gói `ACTIVE`/`PENDING` → 409 (đúng business rule, whitelist DTO chạy tốt).
3. `POST /training-sessions` mặc định `PERSONAL_TRAINING` nên **bắt buộc** `memberId` → phải gửi
   `type: 'GROUP_CLASS'`.
4. `/membership-packages` là endpoint **quản trị** (403 với MEMBER); website công khai dùng
   `GET /public/packages`.
5. PowerShell 5.1 `Get-Content`/`Set-Content` làm hỏng tiếng Việt (BOM + double-encoding cp1252).
   → Chỉ sửa file tiếng Việt bằng tool `write`/`edit`; nếu buộc phải dùng shell thì
   `[System.IO.File]::WriteAllBytes` + `Encoding.GetEncoding(1252)`.

### 📌 Kết quả

- `npm run typecheck` · `npm run lint` · `npm run format:check` · `npm run build` (FE) · `npm run build` (BE) — **PASS**
- Smoke STEP 9 **76/76 PASS** · QA responsive **38 route × 6 viewport, 0 console error, 0 overflow**
- ĐÃ COMMIT (2026-09-29): Kỳ 4–10 (~200 files) — đã push lên `origin/main`.

---

## 2026-09-27 — Kỳ 9: Promotion + Notification + Reporting (STEP 8)

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4–8 (~180 files tổng) — đã push lên `origin/main`.

### 🎯 Mục tiêu

- **Promotion**: mã khuyến mãi (PERCENTAGE/FIXED_AMOUNT, minOrderAmount, maxDiscount, usageLimit, perMemberLimit), đếm lượt dùng qua Payment (PENDING+PAID = giữ chỗ), tự hết hạn, áp mã ngay lúc đăng ký gói.
- **Notification**: bell chuông 3 phía (member/trainer/admin) + trang list 2 phía (member/trainer) + trang quản trị (lọc toàn hệ thống + gửi thông báo theo role/chi nhánh) + ticker tự đánh dấu quá hạn 6h + trigger tự động (check-in, equipment BROKEN, payment).
- **Reporting**: hub `/admin/reports` 8 tab (Tổng quan/Doanh thu/Chuyên cần/Hội viên/Gói tập/HLV/Thiết bị/Chi nhánh) + lọc chi nhánh toàn cục + **xuất CSV** (doanh thu/hội viên/chuyên cần/gói tập, BOM cho Excel). Giữ nguyên subroute `/admin/reports/revenue` + `/admin/reports/attendance`.
- Roles giữ chuẩn: report chỉ ADMIN/MANAGER/STAFF (TRAINER 403); MEMBER chỉ thao tác thông báo của chính mình; admin notifications: nút "Đánh dấu đã đọc" chỉ đánh dấu thông báo của chính admin.

### ✅ Backend (build PASS, smoke STEP 8 **30/30 PASS** + E2E promo **6/6 PASS**)

- Schema: `Promotion` (+ `PromotionUsage`), `Notification` (type string, referenceType+referenceId để dedupe, memberId/userId), db push + generate + seed (WELCOME10/FIXED500/ENDSOON7/SUMMER2026, idempotent).
- `promotions/` — CRUD (code unique, kích hoạt/ngừng), `/validate` (backend tự tính subtotal/discount/total; enfore perMemberLimit + usageLimit + minOrder + hạn dùng; code không tồn tại/chưa kích hoạt/hết lượt → message rõ), `/stats`, `/usage` (lọc method/status, thống kê paidUsage/discountTotal), `/auto-expire` (ticker), `GET /public/promotions` (chỉ ACTIVE trong hạn).
- `notifications/` — `/me|/me/unread|/read-all|/:id/read|/:id|/announce` + findAllAdmin (search/type/role/from/to/unread/limit≤200) + ticker 6h (CHECKIN/SESSION/PAYMENT/MAINTENANCE/... quá 6h → isRead) + triggers: check-in xong → thông báo, equipment BROKEN → alert, payment PAID/REFUNDED → thông báo.
- `member.service` — `calcPrice` + `discountAmount`; register/renew nhận `promotionCode`; hoàn tiền (refund) giảm usedCount; `PaymentStatus` import từ `@prisma/client`.
- `reports/` — `overview` (summary + revenue + attendance), `revenue` (byDay/byMonth/byMethod/byPackage/recentPayments), `members` (byStatus/growthByMonth/recent), `memberships` (byStatus/packagePopularity/byMonth), `trainers`, `attendance` (byDay/byHour 24/byWeekday/byBranch), `branches`, `equipment` (delegate), `export` CSV có BOM (`doanh-thu.csv`/`hoi-vien.csv`/`chuyen-can.csv`/`goi-tap.csv`).

### ✅ Frontend (typecheck + lint + format:check **PASS** + `npm run build` PASS 49 routes; grep palette cũ = 0)

- Foundation: `services/types.ts` (Promotion/Notification/Report types), `services/promotion.service.ts` (10 hàm), `services/notification.service.ts` (viết lại: `/me` + findAllAdmin), `services/report.service.ts` (8 report + `downloadCsv` blob), `lib/status.ts` (PROMOTION/NOTIFICATION/ANNOUNCEMENT_TARGET meta), `reportApi.revenue` mới.
- **`notification-bell.tsx`** (1 component chung, 3 header: member/admin/trainer — `queryKeyPrefix` riêng, badge từ `/me/unread`, dropdown 5 mục, link đúng theo role) + **`notification-list-view.tsx`** (chung cho `/member/notifications` + `/trainer/notifications`: tab all/unread/read + lọc type + đánh dấu đã đọc).
- `/admin/promotions` (rewrite: stats + lọc search/status + card grid + CRUD dialog đầy đủ + activate/deactivate) + **mới** `/admin/promotions/[id]` (info cards + bảng lịch sử dùng mã lọc method/status + footer discountTotal/paidUsage/totalUsage).
- `/admin/notifications` (rewrite: findaAllAdmin search/type/role + stats total/unread + unread highlight + list recipient (user.fullName.role | member.fullName(code)) + delete + markAllRead cho chính admin + dialog gửi thông báo với target role + SPECIFIC_BRANCH → select branch).
- **`components/ui/tabs.tsx`** (Tabs pill dark có count) + **`components/charts/bar-chart.tsx`** (BarChart dọc label+tooltip hover, MethodBars ngang, EmptyChart — **không cài package chart mới**).
- **`/admin/reports`** (rewrite tabbed 8 tab, lọc chi nhánh toàn cục, nút Xuất CSV từng tab qua `reportApi.downloadCsv`; tab Doanh thu có from/to + **gộp byPackage theo tên gói** (backend trả theo membership → tránh trùng key React), tab Thiết bị hiển thị alerts).
- Register-membership `[packageId]`: ô nhập mã + nút "Áp dụng" (Enter hỗ trợ) + banner lỗi + breakdown (Giá gốc/Giảm/Thành tiền) + tổng strikethrough + "Được giảm X".
- `/packages` (public): banner "Ưu đãi đang chạy" từ `promotionApi.getPublic` (chips code + mức giảm + hạn dùng).
- Fix trong QA: Dashboard member dùng API cũ `getMyNotifications` → `notificationApi.getMine({ limit: 4 })`.

### ✅ QA (Playwright `channel: chrome` — `pw/qa-step8.js`)

- **26 màn hình PASS, desktop 1440 + mobile 390, 0 console error, 0 overflow**: /packages (banner mã), promotions list + CRUD dialog + detail/usages (desktop + mobile), notifications admin (lọc + dialog gửi + SPECIFIC_BRANCH → select branch), bell dropdown 3 phía (link đúng /admin, /member, /trainer), reports hub đủ 8 tab + lọc branch, register-membership (mã sai → banner lỗi; SUMMER2026 → giảm 360.000, tổng 2.040.000 chính xác), trainer notifications + bell, admin/equipment recheck (hết runtime error).
- Smoke API: **30/30 PASS**; E2E promo **6/6 PASS** (validate ok/min-order reject/bad code/trainer 403; register-with-promotion; per-member chặn lần 2 chứng minh thực tế).
- **Bẫy test-state (không phải bug)**: member `member@gym.com` đã dùng WELCOME10 + FIXED500 hết lượt (perMemberLimit=1) → smoke "validate WELCOME10" và QA "FIXED500" giờ trả "đã dùng hết lượt"; QA đổi sang SUMMER2026 (không giới hạn, giảm 15%).

### 📌 Lưu ý

- `reportApi.revenue(...)` cần thiết cho tab Doanh thu (bổ sung sau khi viết hub); `EquipmentStatsReport`/`BranchOverviewReport` type sửa lại đúng shape backend (byStatus/byCondition Record + openingHours).
- byPackage trong `/reports/revenue` trả theo membership (nhiều hàng cùng tên gói) → hub gộp theo tên trước khi vẽ; MethodBars/BarChart dùng key `label-index` để tuyệt đối không trùng key.
- ĐÃ COMMIT (2026-09-29): Kỳ 4–9 (~180 files) — đã push lên `origin/main`.

---

## 2026-09-27 — Kỳ 8: Branch + Room + Equipment Management (STEP 7)

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4–7 (~170 files tổng) — đã push lên `origin/main`.

### 🎯 Mục tiêu

- Quản lý **chi nhánh** (CRUD + kích hoạt/ngừng hoạt động), **phòng tập theo branch** (mã room unique trong branch), **thiết bị + bảo trì (EquipmentMaintenance) + cảnh báo**, **room-conflict** khi tạo TrainingSession, **check-in theo branch** (membership GLOBAL vs giới hạn allowedBranches), **Trainer theo branch**, **validation TrainingSession** đầy đủ (branch ACTIVE, room AVAILABLE, không trùng thời gian/phòng/trainer/member), **dashboard + branch filter**.
- Backend **không trust** branchId/roomId/trainerId/memberId từ client; STAFF/chef scope theo `user.branchId` (STAFF branch A không đụng được branch B).
- Roles: ADMIN full; MANAGER quản branches/rooms/equipment/maintenance; STAFF xem branch mình + tạo maintenance; TRAINER view-only (scope branch mình); MEMBER xem branch/room/schedule qua `/public/branches`.

### ✅ Schema + DB (db push --accept-data-loss + generate + seed PASS; KHÔNG migrations)

- 3 branch seed (BR-BH01/TD01/Q101, ACTIVE); 5 room (BR-*-R01/R02); 5 equipment (EQ-RUN-01, EQ-BENCH-01, EQ-SQUAT-01, EQ-TD-CYCLE-01, EQ-TD-MAT-01); backfill STEP 7 idempotent trong seed.
- `Branch.status`/`Room.status` = String ('ACTIVE'/'INACTIVE'; room 'AVAILABLE'/'INACTIVE'/'MAINTENANCE'); Enum `EquipmentStatus` mở rộng (+OPERATIONAL/UNDER_MAINTENANCE legacy); `MaintenanceStatus` có CANCELLED; `EquipmentCondition`, `MaintenanceType`, `RoomType` (GYM_AREA/CARDIO/WEIGHT_AREA/GROUP_CLASS/PERSONAL_TRAINING/YOGA/OTHER).
- `Room.code String?` + `@@unique([branchId, code])`; `Equipment.serialNumber String? @unique`; `MembershipPackage.allowedBranches Json?` (null/[] = GLOBAL).

### ✅ Backend (build PASS, smoke API STEP 7 **32/32 PASS**)

- `branches/` — BranchesController + RoomsController `branches/:branchId/rooms`: CRUD + `/status` (INACTIVE chặn khi còn buổi SCHEDULED) + `/:id/stats` (roomCount/roomAvailable/equipmentCount/totalTrainers/checkInsToday/upcomingSessions/memberCount); delete chỉ khi không còn dữ liệu (members/checkIns/equipment/rooms/schedules/users).
- `equipment/` — CRUD (code unique, serialNumber unique; delete = soft RETIRED, chặn khi còn maintenance dở dang) + `/stats` + `/alerts` (overdue/upcoming/broken/warrantyExpiring) + `equipment-maintenance` GET/POST (SCHEDULED/IN_PROGRESS → equipment MAINTENANCE; hoàn tất → AVAILABLE hoặc BROKEN qua markBroken) + `/:id/complete` + `/:id/cancel`.
- `schedules/schedules.service.ts`: `checkRoomConflict` + `validateBranchActive` + `validateRoomAvailable` (chỉ AVAILABLE) + `assertTrainerBranch` (create/update).
- `checkins/`: `validateBranchForCheckIn` (allowedBranches null/[] = GLOBAL; khác rỗng phải chứa branchId; branch phải ACTIVE) + STAFF/TRAINER `staffCheckIn` buộc `targetBranchId === userBranchId` + member `checkIn(dto.branchId)`.
- `reports/`: `?branchId=` lọc mọi chỉ số summary/dashboard + GET `/reports/branches` (branch overview) + GET `/reports/equipment` (delegate EquipmentService).
- `trainers/` findAll filter `branchId`; `members/` `@Query('branchId')` → `where.branchId`.

### ✅ Frontend (typecheck + lint + format:check PASS, grep palette cũ = 0 — chỉ false-positive `translate-*`)

- `services/types.ts` + `lib/status.ts` (BRANCH/ROOM/ROOM_TYPE/EQUIPMENT_STATUS/CONDITION/CATEGORY/MAINTENANCE_STATUS/TYPE_META), `services/branch.service.ts` + `services/equipment.service.ts` (mới).
- `/admin/branches` rewrite (CRUD dialog, activate/deactivate, xóa chỉ khi không dữ liệu, link detail) + **mới** `/admin/branches/[id]` (header + 4 StatCard + 5 tabs: Tổng quan/Phòng tập CRUD/Thiết bị/Lịch tập/Hội viên).
- `/admin/equipment` rewrite (6 StatCard + 4 alert card + filter search/category/status/branch + bảng + pagination + CRUD dialog + maintenance dialog) + **mới** `/admin/equipment/[id]` (info grid + status actions + lịch sử bảo trì complete/cancel).
- `/admin/dashboard`: branch filter Select (query key `reports-dashboard`) + card "Tình Trạng Thiết Bị" + table "Tổng Quan Chi Nhánh" (`reports/branches`).
- `session-form-dialog.tsx`: chỉ chọn Room AVAILABLE (+ phòng đang sửa) + cảnh báo hết phòng trống.
- `/member/checkin`: chọn chi nhánh (Select từ `/public/branches`) khi chưa check-in + `services/checkin.service.ts` `checkIn(method, branchId?)`.

### ✅ QA (Playwright `channel: chrome` — `pw/qa-step7.js`)

- **18 màn hình PASS, desktop 1440 + mobile 390, không tràn ngang**: admin branches list/detail (5 tab), admin equipment list/detail (full), admin dashboard (+ branch-filtered), member checkin (chọn branch), member schedule; mobile: branches/equipment/branch-detail/equipment-detail/checkin.
- **0 console/page error** sau khi fix hydration: dashboard "Tổng Quan Chi Nhánh" dùng `<p>` chứa Badge `<div>` trong `<a>` → đổi `<p>`→`<div>` (3 warning lặp, khớp 3 branch).
- Smoke API **32/32**: branch CRUD + dup code 409 + deactivate block có SCHEDULED 400; room CRUD + dup 409; equipment stats/alerts/list/create + maintenance SCHEDULED → IN_PROGRESS (equipment MAINTENANCE) → complete (AVAILABLE); **room-conflict 409 chính xác** (trainer khác + cùng phòng + trùng giờ → message "Phòng đã có buổi tập trùng thời gian"); reports/branches + reports/equipment + summary/members `?branchId=`; member check-in TD (GLOBAL) OK / INACTIVE branch 400; **staff cross-branch 403**; trainer scope chỉ 1 branch.

### 📌 Lưu ý

- `GET /branches` không cho MEMBER → member checkin dùng `GET /public/branches`.
- Equipment delete = soft **RETIRED** (giữ lịch sử, không xóa thật) — dữ liệu test dọn bằng Prisma script khi cần.
- PowerShell 5.1: `@(Invoke-RestMethod ...)` có thể bọc JSON array thành 1 object → dùng plain assignment cho list APIs.
- ĐÃ COMMIT (2026-09-29): Kỳ 4–8 (~170 files) — đã push lên `origin/main`.

---

## 2026-09-26 — Kỳ 7: Payment + Invoice (STEP 6) — PaymentGateway abstraction, flow thanh toán thật, invoice, quản lý & xác nhận thanh toán, revenue report

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4 + 5 + 6 (~150 files tổng) — đã push lên `origin/main`.

### 🎯 Mục tiêu

- Thanh toán đăng ký/gia hạn: Member tạo yêu cầu (PENDING) → lễ tân/admin xác nhận → Payment PAID + Membership ACTIVE + Invoice PAID + notification (transaction, rollback khi fail).
- PaymentGateway abstraction: `CASH`/`BANK_TRANSFER` xử lý thật (manual confirm + bank info + transfer content `GYM <MEMBER_CODE> <PAYMENT_CODE>`), `MOMO`/`VNPAY` stub (`integrated:false` — tạo PENDING, admin/manager confirm được).
- Invoice mới (invoiceNumber `INV-2026-NNNNNN` unique, status DRAFT/ISSUED/PAID/CANCELLED), 1-1 với Payment (register/renew tạo ISSUED; confirm→PAID; reject/cancel/refund→CANCELLED).
- Payment mở rộng: `paidAt`, `confirmedById`, `confirmedAt`, `currency`, `transactionRef @unique` (confirm trùng ref → 409).
- Revenue report: hôm nay/tuần/tháng/năm, byDay/byMonth/byMethod/byPackage, hoàn tiền hạch toán riêng (KHÔNG tính doanh thu); giữ back-compat `totalTransactions` + `data`.
- Roles: ADMIN confirm/reject/refund/revenue; MANAGER xem+confirm/reject/revenue; STAFF xem+confirm **chỉ CASH/BANK_TRANSFER** (MOMO/VNPAY → 403 qua `manualConfirmation`); TRAINER không; MEMBER chỉ của mình.

### ✅ Backend (build PASS, smoke-test API **47/47 PASS** — `pw/qa-step6-payments.js`)

- `payments/`: `gateway/` (interface + cash.ts + bank-transfer.ts + momo.ts + vnpay.ts + registry), 5 DTO (confirm/reject/refund/list-query/member-create), `payments.service.ts` rewrite (findAll filters+search+status/method/package/date+stats, findOne, confirm/reject/cancel/refund, getBankInfo), `payments.controller.ts` (**route order**: GET bank-info, GET me, GET me/:id, POST me trước GET :id; POST confirm/reject/refund + back-compat PATCH approve/cancel), `bank-info.ts`.
- `invoices/`: module mới (GET /invoices, GET /invoices/me, GET /invoices/me/:id, GET /invoices/:id — resolve member từ userId, không lộ dữ liệu người khác).
- `member.service.ts`: Invoice trong tx register/renew/extend, `requestPayment` (renew=true → gia hạn), `getPayments`/`getPaymentDetail` (+bankInfo, invoice, confirmedBy), stats `paymentSummary`, BANK_INFO.
- `reports.service.ts`: `getRevenue` đầy đủ + `RevenueReportQueryDto` (from/to/method) + controller.
- Swagger tags Payments + Invoices (docs: `http://localhost:3001/api/docs`).

### ✅ Frontend (typecheck + lint + format:check + build PASS trên code cuối, grep palette cũ = 0)

- `types.ts` mở rộng (Payment/PaymentDetail/Invoice/AdminPaymentList/BankInfo/RevenueReport/MemberStats.paymentSummary), `services/payment.service.ts` đầy đủ, `lib/auth.ts` (đọc role từ localStorage `gym_user`).
- `/admin/payments` rewrite: 5 StatCard + filter search/status/method/package/date + bảng + phân trang + 3 dialog confirm/reject/refund (phân quyền UI theo role); **mới** `/admin/payments/[id]`: summary amount + thông tin giao dịch + bank info + hội viên + timeline + dialogs.
- `/member/payments` rewrite (stats tổng đã chi/chờ/đã thanh toán + bảng link) + **mới** `/member/payments/[id]` receipt với nút In (print CSS đảo trắng/đen, `@media print` chỉ hiện receipt).
- **Mới** `/admin/reports/revenue`: KPI (hôm nay/tuần/tháng/năm/tổng/refunded/pending) + filter từ-đến/method + chart cột custom (KHÔNG recharts) byDay/byMonth + MethodBars + byPackage + giao dịch gần đây; sidebar admin thêm "Báo cáo doanh thu" + link từ `/admin/reports`.
- Member dashboard: card "Thanh toán của bạn" (paymentSummary + quick actions Lịch sử/Gia hạn).
- `/member/register-membership/[packageId]`: chỉ bật CASH + BANK_TRANSFER (MOMO/VNPAY "Sắp ra mắt"), BANK_TRANSFER hiển thị bank info + nội dung chuyển khoản (lấy `me.member.code`), success dialog với payment.id → nút "Xem hóa đơn".
- **Fix phát hiện qua smoke test:** filter packages trang admin payments gọi sai endpoint `/packages` → đổi `/membership-packages`.

### ✅ QA (Playwright `channel: chrome` — `pw/qa-step6-ui.js`)

- 11 màn hình PASS, desktop 1440 + mobile 390 **không tràn ngang** (overflow check mọi trang): admin payments list/detail, admin revenue report, member dashboard (payment card), member payments list/receipt, register BANK_TRANSFER (bank info), mobile admin payments/revenue/member payments/receipt.
- Không console/page error (chỉ favicon 404 auto của Chrome — cosmetic, có sẵn từ trước, repo chưa có favicon).
- Smoke API 47/47: renew BANK_TRANSFER 201 + invoice ISSUED, confirm trùng transactionRef 409, confirm → PAID + paidAt + confirmedBy + invoice PAID + membership ACTIVE, member confirm 403, manager reject → CANCELLED, staff confirm MOMO 403 / admin confirm MOMO OK, manager refund 403 / admin refund → REFUNDED (không tính revenue, không có trong recentPayments), PATCH approve/cancel back-compat OK, member/trainer GET /payments 403, staff revenue 200 (spec), trainer revenue/invoices 403, invoices/me + /invoices + bank-info OK.

### 📌 Lưu ý

- POST confirm/reject/refund trả **201** (NestJS default) — frontend axios xử lý 2xx/3xx bình thường, không sao.
- Revenue fields serialized thành string (Prisma Decimal) — `formatCurrency` nhận string|number cùng lúc.
- Smoke test tạo ~5 payment/membership test cho member@gym.com (PENDING/PAID/CANCELLED/REFUNDED) — data dev, không ảnh hưởng production.
- ĐÃ COMMIT (2026-09-29): Kỳ 4 + 5 + 6 + 7 (~150 files) — đã push lên `origin/main`.

---

## 2026-09-26 — Kỳ 6: Trainer/PT + Lịch tập (STEP 5) — quản lý HLV, phân công HLV–Hội viên, training sessions, member/trainer portal

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** — gộp chung với Kỳ 4 + Kỳ 5 (~125 files tổng) — đã push lên `origin/main`.

### 🎯 Mục tiêu

Chạy thật toàn bộ luồng huấn luyện: admin quản lý HLV (CRUD + khóa/mở + phân công/ngừng phân công HLV–hội viên
với lịch sử), lập lịch buổi tập (single/PT/group) với đủ ràng buộc backend, member xem lịch + HLV của mình,
trainer có portal riêng (dashboard, lịch dạy, hội viên phụ trách, hồ sơ, hoàn thành buổi + ghi chú tiến trình).
Backend **tự validate mọi rule**, không tin frontend; DTO không nhận `role/trainerId` gian lận từ client
(giới hạn theo role + `@CurrentUser('id')`).

### ✅ Schema + DB (đã db push — KHÔNG mất data; backend đã stop trước khi push)

- Mới: model `TrainerMember {trainerId, memberId, status TrainerMemberStatus(ACTIVE/ENDED), startDate, endDate}` +
  `TrainingProgress {scheduleId, trainerId, note, performance, recommendation}`; enum `SessionType` gán lại cho
  `TrainingSchedule.type` (PERSONAL_TRAINING/GROUP_CLASS/FREE_TRAINING); thêm `branchId` cho lịch cũ + indexes.
- Seed idempotent: gán TrainerMember ACTIVE (Nguyễn Văn Thể ↔ Trần Minh Quân MEM-0001), type/branch cho lịch cũ,
  2 buổi COMPLETED + 1 bản ghi Progress cho MEM-0001.
- Rules enforced backend: `startTime < endTime`; không trùng giờ (trainer / member / room); trainer INACTIVE chặn
  tạo lịch; member phải ACTIVE; tạo lịch trong quá khứ chỉ ADMIN/MANAGER; hủy giữ record + `cancelNote`;
  PT cần assignment ACTIVE; 1 member chỉ 1 trainer ACTIVE (re-assign tái mở bản ghi cũ).

### ✅ Backend (build PASS, API smoke test PASS, role test PASS)

- `trainers` module: CRUD (POST/PATCH ADMIN+MANAGER, DELETE ADMIN = soft → user+trainer INACTIVE),
  route tĩnh `me` (MEMBER: HLV của mình) / `me/members` (TRAINER) / `me/profile` (TRAINER: hồ sơ + stats) trước `:id`;
  POST tạo kèm User role TRAINER + hash, trả `tempPassword` 1 lần; assignment qua `:id/members` (ACTIVE duy nhất).
- `schedules` module: `SchedulesController` (back-compat) + `TrainingSessionsController` + `TrainingProgressController`
  cùng Service — list/filter (từ/đến/status/type/trainer/member/branch), detail kèm progress, create/update/cancel/complete/progress.
- Member portal: `GET /member/stats` thêm `upcomingSessions/monthSessions/completedSessions/trainer`; mới `GET /member/trainer`;
  profile/getMe hỗ trợ TRAINER (`isTrainer: true`); `PUT /member/change-password` mở cho TRAINER.
- Login redirect: role TRAINER → `/trainer` (đã sửa `getRedirectPath`).

### ✅ Frontend (typecheck + lint + format:check + build PASS ×2, grep palette cũ = 0)

- Services: `services/types.ts` (Trainer/Session/Progress types), `trainer.service.ts` (+`myMembers`/`myProfile`),
  `training.service.ts` (list/detail/create/update/cancel/complete/progress/getMySessions/getTrainerMe), `lib/status.ts`
  (TRAINER/SESSION/ASSIGNMENT meta).
- Shared UI: `training-calendar.tsx` (day/week/month + CalendarToolbar), `session-detail-dialog.tsx` (canManage/canProgress/canComplete),
  `session-form-dialog.tsx`, `session-badges.tsx`, `trainer-form-dialog.tsx`.
- Admin: `/admin/trainers` rewrite (search/filter/table/CRUD/khóa-mở/pagination), mới `/admin/trainers/[id]`
  (4 tab + stats + AssignMemberDialog + unassign), `/admin/schedules` rewrite (calendar desktop + agenda mobile + filter),
  member detail thêm card "HLV phụ trách".
- Member: `/member/schedule` rewrite (calendar + today/upcoming/history + detail), dashboard thêm card "PT của bạn"
  + dùng `getMyUpcoming`/`myTrainer`.
- Trainer portal mới: `/trainer` (dashboard stats + buổi hôm nay/sắp tới/hội viên + hoàn thành buổi + ghi chú tiến trình),
  `/trainer/schedule`, `/trainer/members` (ACTIVE + lịch sử), `/trainer/profile` (+ đổi mật khẩu);
  guard + layout + header trainer riêng.

### ✅ QA (Playwright `channel: chrome` — `pw/qa-step5.js`)

- 16 màn hình PASS (hiển thị đúng element, detail dialog mở được): admin trainers list/detail/members-tab, admin schedules
  month/week/session-detail, member dashboard PT-card, member schedule + session detail, trainer dashboard/schedule/members/profile,
  mobile 390 (trainer dash + schedule) **không tràn ngang**.
- Diagnostic per-portal (fresh login/role): 0 response 4xx/5xx trên cả 3 portal (2 lỗi 403/404 trong run gộp là transient
  khi login chuyển đổi nhanh cùng context).
- API smoke: trainers=3, stats member (upcoming=2/month=4/completed=2), conflict 409 trùng giờ, cancel+note OK,
  complete-sau-cancel bị chặn, STAFF tạo lịch quá khứ 403, test session đã xóa (total=8).
- Role test: STAFF tạo trainer 403, TRAINER/MEMBER tạo session 403, TRAINER xóa trainer 403, MEMBER add progress 403,
  STAFF/ADMIN assign được (404 khi id ảo = qua guard), member `trainers/me` OK, trainer `me/profile` OK.

### 📌 Lưu ý

- ĐÃ COMMIT (2026-09-29): Kỳ 4 + Kỳ 5 + Kỳ 6 (~125 files) — đã push lên `origin/main`.
- TrainersService.create sinh `tempPassword = Trainer@123456` trả 1 lần; admin sau đó có thể để trainer tự đổi ở `/trainer/profile`.
- Program (bài tập) vẫn tĩnh `frontend/src/lib/programs.ts` — quyết định cũ của user vẫn giữ nguyên.

---

## 2026-09-26 — Kỳ 5: Check-in / Check-out / Attendance (member tự check-in, staff check-in, admin theo dõi, báo cáo chuyên cần)

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** (gộp chung với Kỳ 4 ~34 files) — đã push lên `origin/main`.

### 🎯 Mục tiêu

Hoàn thiện module point danh chạy thật qua API (không mock): member tự check-in/check-out,
lễ tân check-in hội viên theo `memberId`, admin xem **currently-inside** (live 20s) + lịch sử + 4 KPI,
báo cáo chuyên cần. **Backend tự validate toàn bộ**: member ACTIVE + có membership ACTIVE
(`startDate <= now <= endDate`) + không trùng phiên `CHECKED_IN`; KHÔNG tin dữ liệu frontend,
member chỉ thao tác dữ liệu của mình qua JWT (`@CurrentUser('id')`), DTO không nhận `memberId` từ client.

### ✅ Schema + DB (đã db push — KHÔNG mất data)

- Reuse model `CheckIn` có sẵn + thêm: enum `CheckInMethod {MANUAL, QR_CODE, STAFF}`,
  field `method CheckInMethod @default(MANUAL)`, `updatedAt DateTime @updatedAt`, `@@index([status])`.
- `prisma db push` không tự thêm column required `updatedAt` (bảng có 4 rows) → chạy SQL tay
  `ALTER TABLE "CheckIn" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`
  rồi `db push` + `generate` OK (data giữ nguyên).
- Seed: check-in createMany thêm `method` + 1 lượt "hôm nay" CHECKED_OUT (8:15→9:55) cho MEM-0001
  (chỉ tạo khi count=0 — với DB dev đã có data thì dùng dữ liệu sẵn có).

### ✅ Backend (build PASS, smoke-test API 15/15 PASS)

- `checkins` module viết lại toàn diện (`dto/checkin.dto.ts` + service + controller):
  - Mở `POST /checkins` (MEMBER/TRAINER tự check-in), `POST /checkins/checkout`,
    `GET /checkins/me/current` (`{checkedIn:false}` / `{checkedIn:true, checkInAt, sinceMinutes, branch}`),
    `GET /checkins/me/history` (+ `stats:{total,month,week,avgDuration}`).
  - `POST /checkins/staff` (ADMIN/MANAGER/STAFF, theo `memberId`), `POST /checkins/:id/checkout`,
    `GET /checkins/currently-inside`, `GET /checkins` (search/status/branchId/from-to/sort/page).
  - Message lỗi tiếng Việt chuẩn (#14): "Gói tập của bạn đã hết hạn...", "Bạn chưa có gói tập đang hoạt động.",
    "Bạn đang trong phòng gym.", "Tài khoản của bạn đang bị tạm khóa.", "Không tìm thấy phiên tập đang hoạt động.".
  - `syncExpiredMemberships` chạy nền đóng thẻ ACTIVE quá hạn; Trainer KHÔNG check-out người khác (403),
    Trainer chỉ xem attendance.
- `reports`: + `todayCheckOuts`/`currentlyInside` vào `getSummary`; endpoint mới
  `GET /reports/checkins/daily` (data theo ngày + summary), `GET /reports/checkins/hourly` (24 bucket + peakHour),
  `GET /reports/checkins/members` (chuyên cần theo hội viên: totalVisits/avgDuration/lastVisit).
- `members.findOne` + `attendanceStats {totalVisits, lastVisit, avgDuration}` cho tab Attendance.
- Smoke test 15/15: member check-in → duplicate 400 "Bạn đang trong phòng gym." → current=true →
  checkout → checkout lần 2 400 → history stats → staff check-in → admin checkout theo id →
  trainer staff check-in **403** → member currently-inside **403** → daily/hourly/members/dashboard ✓.

### ✅ Frontend (typecheck + lint + format:check + build PASS, grep palette cũ = 0)

- `types.ts` + `checkin.service.ts`: 11 hàm API (getMyCheckins giữ signature, URL → `/checkins/me/history`);
  `utils.ts` + `formatTime` + `formatDuration` ("1h45m" / "45p").
- **Mới `/member/checkin`**: nút CHECK-IN lớn → toast → trạng thái "Đang tập" + timer HH:MM:SS live
  (1s) + giờ vào + chi nhánh → nút CHECK-OUT; refetch 30s; badge TRONG PHÒNG GYM.
- `/member` dashboard: card "Điểm danh hôm nay" (chưa check-in / đang tập + check-out nhanh, viền neon khi đang tập).
- `/member/checkins`: 4 stats (total/month/week/avg), filter `<input type="month">`, cột Thời lượng + Hình thức
  (Tự check-in / Quét QR / Lễ tân), phân trang.
- `/admin/checkins` viết lại: 4 KPI (Check-in hôm nay / Đang Trong Phòng / Check-out hôm nay / Giờ Cao Điểm),
  list currently-inside (live 20s, avatar, gói tập, check-out từng người), lịch sử (search/status/branch/date/sort),
  dialog staff check-in (search member → check-in).
- **Mới `/admin/reports/attendance`**: range ngày + search, 4 KPI, bảng daily (chênh lệch đang ở lại), bảng chuyên cần.
- `/admin/dashboard`: **fix endpoint hỏng `/admin/checkins` → `/checkins`**, quick check-in qua `/members?search` + `/checkins/staff`,
  hàng KPI mới (Đang Trong Phòng / Check-out hôm nay) + biểu đồ cột "Check-in theo giờ" (HourlyBars).
- `/admin/members/[id]` tab Attendance: 3 stats + cột Vào/Ra/Thời lượng/Hình thức/Trạng thái thật.
- Menu: member-header + item "Check-in" → `/member/checkin`; admin-sidebar + "Báo cáo chuyên cần".

### ✅ QA (Playwright `channel: chrome` — `pw/qa-checkin-flow.js`)

- Flow member: dashboard card → `/member/checkin` → check-in toast "CHECK-IN THÀNH CÔNG" + "Đang tập" + timer chạy →
  check-out → quay lại "Bạn chưa check-in" ✓; `/member/checkins` đủ cột + filter tháng ✓.
- Flow admin: dashboard snapshot + chart giờ ✓; `/admin/checkins` 4 KPI + list inside + dialog tìm "MEM-0001" ✓;
  `/admin/reports/attendance` bảng daily + chuyên cần ✓; member detail tab Attendance 3 stats ✓.
- Mobile 390px: `/member/checkin` (2 trạng thái) không tràn ngang ✓; drawer có mục Check-in ✓.
- Screenshots: `C:\Users\USER\AppData\Local\Temp\opencode\shots\` (prefix `qa-*`).

### 📌 Lưu ý môi trường (phát hiện kỳ này)

- **Bẫy webpack cache**: chạy `npm run build` trong lúc dev server đang dùng chung `.next` → cache corrupt
  (thiếu `vendor-chunks/*`, chunk 404, login form chết vì hydration fail). Xử lý: kill hết process port 3000,
  `Remove-Item -Recurse .next`, `npm run dev` lại. **Không build/destroy `.next` khi dev đang chạy.**
- Trang `/login` có ảnh nền `absolute inset-0` chặn pointer-events nút submit khi CDP hit-test
  (QA phải submit qua `el.evaluate(click)`); Enter trong input tạo GET submit native (không phải lỗi của kỳ này).

---

## 2026-09-26 — Kỳ 4: Member Management + Membership + Payment flow THẬT (PENDING → approve)

> Trạng thái: **ĐÃ COMMIT (2026-09-29)** (32 files: 15 backend + 17 frontend) — đã push lên `origin/main`.

### 🎯 Mục tiêu

Hoàn thiện flow đăng ký/thu phí chạy thật với PostgreSQL qua API (không mock):
đăng ký gói → **Membership PENDING + Payment PENDING** → admin **approve** → **PAID/ACTIVE**
(transaction); có hủy / tạm khóa / gia hạn; **backend tự tính giá** từ DB (`original − discount = finalAmount`),
không tin frontend; DTO không nhận `memberId/price/amount/role` từ client.

### ✅ Schema + DB (đã làm, DB đã recreate + reseed)

- `MembershipStatus` thêm `SUSPENDED`; `PaymentStatus` đổi `COMPLETED → PAID` + thêm `CANCELLED`;
  Membership thêm `discountAmount` + `finalAmount`; Payment default `PENDING`.
- `prisma db push --accept-data-loss` fail vì enum cast → **drop + recreate `gym_db`**
  (`prisma db execute` nối DB `postgres`, pass `postgrespassword`) → push → seed OK.
- **LƯU Ý:** `backend/.env` dùng pass **`postgrespassword`** (khác AGENTS.md mục 8 đang ghi `postgres` — đã sửa ở mục docs bên dưới phần AGENTS.md).
- Seed: `SUMMER2026` (15% PERCENTAGE) — trong QA đã cập nhật `endDate → 2027-12-31` trong DB dev để test luồng giảm giá.
- Demo users cũ giữ nguyên: `admin|manager|staff|trainer@gym.com` + `member@gym.com` (1 membership ACTIVE + payment PAID).

### ✅ Backend (build PASS, smoke-test API toàn bộ PASS)

- `member.service.ts`: `syncExpiredMemberships`, `calcPrice` (promotionCode: ACTIVE + trong hiệu lực + usageLimit + minOrderValue, giới hạn maxDiscount), register/renew → **PENDING** + Notification trong transaction, chặn trùng (409), renew tạo bản ghi mới từ `endDate+1` (không overlap), `getMemberships` trả thêm `pending`, `getStats` trả `pendingMembership`.
- Admin modules (đều có guard Roles ADMIN/MANAGER/STAFF):
  - `packages`: CRUD full, tự sinh `code`, chặn xóa gói đã bán.
  - `members`: `findAll` search/status/membershipStatus/packageId/sort/pagination `{data,total,page,limit}` + `PATCH /:id` (đồng bộ `user.status` + notify).
  - `memberships`: `PATCH /:id/status` (SUSPENDED/ACTIVE/CANCELLED, hủy kèm payment PENDING → CANCELLED) + `PATCH /:id/extend` (tạo Payment PENDING).
  - `payments`: `PATCH /:id/approve` (Payment PAID + Membership ACTIVE + notify + `promotion.usedCount++`) + `PATCH /:id/cancel`.
  - `reports`: `getSummary` (activeMembers/expiredMembers/pendingMemberships/pendingPayments/revenueThisMonth/newMembersThisMonth) + `getDashboard` (stats + recentRegistrations + pendingPayments).
- Smoke test thực (Invoke-RestMethod): register member mới → mua gói = PENDING + Payment PENDING → approve → ACTIVE/PAID → duplicate 409 → suspend/reactivate member → extend membership → trainer gọi approve = **403** ✓.

### ✅ Frontend (typecheck + lint + format:check + build PASS, grep palette cũ = 0)

- `types.ts`: Membership thêm SUSPENDED + discountAmount/finalAmount; MemberStats thêm pendingMembership; PaymentStatus union mới.
- `lib/status.ts` (mới): `MEMBERSHIP_STATUS_META` / `PAYMENT_STATUS_META` / `MEMBER_STATUS_META` / `PAYMENT_METHOD_LABEL` dùng chung.
- `membership.service.ts`: register/renew nhận `promotionCode`, trả `pending` trong list.
- Member: dashboard (banner PENDING + empty state "chưa có gói"), `membership` page (card PENDING + badges chuẩn + message gia hạn "chờ xác nhận"), register cũ (message mới), **route mới `/member/register-membership/[packageId]`** (CASH/BANK_TRANSFER/CARD→CREDIT_CARD/E_WALLET→MOMO + input mã giảm giá), link `/packages` trỏ route mới.
- Admin: `members` (search/filter/sort/pagination + edit dialog + khóa/kích hoạt), `members/[id]` (badges chuẩn + actions + approve nhanh + edit dialog), `membership-packages` (CRUD dialog + features items + xóa/ngừng bán), `memberships` (Xác nhận/Hủy/Tạm khóa/Kích hoạt lại/Gia hạn dialog), `payments` (approve/cancel + chi tiết + promotion tag), `dashboard` (8 KPI + recentRegistrations + pendingPayments).

### ✅ QA (Playwright `channel: chrome` — script tại `C:\Users\USER\AppData\Local\Temp\opencode\pw\`)

- Flow member: register → login → dashboard empty state → `/packages` → route mới → mã KM sai = toast "Mã khuyến mãi không hợp lệ" → `SUMMER2026` + Chuyển khoản → success → PENDING card + badge "Chờ thanh toán" ✓
- Flow admin: dashboard (8 KPI render) → memberships Xác nhận → ACTIVE → payments **382.500đ (450k − 15%)** PAID → members search "QA" + detail → member dashboard ACTIVE ✓
- Mobile 390px: 8 trang admin/member/register-membership **không tràn ngang** ✓
- Screenshots: `C:\Users\USER\AppData\Local\Temp\opencode\shots\` (prefix `qa-*`, `*-m390-*`).

### 📌 Ghi chú môi trường (đã xác minh kỳ này)

- `format:check` fail cả repo vì **CRLF working tree** (`core.autocrlf=true`) vs `.prettierrc` `endOfLine: "lf"` → đã chạy `npm run format`; **git-visible diff KHÔNG tăng** (27 files content + 5 untracked — stat-cache M giả của các file chỉ khác mtime, `git diff` = CLEAN).
- `git status` có thể hiển thị ~70 file `M` giả do mtime; `git add` re-hash và chỉ stage file thay đổi thật.

---

## 2026-09-25 — Kỳ 3: Backend lên + Trang chi tiết chương trình tập

### ✅ Đã hoàn thành & push (origin/main = `3478804`)

- Toàn bộ P0+P1 tooling (7 commit): ESLint/Prettier/EditorConfig, `AGENTS.md`, `opencode.jsonc`,
  lệnh `/check` `/ui` `/shot` `/commit`, bundle-analyzer, knip, CI (Node 24 + actions v5), Dependabot.
- Fix overlay search + drawer admin bị gói trong header `backdrop-blur` → portal ra `document.body`.
- Nút "Quay lại trang chủ" ở trang `/login` và `/register` (commit `3478804`).

### ✅ Backend đã dựng lại trên máy này (info quan trọng)

- **PostgreSQL 17 cài NATIVE** (service `postgresql-x64-17`) — KHÔNG phải Docker, `docker` không có trong PATH.
  User/pass: `postgres` / `postgres`, port 5432.
- `backend/.env` đã tạo (copy `.env.example` nhưng `DATABASE_URL` đổi mật khẩu thành `postgres`).
  File này gitignore — nếu mất thì tạo lại theo trên.
- **Dự án dùng `prisma db push`, KHÔNG có thư mục `prisma/migrations`** — đừng chạy `prisma migrate dev`.
- Đã tạo DB `gym_db` + push schema + seed thành công. Cách làm lại từ đầu:

  ```powershell
  cd backend
  # tạo DB (chạy 1 lần): $env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres?schema=public'; 'CREATE DATABASE gym_db;' | npx prisma db execute --stdin --schema prisma/schema.prisma
  npx prisma db push     # sync schema + generate client
  npm run prisma:seed    # seed dữ liệu mẫu
  npm run start:dev      # chạy backend :3001
  ```

- Kiểm tra backend sống: `GET http://localhost:3001/api/health` → phải trả `database: "connected"`.
  Swagger: `http://localhost:3001/api/docs` (49 endpoint).
- Tài khoản seed (mật khẩu pattern `Tên@123456`): `admin@` `manager@` `staff@` `trainer@` `member@gym.com`
  → chi tiết xem `backend/prisma/seed.ts`.

### ✅ Tính năng: Trang chi tiết chương trình tập — **ĐÃ COMMIT (2026-09-29)**

> 3 file đã commit trong `4bbbbcc` (feat(frontend): thêm trang chi tiết chương trình tập `/programs/[slug]`):

- `frontend/src/lib/programs.ts` **(mới)** — dữ liệu 6 chương trình (slug `push-day`, `pull-day`,
  `shoulder-blast`, `leg-day`, `upper-power`, `back-arms`), mỗi buổi 4-5 bài tập: tên VN + tiếng Anh,
  hiệp × lần, nghỉ, dụng cụ, mẹo kỹ thuật.
- `frontend/src/app/(public)/programs/[slug]/page.tsx` **(mới)** — trang chi tiết (hero, ảnh,
  danh sách bài tập đánh số, CTA buổi tiếp theo, `generateMetadata` + `generateStaticParams`).
- `frontend/src/app/(public)/programs/[slug]/not-found.tsx` **(mới)** — 404 có giao diện.
- `frontend/src/components/home/programs.tsx` — 6 card trang chủ giờ là `Link` → `/programs/[slug]`.

QA đã PASS (Playwright): 6 card link đúng, click → chi tiết đúng số bài (4/5/5), CTA sang
buổi kế, quay lại `/#programs`, slug sai → 404 + UI, mobile 390px không tràn, 0 lỗi console;
`typecheck` + `lint` (3 warning quen biết) + `format:check` PASS.

### 📌 Quyết định của user

- **Bài tập "tạm thời" để dạng tĩnh ở frontend** (không vào backend). Ý tưởng sau này nếu muốn:
  model Prisma `Exercise` + API public/admin + trang admin CRUD + frontend gọi API thay import file.
- Không push khi chưa đồng ý (mọi lần push đều hỏi riêng).

### 🛠 QA workflow (browser tools OpenCode đang disconnected)

- Script Playwright cũ/new ở `C:\Users\tuanv\AppData\Local\Temp\opencode\pw\`
  (chạy: `node <script>.js` từ chính thư mục đó; browser `channel: 'chrome'`).
- Ảnh chụp ở `C:\Users\tuanv\AppData\Local\Temp\opencode\shots\`.
- **Bẫy:** trang dùng component `Reveal` (IntersectionObserver) → trước khi chụp `fullPage`
  PHẢI scroll hết trang, nếu không ra ảnh trống. Xem `qa-programs-final.js` làm mẫu.

### ⏳ Việc cần làm tiếp (khi dậy)

1. User test quét khuôn mặt thật bằng webcam: đăng ký 5 mẫu ở `/member/face-registration` rồi quét ở tab Khuôn mặt `/member/checkin` (máy QA bị deny quyền camera nên chưa test được end-to-end).
2. Duyệt 6 PR Dependabot đã mở.
3. Restart phiên OpenCode để `opencode.jsonc` + 4 lệnh slash có hiệu lực; `/mcps` đăng nhập GitHub MCP.
4. Cân nhắc upgrade Next 14 → 15/16 (5 lỗ audit chỉ fix bằng Next 16).
