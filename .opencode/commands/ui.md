---
description: Soi giao diện 1 trang theo DESIGN_SYSTEM.md
---

Soi giao diện trang `$ARGUMENTS` (mặc định trang chủ `/`) theo `DESIGN_SYSTEM.md`:

1. Đảm bảo dev server chạy; mở trang bằng browser tools, cuộn hết trang, chụp full page (desktop).
2. Đối chiếu DESIGN_SYSTEM.md:
   - Đúng palette: nền `#0B0D0F`, surface `#15191D`, accent `#B7FF00`, chữ `#F5F5F5`/`#9AA0A6`, viền `#272C31` — không lẫn màu cũ (emerald/slate/rose/trắng sáng).
   - Neon chỉ làm accent (~2% diện tích): không nền neon lớn, không gradient neon.
   - Font: Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung).
   - Kiểm tra contrast chữ phụ `#9AA0A6` trên nền tối, vùng trống giữa các section.
   - Chữ ảnh load đầy đủ (không vỡ layout, không ảnh sáng màu lạc tông).
3. Đọc `browser.console`: không được có lỗi đỏ.
4. Mobile 390px: không tràn ngang ngang; nếu browser tools không giả lập được mobile thì bỏ qua bước này và báo rõ.
5. Báo cáo theo mức độ: **nghiêm trọng / nên sửa / cosmetic**. Chưa tự sửa khi tôi chưa đồng ý.
