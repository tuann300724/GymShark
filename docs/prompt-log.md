# Nhật ký Prompt (Prompt Log) — GymShark

Ít nhất 10 Prompt quan trọng đã dùng để xây dựng hệ thống:

---

## 1. Prompt tạo schema Prisma (`Branch`, `FaceEmbedding`, `AuditLog`)
**Nội dung:** "Thêm model Branch (branchId String?) vào schema.prisma và tạo module audit-logs với 34 action, @Global, log() không bao giờ throw."
**Tại sao:** Cần phân hệ phòng + audit bảo mật đầy đủ cho đồ án tốt nghiệp.

---

## 2. Prompt tạo endpoint `/checkins/face-checkout`
**Nội dung:** "Thêm POST /checkins/face-checkout vào checkins.controller + service — nhận embedding, tìm hội viên qua matchGlobal, kiểm tra CHECKED_IN rồi cập nhật CHECKED_OUT + tạo notification + audit log."
**Tại sao:** Tính năng tự động check-out khi quét mặt tại `/kiosk`.

---

## 3. Prompt xây trang `/kiosk`
**Nội dung:** "Tạo trang `/kiosk` full-screen (layout trống, không header/footer), camera liên tục, nhận embedding qua `@vladmandic/human`, gọi `/checkins/face-scan`, nếu lỗi 'trong phòng' → gọi `/checkins/face-checkout`, tự reset 3s."
**Tại sao:** Kiosk tự phục vụ là tính năng nổi bật của đồ án.

---

## 4. Prompt cấu hình SQL Server
**Nội dung:** "Cấu hình backend sử dụng SQL Server 2022, database `gym_db`; chỉ cập nhật `.env.example`, không ghi credentials thật vào repo."
**Tại sao:** Backend chỉ dùng SQL Server và cần bảo vệ thông tin kết nối.

---

## 5. Prompt tạo trang `/member/face-checkin`
**Nội dung:** "Tạo trang thành viên tự quét khuôn mặt (`POST /checkins/face`) dùng `face-scanner` component + `lib/face.ts`, thêm consent NĐ13/2023 cho dữ liệu sinh trắc học."
**Tại sao:** Bắt buộc có consent cho dữ liệu khuôn mặt (NĐ13/2023).

---

## 6. Prompt thêm tính năng Promotion (STEP 8)
**Nội dung:** "Xây module promotions + notifications + reports: CRUD promotion (validate tự tính subtotal-discount-total), bell notification 3 phía, ticker 6h, 8 tab reports + CSV export BOM, badge khuyến mãi ở `/packages`."
**Tại sao:** Khuyến mãi + báo cáo doanh thu là yêu cầu đồ án.

---

## 7. Prompt thêm Payment + Invoice (STEP 6)
**Nội dung:** "Tạo module payments (CASH/BANK_TRANSFER thật, MOMO/VNPAY stub) + invoice (INV-2026-NNNNNN unique), flow register/renew/confirm/refund, staff confirm chỉ CASH/BANK_TRANSFER."
**Tại sao:** Thanh toán thật + hóa đơn là phần cốt lõi hệ thống.

---

## 8. Prompt viết `AGENTS.md` và `WORKLOG.md`
**Nội dung:** "Cập nhật AGENTS.md + WORKLOG.md ghi lại trạng thái commit, bẫy QA (browser tools, camera deny, rate-limit, encoding PowerShell), cách chạy smoke test."
**Tại sao:** Hướng dẫn làm việc cho agent và người dùng khác.

---

## 9. Prompt tạo Canva slide (`docs/prompt-canva.md`)
**Nội dung:** "Tạo prompt Canva cho 7 slide: bìa (dark + neon), quét mặt, thanh toán, khuyến mãi, báo cáo, kiến trúc DB, kết luận. Nói rõ từng chức năng đặc biệt web có."
**Tại sao:** Chuẩn bị thuyết trình đồ án, phải liệt kê hết tính năng.

---

## 10. Prompt sửa `docs/thuyet-trinh.md` cho đầy đủ tính năng
**Nội dung:** "Sửa lại tài liệu thuyết trình trong `docs/` để thêm phần thanh toán, chat/thông báo, quét mặt, audit, bảo mật — không chỉ nói mỗi quét mặt."
**Tại sao:** Đáp ứng yêu cầu thuyết trình phải nói hết các chức năng đặc biệt web có.

---

*Mỗi prompt trên đều được lưu lại trong `docs/prompt-canva.md` và `docs/thuyet-trinh.md` để tham chiếu khi trình bày hoặc bảo trì dự án.*
