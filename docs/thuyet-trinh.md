# GymShark — Tính năng mới (Kỳ 11 + bổ sung)

## 1. Quét khuôn mặt — Kiosk tự phục vụ (`/kiosk`)
- Trang `/kiosk`: camera liên tục, nhận diện 1:N (`POST /checkins/face-scan`).
- Khi hội viên đang trong phòng (`CHECKED_IN`) → tự gọi `POST /checkins/face-checkout`.
- Thông báo nổi tên hội viên + mã (`MEM-...`) sau 3s tự reset.

## 2. Check-in / Check-out khuôn mặt (`/member/face-checkin`)
- Thành viên tự quét (`POST /checkins/face`) tại `/member/face-checkin`.
- Dùng model `@vladmandic/human` chạy 100% client-side (không gửi ảnh lên server).

## 3. Endpoint mới
- `POST /checkins/face-checkout` (backend `checkins.service.ts`) — lễ tân quét khuôn mặt để check-out hội viên đang mở phiên.
- `Branch` model đã thêm vào schema (`prisma/schema.prisma`) để hỗ trợ phân hệ phòng sau này.

## 4. Cách đồng bộ DB cho máy khác
```bash
# Sau khi clone/pull
npx prisma db push --accept-data-loss
npm run prisma:seed        # nếu cần dữ liệu mẫu
```
Hoặc dùng Docker Compose (`docker-compose.yml`) để chạy SQL Server 2022 riêng.
Database ứng dụng hiện tại là `gym_db`; không tạo lại database nếu cần giữ dữ liệu.

## 5. Môi trường
- Backend: `localhost:3001` (`npm run start:dev`)
- Frontend: `localhost:3000` (`npm run dev`)
- DB SQL Server 2022 (T-SQL) (máy hiện tại), port 1433.
