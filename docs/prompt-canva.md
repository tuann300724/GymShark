# Prompt Canva — Tạo slide thuyết trình GymShark (đầy đủ chức năng)

## Prompt chính (dán trực tiếp vào Canva AI / Magic Write):

```
Tạo bài trình chiếu (presentation / slide) tiếng Việt, phong cách tối hiện đại (dark theme), màu chủ đạo đen (#0B0D0F) + neon vàng chanh (#B7FF00) + xám nhạt. Font tiêu đề: Barlow Condensed đậm (nén chiều ngang), font nội dung: Be Vietnam Pro rõ nét. Định dạng 16:9, tối đa 7-8 slide.

Mỗi slide phải nói rõ các chức năng ĐẶC BIỆT của web GymShark — không bỏ sót:

SLIDE 1 — Bìa:
Tiêu đề: "GymShark — Quản lý phòng tập thông minh"
Phụ: "Check-in nhận diện khuôn mặt • Thanh toán • Khuyến mãi • Báo cáo • Lịch tập • PT • Admin"

SLIDE 2 — Quét mặt / Kiosk / Face (tính năng nổi bật):
- Trang /kiosk: camera liên tục, nhận diện 1:N (POST /checkins/face-scan, model @vladmandic/human, vector 1024)
- Tự động check-in khi chưa ở phòng → tự động check-out khi đang CHECKED_IN (POST /checkins/face-checkout)
- /member/face-checkin: hội viên tự quét (1:1, threshold 0.6)
- /member/face-registration: đăng ký khuôn mặt + consent NĐ13/2023
- Anti-spoof chặn mẫu real < 0.3

SLIDE 3 — Thanh toán + Hóa đơn (Payment / Invoice):
- Đăng ký gói tập → PaymentGateway: CASH, BANK_TRANSFER thật; MOMO/VNPAY stub
- Tạo hóa đơn INV-2026-NNNNNN (DRAFT → ISSUED → PAID / CANCELLED)
- Staff confirm chỉ CASH/BANK_TRANSFER; kiểm tra trùng transactionRef (409)
- In biên lai / /member/payments/[id]

SLIDE 4 — Khuyến mãi + Thông báo + Lịch tập + PT (Promotion / Schedule / Trainer):
- /packages: gói tập có badge khuyến mãi; áp mã khi đăng ký (subtotal - discount = total)
- /promotions: auto-expire, usageLimit, perMemberLimit, minOrderValue
- Thông báo: chuông 3 phía (bell), ticker 6h, trigger checkin / equipment-broken / payment
- /admin/schedules + /trainer: lịch tập, PT của hội viên (TrainerMember, TrainingProgress)
- /member/schedule: hội viên xem buổi tập, PT của mình

SLIDE 5 — Báo cáo + Audit + Bảo mật (Reports / Admin):
- /admin/reports: 8 tab (revenue, attendance, checkins, members, promotions, audit...)
- CSV export có BOM, lọc branch
- AuditLog: 34 hành động (MEMBER_CREATE, PAYMENT_CONFIRM, CHECK_IN, FACE_ENROLL...), @Global log() không bao giờ throw
- Helmet + Throttle (300/60s global, 10/60s login) + AllExceptionsFilter + CORS allowlist

SLIDE 6 — Kiến trúc + DB + Dev ops:
- Frontend: Next.js 14 App Router + Tailwind v3 + TypeScript (localhost:3000)
- Backend: NestJS + Prisma + SQL Server 2022, database `gym_db` / port 1433
  (API localhost:3001)
- Prisma db push + seed; Docker Compose có nếu cần
- Theme: dark/sáng toggle, lưu localStorage gym_theme

SLIDE 7 — Kết luận + Link + QA:
- Tất cả tính năng đã chạy: build 52 routes, smoke API 77/77 PASS, QA Playwright 294/294 PASS
- Lưu ý QA: cần cấp quyền camera thật để test /kiosk (máy QA hiện deny camera)
- Link repo + doc: docs/thuyet-trinh.md, docs/huong-dan-quet-mat.md, docs/prompt-canva.md

Yêu cầu thiết kế:
- Mỗi slide có tiêu đề tiếng Việt, bullet 3-5 dòng, không quá chữ
- Dùng icon tương đương: camera, credit-card, gift, bell, calendar-user, shield-check, database, chart-bar, laptop
- Không dùng ảnh stock sáng màu — ảnh tối, tương phản mạnh, neon làm accent (chỉ nút/số/indicator, không nền lớn)
- Để trống khoảng trắng cả 4 góc, không chật chữ
```

## Nếu dùng Canva Magic Design (từ mẫu):
- Chọn template: "Tech Startup Pitch / Dark Mode / Minimal" → đổi màu thành đen + neon vàng chanh.
- Dán từng phần nội dung 7 slide trên vào slide tương ứng.
- Thêm các hình minh họa đơn giản: camera tròn + khung nhận diện mặt + biểu đồ doanh thu đơn giản + icon thanh toán + thông báo chuông.
