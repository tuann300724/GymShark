# PROMPT — Sinh kịch bản thuyết trình đồ án GymMaster Pro

> **Cách dùng:** mở ChatGPT / Claude / Copilot → dán nguyên khối trong §1 → gửi.
> Prompt này đã nhúng sẵn **số liệu thật** của dự án nên AI không bịa thông tin.

---

## §1 — PROMPT CHÍNH (dán nguyên khối này)

```text
Bạn là chuyên gia biên soạn kịch bản bảo vệ đồ án tốt nghiệp ngành CNTT.
Hãy viết cho tôi kịch bản THUYẾT TRÌNH + cấu trúc slide hoàn chỉnh bằng tiếng Việt.

════════════════════════════════════════
1. YÊU CẦU ĐẦU RA
════════════════════════════════════════
- Thời lượng: 20 phút (tính cả phần hỏi đáp dự phòng thì lời trình bày ~18 phút)
- Số slide: 25 slide
- Với MỖI slide, in ra đúng 4 khối:
    ## Slide N — <tiêu đề slide>
    **Nội dung hiển thị trên slide:**  (gạch đầu dòng ngắn, tối đa 5 dòng, dạng
                                        "từ khoá - diễn giải", KHÔNG viết thành
                                        đoạn văn dài)
    **Lời nói:**  (đoạn văn tự nhiên 100–160 từ, người thuyết trình đọc thành
                  tiếng được, đúng giọng sinh viên năm cuối — không sáo rỗng,
                  không đọc lại chữ trên slide)
    **Gợi ý trình chiếu:**  (1 dòng — nên dùng ảnh chụp màn hình / biểu đồ / demo
                          nào cho slide này)
    **Thời lượng:**  (dạng "0:45" — quy đỗi từ lời nói ra)

- CUỐI CÙNG, thêm mục "PHỤ LỤC HỎI ĐÁP DỰ PHÒNG":
  12 câu hỏi hội đồng đặt ra có khả năng cao (kèm đáp án trả lời mỗi câu 3–5 câu),
  trong đó BẮT BUỘC có các câu về: lý do chọn công nghệ, rủi ro bảo mật, khả năng
  mở rộng, điểm yếu của hệ thống, và câu hỏi về tính hợp pháp của việc thu thập
  dữ liệu sinh trắc học khuôn mặt.

- Rồi thêm mục "ĐỐI CHIẾU THỜI GIAN": bảng tổng hợp thời lượng từng phần, phải
  cộng lại đúng 20 phút. Nếu vượt quá, cắt bớt slide nào và giải thích vì sao.

════════════════════════════════════════
2. ĐỐI TƯỢNG NGHE
════════════════════════════════════════
Hội đồng bảo vệ gồm giảng viên chuyên ngành và giảng viên đối chiếu, có thể
KHÔNG rành công nghệ cụ thể. Vì vậy:
- Giải thích kỹ thuật phải đi từ "vấn đề" → "giải pháp" → "bằng chứng"
- Mỗi thuật ngữ khó, giải thích ngay lần đầu bằng một câu đời thường
- Ưu tiên con số và hình ảnh thật của hệ thống hơn lý thuyết

════════════════════════════════════════
3. DỰ ÁN — THÔNG TIN CẦN DÙNG (đây là sự thật, KHÔNG được bịa thêm)
════════════════════════════════════════

TÊN DỰ ÁN: GymMaster Pro — Hệ thống Quản lý & Vận hành Phòng tập Gym
LOẠI:       Đồ án tốt nghiệp, full-stack web, toàn bộ giao diện tiếng Việt

--- Vấn đề thực tế ---
Phòng tập vận hành bằng sổ tay/sổ bấm thẻ giấy gây: mất dữ liệu khi sổ hỏng,
không kiểm tra được thẻ hết hạn khi lận đầu, thu tiền không có chứng từ để đối
chiếu khi có khiếu nại, thống kê doanh thu phải đếm tay, và không biết chính xác
chuyên viên nào đã sửa/xoá dữ liệu hội viên khi có khiếu nại.

--- Công nghệ (chọn có chủ ý, cần nêu lý do) ---
Frontend : Next.js 14 (App Router) + TypeScript + Tailwind CSS 3   — port 3000
           Lý do: SSR/SSG tăng tốc độ tải, App Router gom data-fetching vào server
           component, TypeScript bắt lỗi trước khi lên production.
Backend  : NestJS 10 + Prisma 5 + SQL Server 2022 (`gym_db`)       — port 3001
           Lý do: NestJS có hệ thống module + Dependency Injection + Guard/Interceptor
           sẵn — phù hợp hệ thống nhiều phân quyền; Prisma sinh type an toàn,            dịch lỗi DB về thông báo dễ hiểu; SQL Server hỗ trợ transaction
           cho nghiệp vụ tiền (thanh toán).
Khác      : Axios (gắn JWT qua interceptor), Swagger tự sinh từ decorator,
           helmet + @nestjs/throttler (rate limit), nodemailer (SMTP xác minh email),
           @vladmandic/human 3.3.6 (mô hình nhận diện khuôn mặt, chạy 100% client).

--- Quy mô đã đạt được (dùng đúng số này, không tự ý tăng/giảm) ---
- Mã nguồn: 242 file · 40.319 dòng (Frontend 126 file/27.738 dòng, Backend 116 file/12.581 dòng)
- API endpoint: 161 (@Get/@Post/...)
- Trang Next.js: 49 route sinh ra khi build production
- Cơ sở dữ liệu: 20 model, 21 enum
- Nhật ký hệ thống (audit log): 40 loại hành động × 13 loại thực thể
- Phân quyền: 5 vai trò — CUSTOMER, MEMBER, TRAINER, STAFF, MANAGER/ADMIN
- Dữ liệu mẫu trong DB hiện tại: 22 tài khoản, 16 hội viên, 14 thẻ tập,
  15 thanh toán, 14 hoá đơn, 71 lượt check-in, 63 thông báo, 132 dòng nhật ký,
  3 chi nhánh / 5 phòng tập

--- Các nhóm chức năng đã làm (chia theo 11 kỳ) ---
1. Cổng công khai + giao diện dark-only theo design system riêng (nền #0B0D0F,
   accent neon #B7FF00, font Barlow Condensed + Be Vietnam Pro)
2. Đăng ký hội viên 2 bước: điền thông tin → nhận mã 6 số qua email (nodemailer)
   → nhập mã (TTL 10 phút, chống sai 5 lần là xoá hồ sơ)
3. Quản lý hội viên + duyệt yêu cầu đăng ký
4. Gói tập + thẻ tập (vòng đời PENDING → ACTIVE → EXPIRED)
5. Thanh toán + hoá đơn: cổng thanh toán trừu tượng, CASH/BANK_TRANSFER/MOMO/VNPAY;
   hoá đơn mã INV-2026-NNNNNN; giao dịch + hoá đơn chạy trong transaction;
   hoàn tiền (refund); chống trùng số tham chiếu (409)
6. Check-in / Check-out thời gian thực + báo cáo chuyên cần
7. Huấn luyện viên + lịch tập + cổng riêng cho HLV
8. Thiết bị + bảo trì (cảnh báo thiết bị hỏng sinh thông báo)
9. Khuyến mãi (tự tính subtotal/discount/total) + thông báo (bell 3 phía, ticker)
10. Trung tâm báo cáo 8 tab + xuất CSV
11. Nhận diện khuôn mặt FACE_ID (điểm nhấn kỹ thuật mới nhất)
    + nhật ký hệ thống audit log (40 action)
    + helmet / rate limit / chuẩn hoá lỗi tập trung

--- ĐIỂM NHẤN KỸ THUẬT 1: Nhận diện khuôn mặt FACE_ID ---
Đây là phần hội đồng sẽ hỏi nhiều nhất, hãy trình bày kỹ:
- Vector đặc trưng 1024 chiều, model @vladmandic/human, chạy 100% ở TRÌNH DUYỆT
  → dữ liệu sinh trắc học KHÔNG rời khỏi máy khi tạo vector
- So khớp c Euclidean, ngưỡng 0.6 cho đối chiếu 1:1
- Có chống giả mạo (anti-spoof): model chấm điểm "người thật", dưới ngưỡng thì từ chối
- Chế độ quét 1:N cho lễ tân: quét cả kho vector trong DB, ngưỡng 0.7
- Lưu thêm 1 ảnh tham chiếu để lễ tân đối chiếu mắt bằng mắt trước khi ghi lượt tập
- Hợp pháp: yêu cầu đồng ý bằng văn bản theo Nghị định 13/2023/NĐ-CP; hội viên
  tự rút lui (xoá vector + ảnh) bất cứ lúc nào; quản trị có thể xem/xoá
- Bảo mật: mọi thao tác xoá đều ghi audit log
- Ngoại lệ: khi đăng ký, hệ thống gửi 1 ảnh chụp tới Azure AI Vision Face Detect
  để kiểm tra hội viên có đeo kính không (mô hình local không có khả năng này).
  Thiết kế fail-open: lỗi dịch vụ bên thứ ba KHÔNG được chặn đăng ký của hội viên.

--- ĐIỂM NHẤN KỸ THUẬT 2: Nhật ký hệ thống (audit log) ---
- 40 loại hành động ghi vào bảng AuditLog: ai (userId), làm gì (action), trên
  thực thể nào (entity + entityId), metadata dạng JSON, IP, thời điểm
- Hàm log() được thiết kế KHÔNG BAO GIỜ throw — lỗi ghi nhật ký không được làm
  hỏng nghiệp vụ chính (đây là một quyết định thiết kế đáng giải thích)
- Trang /admin/audit-logs cho quản trị lọc + phân trang + xem metadata
- Chỉ ADMIN và MANAGER được xem (lễ tân STAFF không thấy)

--- KẾT QUẢ KIỂM THỬ (dùng đúng số này) ---
- TypeScript typecheck: 0 lỗi
- ESLint: 0 lỗi, 0 cảnh báo
- Prettier format check: đạt
- Build production: đạt, sinh 49 route, không lỗi
- Backend build (nest build) + prisma validate: đạt
- Smoke test API tự động: 76/76 kiểm tra PASS (kiểm tra cả phân quyền 401/403,
  đăng ký hội viên → đăng ký gói → admin xác nhận thanh toán → check-in/out →
  truy vấn báo cáo)
- QA giao diện tự động bằng Playwright: quét 38 route × 6 kích thước màn hình
  (375 / 430 / 768 / 1280 / 1440 / 1920 px) với 3 vai trò đăng nhập →
  0 lỗi console, 0 lỗi HTTP ≥400, 0 tràn ngang — tức 228 lượt kiểm tra giao diện
- Kiểm tra dữ liệu: 14 hoá đơn khớp tiền thanh toán, 0 hoá đơn lệch, 0 trường hợp
  trùng thanh toán
- CI (GitHub Actions): tự động chạy typecheck + lint + format + build mỗi lần đẩy code

--- HẠN CHẾ (phải nói thẳng, không giấu — điểm này gây ấn tượng tốt) ---
- Chưa có test tự động dạng unit/integration (Jest) — kiểm thử hiện dùng script
  smoke test và Playwright chạy thủ công
- Chưa triển khai lên môi trường thật (mới chạy ở localhost, SQL Server native)
- Chưa phân tán tải / chưa có cache Redis / chưa triển khai Docker cho production
- Nhận dạng khuôn mặt chạy trên trình duyệt nên phụ thuộc độ mạnh máy tính
  của thiết bị quầy
- Gửi email xác minh cần cấu hình SMTP; MOMO/VNPAY mới ở mức stub chứ chưa nối
  cổng thật
- Chưa hỗ trợ đa chi nhánh thật sự (hiện 3 chi nhánh trong dữ liệu mẫu)

--- HƯỚNG PHÁT TRIỂN ---
- Viết unit test + test e2e chạy trong CI, đạt coverage mục tiêu
- Triển khai Docker Compose + Nginx reverse proxy + HTTPS
- Cache Redis cho báo cáo và rate limit dùng nhiều instance
- WebSocket để cập nhật số liệu dashboard theo thời gian thực
- Nối cổng thanh toán thật (VNPay/MoMo), ví điện tử
- Ứng dụng mobile cho hội viên (React Native) quét QR check-in

════════════════════════════════════════
4. RÀN BUỘC VỀ VĂN PHONG
════════════════════════════════════════
- Tiếng Việt, xưng "chúng em" (sinh viên năm cuối bảo vệ đồ án)
- Không dùng từ Hán Việt rườm rà (tránh "tiến trình hóa", "hệ thống cung cấp
  dịch vụ", "thực thi"), dùng từ đời thường khi có thể
- Không nói "như đã trình bày ở trên" — mỗi slide phải tự đứng vững
- Nêu giới hạn của từng giải pháp, không chỉ khoe tính năng
- Khi nói về con số, luôn kèm đơn vị và ngữ cảnh ("161 endpoint trên 13 nhóm
  chức năng", không "161 endpoint")
```

---

## §2 — Biến thể prompt (nếu cần đổi)

| Tình huống | Thay đổi ở §1 |
| :--- | :--- |
| **Bị cắt xuống 10 phút** | Đổi `Số slide: 25` → `12`, và `Thời lượng: 20 phút` → `10 phút`. Thêm câu: *"Gộp các slide đề tài tương tự; ưu tiên giữ: vấn đề, kiến trúc, điểm nhấn FACE_ID, audit log, kết quả kiểm thử, hạn chế."* |
| **Bị yêu cầu thuyết trình 30 phút** | Đổi thành `35 slide / 30 phút`, thêm câu: *"Tách mỗi nhóm chức năng thành 2 slide: 1 slide khái niệm nghiệp vụ, 1 slide kỹ thuật."* |
| **Hội đồng thiên về nghiệp vụ** | Thêm vào cuối §4: *"Giảm 60% thuật ngữ kỹ thuật, tăng tỷ trọng mô tả nghiệp vụ và bài toán quản lý phòng tập."* |
| **Cần thêm phần demo trực tiếp** | Thêm một slide ở giữa: *"Slide demo: chạy 3 kịch bản — quét mặt check-in, lễ tân duyệt đăng ký, xuất báo cáo doanh thu."* |

---

## §3 — Dùng kết quả để làm slide

1. Lấy phần **"Nội dung hiển thị trên slide"** của mỗi slide → đưa vào PowerPoint / Google Slides
2. Lấy phần **"Lời nói"** → in ra giấy hoặc để trên teleprompter
3. Chụp màn hình thật từ dự án cho các slide có gợi ý trình chiếu (có sẵn dữ liệu mẫu, chạy `npm run dev` + `npm run prisma:seed` là có ngay)
4. **ĐỐI CHIẾU THỜI GIAN** ở cuối — dùng làm đồng hồ đếm ngược khi luyện tập
5. **Phụ lục hỏi đáp dự phòng** — in riêng 1 tờ, chỉ đọc khi hỏi

---

## §4 — Nguồn thông tin trong dự án

Khi cần tự tra cứu thêm thay vì hỏi AI:

| Cần gì | Xem ở đâu |
| :--- | :--- |
| Tổng quan tính năng, RBAC, bảo mật | `README.md` |
| Lịch sử từng kỳ phát triển | `WORKLOG.md` |
| Quy tắc giao diện (màu, font) | `DESIGN_SYSTEM.md` |
| Cấu trúc thư mục frontend | `AGENTS.md` §3 |
| Mô hình dữ liệu 20 model | `backend/prisma/schema.prisma` |
| Danh sách 40 audit action | `backend/src/modules/audit-logs/` + `grep "action:" backend/src` |

---

## §5 — ⚠️ Cảnh báo quan trọng

Trong §1 có chủ ý ghi **"KHÔNG được bịa thêm"**. Lý do:

- Bảo vệ đồ án, hội đồng sẽ **kiểm tra chéo**. Nếu bạn nói sai số liệu
  ("hệ thống có 500 endpoint" trong khi thực tế 161) thì uy tín bị ảnh hưởng
  nặng hơn việc thiếu một chi tiết.
- Nếu AI có nói thêm, hãy **đối chiếu với `README.md` và `WORKLOG.md`** trước khi
  dùng. Xoá mọi thứ không kiểm chứng được.

**Những gì đã biết là chưa xong — đừng nói là xong trong kịch bản:**
- Chưa test được nhận dạng khuôn mặt với webcam thật (máy QA bị chặn quyền camera)
- Chưa cấu hình SMTP nên xác minh email chưa chạy được thật trên máy dev
- Chưa có key Azure AI Vision nên bước kiểm tra đeo kính đang tự bỏ qua (fail-open)
