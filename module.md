# GymShark — Mô tả chức năng (Module)

Dự án quản lý phòng tập gym (Next.js + NestJS + Prisma + SQL Server).

## 1. Xác thực & Quản lý người dùng
- Đăng nhập / Đăng ký (JWT)
- Quên mật khẩu / Đặt lại / Đổi mật khẩu
- Google OAuth
- Phân quyền: ADMIN / MANAGER / STAFF / TRAINER / MEMBER

## 2. Hội viên & Thẻ thành viên
- Đăng ký hội viên / Cấp lại thẻ
- Quản lý hồ sơ hội viên (avatar, thông tin)
- Trạng thái: ACTIVE / INACTIVE / EXPIRED / SUSPENDED
- Gắn kết User ↔ Member

## 3. Gói tập (Membership Packages)
- Gói đang dùng: FIXED_TERM theo thời hạn ngày; có thể kèm quota buổi PT và giá trị từng buổi để tính hoàn tiền
- Gói SESSION_BASED cũ đã ngừng bán và ẩn khỏi danh mục; giữ liên kết membership lịch sử
- Các tính năng: description, features, durationDays
- Quản lý gói: tạo, sửa, xóa, liên kết thanh toán

## 4. Đăng ký / Đổi gói (Memberships)
- Đăng ký mới / Gia hạn
- Trạng thái: PENDING → ACTIVE / EXPIRED / CANCELLED
- Liên kết Member → Package
- Yêu cầu chấm dứt hợp đồng: quản lý đề xuất hoàn tiền theo thời gian và quota PT còn lại → hội viên xác nhận → ADMIN/MANAGER duyệt → ADMIN ghi nhận khoản chi thực tế
- Bảo lưu một lần, tối đa 30 ngày; ADMIN/MANAGER duyệt và gia hạn hợp đồng tương ứng

## 5. Thanh toán & Hóa đơn (Payment + Invoice)
- Gateway: CASH / BANK_TRANSFER (thật) ; MOMO / VNPAY (stub)
- Tạo hóa đơn (INV-... unique), trạng thái DRAFT / ISSUED / PAID / CANCELLED
- Xác nhận thanh toán (STAFF confirm CASH/BANK)
- Hoàn tiền thanh toán độc lập có transaction; khoản gắn hợp đồng phải qua quy trình chấm dứt, xác nhận và phê duyệt
- Hoàn một phần ghi nhận số tiền thực chi, doanh thu báo cáo được trừ khoản hoàn
- In biên lai / in PDF

## 6. Check-in / Check-out / Điểm danh
- Check-in thủ công / QR / STAFF / FACE_ID
- Check-out (checkout)
- Face scan 1:N (lễ tân) và 1:1 (tự quét)
- Face enrollment / rút lui (consent ND13)
- Anti-spoof (real < 0.3 chặn)
- Báo cáo: thời gian, tỷ lệ, theo phương thức

## 7. Nhận diện khuôn mặt (Face ID — Kỹ sinh trắc học)
- Model `@vladmandic/human` (client-side, CDN)
- Enroll face: vector Float[] (dim 1024) + ảnh tham chiếu data URL
- Match: cosine similarity, ngưỡng 0.6 (self) / 0.7 (1:N staff)
- Schema: `FaceEmbedding` (memberId, embedding String, imageData, consentAt)
- Endpoints: POST /faces/enroll, DELETE /faces/enroll, GET /faces/me
- Check-in: POST /checkins/face, POST /checkins/face-scan, POST /checkins/face-checkout

## 8. Lịch tập & PT / Trainer
- Trainer profile / scheduling
- Training sessions (PERSONAL_TRAINING / GROUP_CLASS / FREE_TRAINING)
- Training progress theo session
- TrainerMember liên kết Member ↔ Trainer

## 9. Thiết bị & Bảo trì (Equipment / Maintenance)
- Quản lý thiết bị, tình trạng: OPERATIONAL / BROKEN / MAINTENANCE
- Lịch bảo trì định kỳ / khẩn cấp
- Báo cáo tình trạng thiết bị

## 10. Phòng tập (Rooms / Schedule)
- Quản lý phòng, trạng thái SCHEDULED / COMPLETED / CANCELLED
- Lịch nhóm / cá nhân theo phòng

## 11. Thực đơn / Bữa ăn (Meal Plans / Foods)
- Công thức món ăn, danh mục thực phẩm
- Kế hoạch bữa ăn cho hội viên

## 12. Thông báo (Notifications / Ticker)
- Bell (3 phía: admin/member/staff)
- Ticker 6h + trigger từ check-in / equipment / payment
- Announce theo role / chi nhánh cụ thể

## 13. Báo cáo & Export (Reports)
- 8 tab báo cáo (revenue, membership, attendance, trainers...)
- Lọc chi nhánh + CSV export (BOM)
- KPI dashboard member / admin

## 14. Kiểm toán (Audit Logs)
- 53 action (nhãn `AUDIT_ACTION_META`),
- Log không bao giờ throw (@Global)
- Đăng nhập / check-in / payment / face / membership...

## 15. Chat / Tin nhắn
- Conversation (member/member hoặc với staff)
- Message list + unread count

## 16. API & Tích hợp
- REST (NestJS) + Swagger (+Swagger UI)
- JWT auth + CORS allowlist + helmet + throttler
- Health check (`/api/health`) → `database: "connected"`
- Frontend: Next.js 14 App Router + Tailwind v3 + TypeScript

## 17. Công nghệ nền tảng (SQL Server)
- `provider = "sqlserver"` (Prisma)
- SQL Server 2022 native hoặc Docker `mssql/server:2022`
- Windows Auth / `integratedSecurity=true` hoặc SQL Auth
- Database: `gym_db`; Port 1433
