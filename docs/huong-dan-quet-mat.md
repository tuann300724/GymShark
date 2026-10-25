# Hướng dẫn demo — Quét mặt Kiosk (`/kiosk`)

## Chuẩn bị
1. Mở `http://localhost:3000/kiosk` (tab mới, không header/footer web).
2. Đảm bảo camera được cấp quyền (trình duyệt cho phép).
3. Hội viên đứng trước camera, nhìn thẳng, mặt rõ nét trong khung tròn.

## Luồng quét
1. **Chưa ở phòng** → quét → `✅ Check-in thành công — anh [Hội viên]` → tự reset sau 3s.
2. **Đang ở phòng** (đã check-in) → quét → `✅ Check-out thành công — anh [Hội viên]` (tự gọi `/checkins/face-checkout`).
3. **Lỗi** → `❌ [lý do]` (mặt mờ / quá xa / chưa đăng ký) → tự reset sau 3s.

## Lưu ý kỹ thuật cho thuyết trình
- Model `@vladmandic/human@3.3.6` chạy **100% client-side** — không gửi ảnh lên server.
- Vector `Float[]` dim 1024 được gửi qua `POST /checkins/face-scan` (1:N, threshold 0.7) hoặc `/checkins/face` (1:1, 0.6).
- Nếu máy QA không có quyền camera → không thể test thật (đã ghi chú trong WORKLOG).
- `ANTI_SPOOF_MIN` chặn mẫu `real < 0.3` (chống giả mạo).
