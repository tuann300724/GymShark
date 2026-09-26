# WORKLOG — Nhật ký làm việc GymShark

> Ghi lại **trạng thái, quyết định và việc dang dở** giữa các phiên làm việc với AI.
> Cập nhật mỗi khi kết thúc đợt làm việc. Hướng dẫn nhanh xem `AGENTS.md`.

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

### ✅ Tính năng: Trang chi tiết chương trình tập — **CHƯA COMMIT**

> 3 file thay đổi đang nằm trong working tree, chờ user đồng ý rồi `/commit`:

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

1. **Commit + push** tính năng `/programs/[slug]` (3 file) — hỏi user trước.
2. Duyệt 6 PR Dependabot đã mở.
3. Restart phiên OpenCode để `opencode.jsonc` + 4 lệnh slash có hiệu lực; `/mcps` đăng nhập GitHub MCP.
4. Cân nhắc upgrade Next 14 → 15/16 (5 lỗ audit chỉ fix bằng Next 16).
5. (Tùy chọn) P2: viết lại README theo cấu trúc mới.
