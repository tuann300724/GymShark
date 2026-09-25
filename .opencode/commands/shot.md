---
description: Chụp ảnh trang để QA bằng browser tools có sẵn
---

Chụp màn hình trang `$ARGUMENTS` (mặc định trang chủ `/`) trên `http://localhost:3000`.

1. Nếu server chưa chạy: chạy `npm run dev` trong `frontend/` ở chế độ nền, chờ trang phản hồi.
2. Dùng **browser tools có sẵn** (browser.tabs.open → navigate → screenshot → console): mở trang, chụp full page, cuộn hết các khối.
3. Nếu cần giả lập mobile 390px mà browser tools không đổi được viewport thì viết nhanh script Playwright trong thư mục tạm (mẫu: `pw/shot.js` đã dùng trước đây).
4. Hiển thị ảnh cho tôi kèm nhận xét nhanh: tràn ngang ngang, ảnh không load, lỗi hiển thị, console lỗi.
