# Tính năng Khuyến mãi (`/packages`, `/admin/reports`)

## Đăng ký gói có mã khuyến mãi
- `/packages`: danh sách gói tập có biểu tượng `🏷️ Mã khuyến mãi` (nếu đang có promo).
- Khi đăng ký: hệ thống tự tính `subtotal - discount = finalAmount` (không tin frontend gửi giá).
- Mã khuyến mãi (`/promotions`) kiểm tra: còn hiệu lực, còn lượt (`usageLimit`), mỗi hội viên (`perMemberLimit`), giá tối thiểu (`minOrderValue`).

## Báo cáo doanh thu (`/admin/reports/revenue`)
- Lọc theo chi nhánh (branch) + xuất CSV (có BOM UTF-8) cho Excel.
- Thống kê doanh thu theo phương thức thanh toán (`CASH`, `BANK_TRANSFER`, `MOMO`, `VNPAY`).
- Kiểm tra trùng mã giao dịch (`transactionRef`) để tránh thanh toán 2 lần.

## Audit & bảo mật
- `AuditLog` ghi 34 hành động (`MEMBER_CREATE`, `PAYMENT_CONFIRM`, `CHECK_IN`, `FACE_ENROLL`, v.v.).
- `helmet` + throttle (global 300/60s, login 10/60s, register 5/300s) + CORS allowlist.
- Tất cả lỗi chuẩn hóa qua `AllExceptionsFilter` (map Prisma `P2002`/`P2014`/`P2003`).
