# Bài diễn thuyết — Đồ án tốt nghiệp: Hệ thống quản lý phòng tập Gym (GymShark)

> Dành cho buổi bảo vệ / trình bày trước hội đồng. Thời lượng ~12–15 phút.
> Ngôn ngữ: tiếng Việt. Cấu trúc: Mở đầu → Vấn đề → Giải pháp → Kiến trúc → Tính năng → Demo → Kết luận.

---

## 1. MỞ ĐẦU — Tại sao cần hệ thống này? (1 phút)

"Chào thầy/cô và các bạn. Tôi tên [Tên sinh viên]. Đồ án tôi làm là một hệ thống quản lý phòng tập gym toàn diện — từ kiểm tra vào, thanh toán, thực đơn dinh dưỡng, đến nhận diện khuôn mặt — tất cả trên một nền tảng web duy nhất.

Ngày nay, các phòng tập thông thường vẫn dùng sổ sách giấy hoặc phần mềm rời rạc: phần mềm quản lý hội viên riêng, phần mềm thanh toán riêng, phần mềm lịch tập riêng. Điều này tạo ra dữ liệu phân mảnh, khó tổng hợp báo cáo, và trải nghiệm hội viên không liền mạch. Tôi muốn xây dựng một hệ thống **một cửa** — nơi HLV và hội viên tương tác trực tiếp qua chat, nơi dữ liệu thực menu — thanh toán — attendance — báo cáo — đều liên thông."

**Slide đề xuất:** Ảnh phòng gym tối, điện ảnh + tiêu đề "GymShark — Quản lý phòng tập thông minh".

---

## 2. VẤN ĐỀ & YÊU CẦU (1,5 phút)

"Yêu cầu từ thực tế:

- Hội viên cần đăng ký gói tập, thanh toán, xem thực đơn do HLV gửi, và tự check-in.
- HLV cần quản lý danh sách hội viên, lên lịch tập, tạo thực đơn, xác nhận thanh toán, và xem báo cáo chuyên cần.
- Quản trị cần theo dõi doanh thu, số lượng check-in, trạng thái thành viên, và audit mọi hành động.

Những yêu cầu này đòi hỏi một kiến trúc **full-stack** ổn định: backend xử lý nghiệp vụ phức tạp (transaction thanh toán, phân quyền, audit log), frontend đẹp, responsive, và dữ liệu lưu trữ an toàn." 

---

## 3. GIẢI PHÁP — Kiến trúc hệ thống (2 phút)

"Tôi chọn kiến trúc **client-server chuẩn**:

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS v3. Đây là công nghệ hiện đại, cho phép server-side rendering (SEO tốt) và hydration mượt.
- **Backend**: NestJS (Nest + Prisma + PostgreSQL 17 native). Nest cung cấp module hóa rõ ràng; Prisma giúp truy vấn an toàn, không cần viết SQL thô; PostgreSQL 17 đảm bảo tính nhất quán dữ liệu.
- **Giao tiếp**: REST qua Axios ở frontend, tự động gắn JWT; backend có `AllExceptionsFilter`, `helmet`, `throttler`, và CORS allowlist.
- **Realtime**: Chat hội viên ↔ HLV qua Socket.IO (chat module), không phải polling — tin nhắn thực đơn, thông báo, tin nhắn cá nhân đều đồng bộ ngay.

**Sơ đồ kiến trúc đơn giản:**
- Client (Next) → API Gateway (Nest) → PostgreSQL
- Chat Socket → Gateway → DB + broadcast
- File/ảnh → `public/images/` + `next/image`

---

## 4. CÔNG NGHỆ & THIẾT KẾ (1,5 phút)

"Về thiết kế, tôi tuân theo một bảng màu duy nhất từ `DESIGN_SYSTEM.md`:
- Nền tối: `#0B0D0F`; nền sáng: `#F2F4F0`
- Neon accent: `#B7FF00` — chỉ dùng cho nút, số liệu, indicator; không bao giờ tô nền lớn, không gradient neon.
- Font: **Barlow Condensed** cho tiêu đề + **Be Vietnam Pro** cho nội dung.
- Icon: `lucide-react`. Animation: `Reveal` (IntersectionObserver, tôn trọng `prefers-reduced-motion`).
- Theme sáng/tối: lưu `localStorage gym_theme`; token màu là CSS variables (`:root` / `.dark` trong `globals.css`), không viết class `dark:` thủ công.

Điều này đảm bảo UI đồng nhất, dễ duy trì, và không bị lỗi palette cũ (emerald/teal/slate/rose/white)."

---

## 5. CÁC TÍNH NĂNG CHÍNH (4 phút — chia thành nhóm)

### 5.1. Quản lý hội viên & Gói tập
- Đăng ký → `PENDING` → HLV phê duyệt → `ACTIVE`/`PAID`.
- Thành viên có `TrainerMember` (quan hệ HLV phụ trách) — chỉ HLV đúng mới tạo/sửa thực đơn cho họ.
- Đăng ký thành viên qua `/member/register-membership/[packageId]`; thanh toán qua `CASH` / `BANK_TRANSFER` / `MOMO` (stub) + hóa đơn `INV-2026-XXXXXX`.

### 5.2. Check-in / Attendance + Nhận diện khuôn mặt (Kỳ 11 — nổi bật)
- Schema `FaceEmbedding` (vector `Float[]` dim 1024 từ model `@vladmandic/human`).
- `POST /checkins/face` (1:1, threshold 0.6), `POST /checkins/face-scan` (1:N lễ tân, threshold 0.7).
- Anti-spoof (`real < 0.3` bị chặn). Consent `NĐ13/2023` bắt buộc khi enroll.
- Lễ tân quét mặt trước khi ghi lượt tập; KPI check-in theo hình thức ở `/admin/reports/attendance`.

### 5.3. Thực đơn dinh dưỡng — Tích hợp Spoonacular + Thư viện thực phẩm
- **Thư viện nội bộ (`Food`)**: 77 món ăn tiếng Việt (`Ức gà luộc`, `Cá hồi áp chảo`, `Chuối chín`) với `caloriesPer100g`, `protein`, `carbs`, `fat`. Admin `/admin/foods` quản lý.
- **Tìm trong builder (`/trainer/meal-plans/builder`)**: nhập `gà ức gà` → tìm từ DB nội bộ, hiện `tên món | kcal | P/C/F`; chọn thêm vào bữa ăn.
- **Spoonacular (tích hợp)**: `GET /meal-plans/recipes/search?query=...` — dịch từ khóa tiếng Việt (`gà ức gà` → `chicken breast`), trả kết quả có `titleVi`, hình ảnh, calo. Key cố định trong `.env`; endpoint chi tiết (`/recipes/{id}`) có fallback khi quota 401.

### 5.4. Chat thực tế (realtime)
- HLV gửi thực đơn qua `POST /meal-plans` → `status=SENT` → tin nhắn `MEAL_PLAN` tự động gửi trong chat.
- Member ấn vào card trong chat → **mở rộng** xem từng bữa (`Sáng/Trưa/Tối/Phụ`) + từng món (`tên • số lượng • kcal`).
- Chat hỗ trợ gửi ảnh, text, và thông báo (bell 3 phía, ticker 6h).

### 5.5. Báo cáo & Kiểm toán (STEP 9 — nổi bật)
- `AuditLog`: global, 34 action / 12 entity (`FOOD_CREATE`, `PAYMENT_CONFIRM`, `FACE_ENROLL`...), `@Global`, `log()` không bao giờ throw.
- `AllExceptionsFilter`: chuẩn hóa lỗi + map Prisma error.
- `helmet` + `@nestjs/throttler` (global 300/60s, login 10/60s, register 5/300s) + CORS allowlist.
- `/admin/reports` 8 tab: doanh thu, chuyên cần, thanh toán, thực đơn, v.v. — lọc theo chi nhánh + export CSV.
- `/admin/audit-logs`: lọc + phân trang + dialog metadata.

---

## 5.3. Check-in khuôn mặt (Kỳ 11 — sinh trắc học FACE_ID)

**Dữ liệu lưu (`FaceEmbedding`)**:
- `embedding: Float[]` (dim **1024** từ `@vladmandic/human`)
- `imageData`: ảnh tham chiếu (data URL, chỉ mẫu đầu tiên) — dữ liệu cá nhân nhạy cảm theo `NĐ13/2023`
- `consentAt`: đồng ý tường minh (bắt buộc); xoá đăng ký = xoá sạch vector + ảnh
- Audit: `FACE_ENROLL` + `FACE_DELETE`

**Quy trình**:
1. **Enroll** (`/member/face-registration`): consent → `human` chụp → trích vector → lưu (`enroll` bắt buộc consent / tự rút lui / admin xóa)
2. **Tự quét** (`POST /checkins/face`): 1:1, `thresholdSelf = 0.6` (env `FACE_MATCH_THRESHOLD`). `real < 0.3` bị chặn (anti-spoof)
3. **Lễ tân quét** (`POST /checkins/face-scan`): 1:N, `thresholdGlobal = 0.7` (env `FACE_MATCH_THRESHOLD_1N`) — nghiêm hơn vì chọn nhầm = ghi sai lượt tập
4. Kết quả match trả `memberId`, `similarity`, `imageData`; `CheckinsService` tạo `CheckIn` với `method = FACE_ID`
5. Báo cáo `/admin/reports/attendance`: KPI theo hình thức (FACE_ID / CARD / CODE) + tab Chuyên cần

> Lưu ý trình bày: nhấn mạnh **consent bắt buộc**, **vector + ảnh đều là dữ liệu nhạy cảm**, **anti-spoof** và **ngưỡng phân biệt** (0.6 vs 0.7).

---

## 6. DEMO — Những gì đã hoạt động (2 phút — trình chiếu)

**Mẫu trình trình:**

1. **Đăng nhập** `/login` → HLV (`trainer@gym.com`) + Member (`member@gym.com`).
2. **Tạo thực đơn** `/trainer/meal-plans/builder`:
   - Nhập tiêu đề → chọn hội viên (`Nguyễn Văn Thế`).
   - Click `Thư viện` → tìm `gà` / `chuối` → chọn `Ức gà luộc` (165 kcal) + `Chuối chín` (89 kcal) → thêm vào bữa.
3. **Gửi** → `SENT`. Tin nhắn chat xuất hiện: `Thực đơn ngày • 555 kcal`.
4. **Member mở chat** → bấm vào card thực đơn → mở rộng: `Sáng • 07:30 • Ức gà luộc 100g • 165 kcal • Chuối chín 120g • 89 kcal`.
5. **Check-in** `/member/checkin`: qua `FACE_ID` (nếu có webcam) hoặc nhập mã → `CheckIn` ghi nhận `method=FACE_ID`.
6. **Admin** `/admin/reports`: xem KPI, lọc chi nhánh, export CSV.

---

## 7. KẾT LUẬN & HƯỚNG PHÁT TRIỂN (1 phút)

"Dự án đã hoàn thành các yêu cầu cốt lõi: quản lý hội viên, thanh toán, thực đơn, check-in, báo cáo, audit, và giao tiếp thực thời. Tôi đã dùng PostgreSQL 17 native (không SQL Server), Next.js 14 + NestJS đầy tính năng, và tuân thủ palette thiết kế duy nhất.

Hướng phát triển tiếp:
- Thêm module `Exercise` (m bài tập) để chuyển từ dữ liệu tĩnh `programs.ts` sang backend CRUD.
- Tích hợp thanh toán thật `MOMO` / `VNPay` (hiện là stub) để hoàn thiện flow.
- Mở rộng nhận diện khuôn mặt với model chính xác hơn (hiện dùng `@vladmandic/human` 3.3.6, cần test webcam thật).
- Tối ưu bundle (hiện `build` 61 routes, có thể giảm further).

Cảm ơn thầy/cô đã lắng nghe. Tôi sẵn sàng trả lời câu hỏi."

---

## PHỤ LỤC — Slide đề xuất (tóm tắt 12 slide, giống PPT đã có `docs/ThuyetTrinh_GymShark.pptx`)

1. Tiêu đề + logo GymShark
2. Vấn đề: phòng tập quản lý rời rạc
3. Giải pháp: hệ thống một cửa Full-Stack
4. Kiến trúc: Next 14 + NestJS + PostgreSQL
5. Thiết kế: Palette tối + Neon + Font Barlow/Be Vietnam
6. Hàm năng chính (icon): Hội viên / Thanh toán / Check-in / Thực đơn / Chat / Báo cáo
7. Check-in khuôn mặt (FACE_ID) — import ảnh + consent
8. Thực đơn: Thư viện 77 món + Spoonacular
9. Chat + Thực đơn gửi qua tin nhắn
10. Báo cáo + Audit (34 hành động)
11. Demo (video ngắn / ảnh chụp)
12. Kết luận + Hỏi đáp

---

> Lưu ý khi trình bày: hãy nói chậm, chỉ vào từng section trên slide, không đọc hết chữ. Nếu có câu hỏi về `Spoonacular` hay `FaceEmbedding`, hãy nhấn mạnh: **là tích hợp bên ngoài, không ảnh hưởng nghiệp vụ cốt lõi, có fallback rõ ràng khi lỗi**.
