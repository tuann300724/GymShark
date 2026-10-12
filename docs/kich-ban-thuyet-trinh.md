# KỊCH BẢN THUYẾT TRÌNH — ĐỒ ÁN GYMMASTER PRO

> **25 slide viết sẵn · thời lượng đã đo thật** · Xưng "chúng em"
> Cách dùng: lấy phần **Slide** để làm PPT, phần **Lời nói** để đọc khi trình bày.
>
> ⚠ **Về thời lượng — đọc trước khi luyện tập:**
> Toàn bộ 25 slide đo được **19:21** lời nói, cộng demo 3 phút là **22:21** → vượt 20 phút.
> Nên kịch bản có **2 bản**, xem bảng ở mục *ĐỐI CHIẾU THỜI GIAN*:
> - **Hội đồng cho 20 phút** → **bỏ slide 15, 16, 20**, còn **20:09**
> - **Hội đồng cho 25 phút** → trình bày đủ 25 slide, **22:21**
>
> Con số thời lượng trong file này được **đo tự động bằng script đếm từ thật**
> (150 từ/phút), không phải ước lượng. Nếu bạn sửa lại lời nói thì nên đo lại.

**Tài khoản demo để chuẩn bị phần demo sống:**
`admin@gym.com` / `Admin@123456` · `staff@gym.com` / `Staff@123456` · `member@gym.com` / `Member@123456`

---

## Slide 1 — Bìa đề

**Slide**
```
GYMMASTER PRO
Hệ thống Quản lý & Vận hành Phòng tập Gym

Đồ án tốt nghiệp · [Họ và tên] · [MSSV]
Giảng viên hướng dẫn: [tên]
Năm học 2025 – 2026
```

**Lời nói**
Kính chào quý thầy cô và các bạn. Em là [tên], hôm nay em trình bày đồ án tốt nghiệp GymMaster Pro — hệ thống quản lý và vận hành phòng tập gym. Toàn bộ là hệ thống full-stack, giao diện tiếng Việt, từ quản lý hội viên, thẻ tập, thanh toán, check-in thời gian thực, đến huấn luyện viên, thiết bị và báo cáo — và điểm nhấn là nhận diện khuôn mặt giúp hội viên check-in không cần thẻ.

**Gợi ý trình chiếu:** Logo dự án + ảnh nền tối (nếu có logo, không có thì dùng
chữ "GYMMASTER PRO" typography theo design system).

**Thời lượng:** 0:32

---

## Slide 2 — Vấn đề thực tế

**Slide**
```
PHÒNG TẬP ĐANG VẬN HÀNH THỦ CÔNG → 5 HỆ QUẢ

✗ Mất dữ liệu khi sổ bấm thẻ hỏng, rách, thất lạc
✗ Lận đầu thẻ hết hạn không bị phát hiện kịp
✗ Thu tiền không có chứng từ → không đối chiếu khi khiếu nại
✗ Doanh thu phải đếm tay, báo cáo mất cả ngày
✗ Không biết nhân viên nào đã sửa / xoá dữ liệu hội viên
```

**Lời nói**
Trước khi nói về hệ thống, em nói rõ vấn đề. Phòng tập vẫn vận hành trên sổ tay và thẻ bấm giấy, và cách đó có năm hệ quả: dữ liệu nằm trên giấy nên sổ hỏng là mất; thẻ hết hạn chỉ ghi bằng bút nên lễ tân phải đọc mắt và lận đầu không ai ngăn được; thu tiền không sinh chứng từ nên khiếu nại thì khó chứng minh; doanh thu cuối ngày phải đếm tay; và khi có khiếu nại về hồ sơ hội viên thì không biết nhân viên nào đã sửa hay xoá.

**Gợi ý trình chiếu:** Chụp ảnh sổ tay/sổ bấm thẻ thật, hoặc 5 dòng này hiện
từng dần theo hiệu ứng.

**Thời lượng:** 0:40

---

## Slide 3 — Mục tiêu & phạm vi

**Slide**
```
MỤC TIÊU
  Số hoá toàn bộ vòng đời hội viên: đăng ký → thẻ tập → thanh toán → tập luyện
  Thay sổ bấm thẻ bằng check-in điện tử
  Trả lời câu hỏi "ai đã làm gì" trong 1 giây

PHẠM VI (đã hoàn thành)
  ✓ 11 nhóm chức năng · 161 endpoint · 20 model dữ liệu
  ✓ 5 vai trò phân quyền: CUSTOMER → MEMBER → TRAINER → STAFF → ADMIN/MANAGER
  ✓ Nhận diện khuôn mặt FACE_ID · Nhật ký hệ thống 40 loại hành động
```

**Lời nói**
Từ đó em đặt ba mục tiêu: số hoá toàn bộ vòng đời hội viên trong một nơi; thay sổ bấm thẻ bằng check-in điện tử; và trả lời được câu "nhân viên nào đã làm gì" trong một giây. Phạm vi em thực hiện: 11 nhóm chức năng, 161 API, 20 mô hình dữ liệu, 5 vai trò phân quyền.

**Gợi ý trình chiếu:** Sơ đồ phân cấp vai trò (quyền tăng dần từ dưới lên).

**Thời lượng:** 0:24

---

## Slide 4 — Phân tích yêu cầu chức năng

**Slide**
```
NHÓM YÊU CẦU                    TÍNH CHẤT
1. Hội viên & thẻ tập          Nghiệp vụ, ràng buộc nghiệp vụ chặt
2. Thanh toán & hoá đơn          Nghiệp vụ + TÍNH TIỀN (phải nhất quán tuyệt đối)
3. Check-in thời gian thực       Realtime, hiệu năng
4. Nhận diện khuôn mặt FACE_ID   AI, dữ liệu nhạy cảm, PHÁP LÝ
5. Báo cáo & thống kê           Tổng hợp, hiệu năng
6. Nhật ký hệ thống              Yêu cầu bắt buộc, không được làm hỏng nghiệp vụ
```

**Lời nói**
Em phân tích yêu cầu thành sáu nhóm, và mỗi nhóm có tính chất kỹ thuật khác nhau — điều đó quyết định cách thiết kế. Nhóm thanh toán có tính tiền nên bắt buộc phải có transaction. Nhóm check-in là realtime nên phải nhanh. Nhóm nhận diện khuôn mặt là nhóm duy nhất có yếu tố pháp lý. Còn nhóm nhật ký hệ thống có một ràng buộc đặc biệt em sẽ nói ở slide sau.

**Gợi ý trình chiếu:** Bảng này, tô đậm cột "Tính chất".

**Thời lượng:** 0:31

---

## Slide 5 — Công nghệ chọn và lý do

**Slide**
```
FRONTEND                    BACKEND
Next.js 14 (App Router)     NestJS 10
TypeScript                  Prisma 5
Tailwind CSS 3              PostgreSQL

LÝ DO CHỌN (không chọn theo sở thích)
  App Router  → gom data-fetching vào Server Component, SSR/SSG nhanh hơn
  TypeScript  → bắt lỗi kiểu dữ liệu TRƯỚC khi lên production
  NestJS      → có sẵn Module + DI + Guard/Interceptor → hợp RBAC nhiều vai trò
  Prisma      → sinh type từ schema, lỗi DB dịch thành thông báo dễ hiểu
  PostgreSQL  → ACID + transaction cho nghiệp vụ tiền
  Swagger     → tự sinh từ decorator, tài liệu luôn khớp code
```

**Lời nói**
Em chọn Next.js 14 và NestJS 10, và đây là chọn có lý do. App Router gom data-fetching vào Server Component nên phần dữ liệu nhiều không phải gửi hết xuống trình duyệt. TypeScript bắt lỗi kiểu dữ liệu lúc viết code. NestJS có sẵn module, dependency injection, guard và interceptor — nền tảng để làm phân quyền mà không phải tự viết lại. Prisma sinh type từ schema. PostgreSQL em chọn vì cần transaction cho nghiệp vụ tiền.

**Gợi ý trình chiếu:** Logo các công nghệ + sơ đồ 3 tầng (Client → API → DB).

**Thời lượng:** 0:32

---

## Slide 6 — Kiến trúc tổng thể

**Slide**
```
┌─────────────────────────────────────────────────┐
│  NEXT.JS 14 (App Router · Client + Server Comp) │
└──────────────────┬──────────────────────────────┘
                   │ REST/JSON + JWT (Axios interceptor)
┌──────────────────▼──────────────────────────────┐
│  NESTJS 10                                       │
│  Controller → Guard(RBAC) → Interceptor → Service │
│  + AllExceptionsFilter (chuẩn hoá lỗi tập trung) │
│  + Throttler (rate limit) + Helmet               │
└──────────────────┬──────────────────────────────┘
                   │ Prisma ORM
┌──────────────────▼──────────────────────────────┐
│  POSTGRESQL  ·  20 model ·  21 enum              │
└─────────────────────────────────────────────────┘

MÔ HÌNH MODULAR MONOLITH — 12 module nghiệp vụ, tách bạch bằng interface
```

**Lời nói**
Kiến trúc gồm ba tầng: giao diện Next.js, API NestJS, và PostgreSQL. Em giải thích luồng một request: Controller tiếp nhận, Guard kiểm tra phân quyền — không đủ quyền thì dừng ngay tại đây — rồi Interceptor xử lý log, tới Service mới chạy nghiệp vụ. Nếu có lỗi, nó không trả lỗi lung tung từ tầng nào mà đi qua một bộ lọc thống nhất. Em chọn modular monolith — 12 module tách bạch bằng interface — vì quy mô đồ án chưa cần phân tán, nhưng tách sẵn để sau tách service riêng được.

**Gợi ý trình chiếu:** Sơ đồ khối, tô đậm đường đi của request, chiếu animation
từng bước.

**Thời lượng:** 0:39

---

## Slide 7 — Mô hình dữ liệu

**Slide**
```
20 MODEL · 21 ENUM — thiết kế theo vòng đời nghiệp vụ

  Branch ─┬─ Room ─┬─ Equipment ── EquipmentMaintenance
          │        └─ TrainingSchedule
          └─ User ─┬─ Member ─┬─ Membership ── Payment ── Invoice
                    │          ├─ CheckIn
                    │          ├─ FaceEmbedding (vector 1024 chiều)
                    │          └─ TrainingProgress
                    ├─ Trainer ── TrainerMember
                    ├─ Promotion · Notification
                    └─ AuditLog · EmailVerification

QUY TẮC: có @unique ở mọi khóa nghiệp vụ (mã HĐ, mã hoá đơn, mã HĐ tham chiếu,
          SĐT) → ràng buộc tại tầng DB, không đợi tới lỗi ở tầng ứng dụng
```

**Lời nói**
Em thiết kế dữ liệu theo vòng đời nghiệp vụ chứ không theo từng màn hình. Em nhấn một nguyên tắc: mọi khóa nghiệp vụ đều có ràng buộc unique ngay ở tầng cơ sở dữ liệu — mã hội viên, mã hoá đơn, mã giao dịch tham chiếu, cả số điện thoại — vì khi trùng thì database phải là thứ chặn cuối cùng. Thực tế khi xây xong em phát hiện một lỗi do chính điều này: một số điện thoại tạo được ba tài khoản khác nhau.

**Gợi ý trình chiếu:** Sơ đồ ER, tô sáng nhóm Payment–Invoice–Membership và nhóm
FaceEmbedding–CheckIn.

**Thời lượng:** 0:36

---

## Slide 8 — Phân quyền RBAC

**Slide**
```
5 VAI TRÒ — quyền tăng dần

  CUSTOMER   Đăng ký, xem gói tập/lịch tập, blog
  MEMBER     + Check-in, xem thẻ tập, hóa đơn, đăng ký khuôn mặt
  TRAINER    + Quản lý lịch tập, hồ sơ hội viên mình phụ trách
  STAFF      + Quầy lễ tân: duyệt đăng ký, thu phí, quét mặt 1:N
  ADMIN/     + Báo cáo, khuyến mãi, quản lý thiết bị, NHẬT KÝ HỆ THỐNG
  MANAGER

⚠ Lễ tân (STAFF) KHÔNG được xem nhật ký hệ thống — tách quyền riêng có chủ ý
```

**Lời nói**
Phân quyền em thiết kế kỹ vì nó quyết định an toàn dữ liệu. Có 5 vai trò, quyền tăng dần. Điểm đáng chú ý nhất: lễ tân không được xem nhật ký hệ thống. Đây là quyết định có chủ ý — vì nhật ký cho biết ai đã sửa hay xoá dữ liệu hội viên, nếu lễ tân tự tạo thay đổi rồi tự xem lại nhật ký thì nhật ký mất hết ý nghĩa. Vì vậy chỉ ADMIN và MANAGER được xem. Cơ chế là decorator Roles đặt trên controller.

**Gợi ý trình chiếu:** Bảng vai trò, tô đỏ dòng cảnh báo ở cuối.

**Thời lượng:** 0:37

---

## Slide 9 — Đăng ký hội viên 2 bước (xác minh email)

**Slide**
```
ĐĂNG KÝ 2 BƯỚC — chống đăng ký hội viên ảo

BƯỚC 1  Điền thông tin → gửi mã 6 số về email (nodemailer/SMTP)
        ├ TTL mã: 10 phút
        ├ Chống spam: rate limit 5 lần / 5 phút
        └ Sai 5 lần → xoá hồ sơ xác minh

BƯỚC 2  Nhập mã → tạo User + Member → trả JWT → vào hệ thống

⚠ Check trùng SĐT ở CẢ HAI bước (chống đăng ký đè trong lúc đang chờ mã)
   Mã hội viên: MEM-0001 tự sinh, dò mã trống (tránh trùng khi xoá/đặt lại)
```

**Lời nói**
Đây là luồng đăng ký 2 bước. Vì sao phải 2 bước? Nếu cho tạo tài khoản tức thì, kẻ xấu đăng ký hàng loạt tài khoản ảo bằng email rác. Bước một, hội viên điền thông tin, hệ thống gửi mã 6 số về đúng email họ nhập; mã hạn 10 phút, sai 5 lần là xoá hồ sơ, kèm giới hạn tần suất chống spam. Bước hai mới thật sự tạo tài khoản. Em nhấn: em check trùng số điện thoại ở cả hai bước, vì nếu chỉ check bước một thì trong lúc chờ mã người khác có thể đăng ký trùng trước.

**Gợi ý trình chiếu:** Screenshot 2 màn hình của luồng đăng ký, hoặc quay màn
hình ngắn luồng đăng ký thật.

**Thời lượng:** 0:42

---

## Slide 10 — Thanh toán & hóa đơn

**Slide**
```
NGHIỆP VỤ CÓ TÍNH TIỀN — ưu tiên số 1

  CỔNG THANH TOÁN TRỪU TƯỢNG
    CASH · BANK_TRANSFER  (chạy thật)
    MOMO · VNPAY          (stub, sẵn sàng nối API thật)

  TÍNH TIỀN ĐẢM BẢO
    Hoá đơn INV-2026-NNNNNN (unique)
    Ghi giao dịch + sinh hoá đơn TRONG 1 TRANSACTION → không lệch tiền
    Số tiền trùng → 409 (chống thanh toán 2 lần)

  VÒNG ĐỜI:  DRAFT → ISSUED → PAID → (refund) CANCELLED
  KẾT QUẢ   14 hoá đơn · 15 giao dịch · 0 hoá đơn lệch tiền · 0 trùng
```

**Lời nói**
Đây là phần quan trọng nhất vì có tính tiền. Vấn đề lớn nhất là tiền và chứng từ phải khớp nhau: nếu ghi đã nhận tiền rồi mới sinh hoá đơn mà giữa chừng crash, sẽ có tiền mà không có hoá đơn. Vì vậy em ghi giao dịch và sinh hoá đơn trong cùng một transaction — thành công thì cả hai, thất bại thì không cái nào được ghi. Phía trên là cổng thanh toán trừu tượng, cash và chuyển khoản chạy thật, MoMo và VNPay để sẵn giao diện. Em cũng phát hiện số tiền có thể trùng lặp gây thanh toán hai lần, nên thêm ràng buộc transactionRef duy nhất, trùng thì trả 409.

**Gợi ý trình chiếu:** Sơ đồ luồng transaction, tô đỏ phần "cùng 1 transaction".

**Thời lượng:** 0:48

---

## Slide 11 — Check-in thời gian thực

**Slide**
```
CHECK-IN / CHECK-OUT — thay sổ bấm thẻ giấy

  4 CÁCH CHECK-IN
  ├ 1. Quét thẻ vật lý (mã QR trên thẻ)
  ├ 2. Nhập mã hội viên
  ├ 3. Nhận diện khuôn mặt 1:1  (hội viên tự quét)
  └ 4. Quét khuôn mặt 1:N        (lễ tân quét, tìm trong cả kho vector)

  KIỂM TRA TRƯỚC KHI GHI LƯỢT
  ✔ Thẻ còn hiệu lực?      ✔ Tài khoản không bị khoá?
  ✔ Đã check-in hôm nay?   ✔ Hết thời hạn thẻ?

  mass-checkout tự động theo ca để lễ tân không phải bấm từng người
```

**Lời nói**
Sau khi có thẻ tập, bài toán lớn nhất là thay sổ bấm thẻ. Hệ thống hỗ trợ bốn cách: quét mã QR trên thẻ vật lý, nhập mã hội viên, nhận diện khuôn mặt 1:1 để hội viên tự quét trên điện thoại, và quét 1:N để lễ tân tìm trong toàn bộ kho vector. Em cố ý giữ cả cách cũ vì không phải hội viên nào cũng muốn đăng ký khuôn mặt. Trước khi ghi lượt tập, hệ thống kiểm tra bốn điều: thẻ còn hiệu lực, tài khoản không bị khoá, hôm nay đã check-in chưa, và thẻ có hết hạn chưa.

**Gợi ý trình chiếu:** Màn hình quầy lễ tân `/admin/checkins` + nút quét khuôn mặt.

**Thời lượng:** 0:42

---

## Slide 12 — ĐIỂM NHẤN: Nhận diện khuôn mặt FACE_ID

**Slide**
```
FACE_ID — chạy 100% TRÌNH DUYỆT, dữ liệu KHÔNG rời khỏi máy khi tạo vector

  @vladmandic/human 3.3.6  →  vector đặc trưng 1024 chiều
  So khớp: khoảng cách Euclid  ·  ngưỡng 0.6 (1:1)  ·  ngưỡng 0.7 (quét 1:N)

  CHỐNG GIẢ MẠO (anti-spoof)
  Model chấm điểm "đây là người thật" — dưới ngưỡng thì từ chối bắt mẫu

  LƯU ẢNH THAM CHIẾU
  Lễ tân đối chiếu mặt bằng mắt trước khi ghi lượt tập
  Cắt đúng vùng mặt theo tọa độ model trả về (không chụp cả khung)

  CHẶN ẢNH KÉM:  mờ · quá xa · quá sát · lệch khung · quá tối · quá sáng
```

**Lời nói**
Giờ đến điểm nhấn kỹ thuật: nhận diện khuôn mặt. Điều quan trọng nhất em muốn nói trước là quá trình tạo vector chạy hoàn toàn trong trình duyệt, không phải trên server — chỉ kết quả là dãy 1024 số mới gửi lên để lưu. Nghĩa là dữ liệu sinh trắc học không rời khỏi máy. Về thuật toán, so khớp bằng khoảng cách Euclid với ngưỡng 0.6 cho một-một. Em thêm hai lớp bảo vệ. Một là chống giả mạo: bên cạnh tìm mặt, mô hình còn chấm điểm đây có phải người thật, để chặn đưa ảnh chụp màn hình vào trước camera. Hai là chặn ảnh kém — có ngưỡng chất lượng trên và dưới, phải nằm gần giữa khung, không quá tối hay quá sáng — vì lúc đầu em đặt ngưỡng quá dễ, thử thực tế thấy chụp được cả mặt mờ. Ngoài vector em lưu một ảnh tham chiếu để lễ tân đối chiếu bằng mắt trước khi ghi lượt tập.

**Gợi ý trình chiếu:** Sơ đồ luồng (khung hình → model cục bộ → vector → server),
tô đậm phần "trình duyệt" để nhấn rằng dữ liệu không rời máy.

**Thời lượng:** 1:07

---

## Slide 13 — FACE_ID: Tuân thủ pháp luật (NĐ 13/2023)

**Slide**
```
DỮ LIỆU KHUÔN MẶT = DỮ LIỆU CÁ NHÂN NHẠY CẢM
Theo Nghị định 13/2023/NĐ-CP — mức bảo vệ cao nhất

✔ ĐỒNG Ý BẰNG VĂN BẢN      hội viên phải tick mới đăng ký được
✔ TỰ RÚT LUI               xoá vector + ảnh bất cứ lúc nào
✔ QUYỀN QUẢN LÝ           admin có thể xem / xoá hội viên
✔ GHI NHẬT KÝ              mọi thao tác đều vào audit log
✔ CÔNG KHAI                 nếu có dùng bên thứ ba phải nêu rõ trong consent

Ngoại lệ (đã nêu minh bạch trong văn bản đồng ý):
  Khi đăng ký, 1 ảnh chụp được gửi tới Azure AI Vision để kiểm tra
  người dùng có đeo kính không (mô hình cục bộ không làm được).
  → Ảnh KHÔNG lưu ở Azure, KHÔNG lưu phía phòng tập.
  → Thiết kế FAIL-OPEN: Azure lỗi / hết key → bỏ qua kiểm tra,
     TUYỆT ĐỐI không chặn hội viên đăng ký.
```

**Lời nói**
Vì đây là phần liên quan pháp lý, em tách riêng một slide. Theo Nghị định 13 năm 2023, dữ liệu khuôn mặt là dữ liệu cá nhân nhạy cảm thuộc mức bảo vệ cao nhất. Em thiết kế năm cơ chế: đồng ý bằng văn bản thì mới đăng ký được; hội viên tự rút lui bất cứ lúc nào; quản trị được xem và xoá; mọi thao tác kể cả thao tác xoá đều vào nhật ký; và phải công khai. Em muốn nói rõ điểm cuối. Văn bản đồng ý ban đầu em ghi "không chia sẻ cho bên thứ ba". Nhưng khi em thêm bước kiểm tra đeo kính — mô hình cục bộ không làm được — hệ thống buộc phải gửi ảnh lên dịch vụ phân tích của Microsoft, thì câu đó không còn đúng. Em đã sửa thành "không chia sẻ, trừ ngoại lệ nêu dưới đây", và nói rõ ảnh không lưu ở phía Azure cũng không lưu phía phòng tập. Đồng thời em thiết kế fail-open: Azure lỗi thì bỏ qua kiểm tra, vì lỗi dịch vụ bên thứ ba không được phép chặn hội viên.

**Gợi ý trình chiếu:** Ảnh chụp văn bản đồng ý trên màn hình thật
`/member/face-registration`. Đây là slide có sức nặng nhất, nên nói chậm.

**Thời lượng:** 1:18

---

## Slide 14 — Nhật ký hệ thống (Audit Log)

**Slide**
```
40 LOẠI HÀNH ĐỘNG × 13 LOẠI THỰC THỂ — trả lời "ai đã làm gì"

  MỖI DÒNG GHI:  userId · action · entity + entityId · metadata (JSON) · IP · thời điểm

  RÀNG BUỘC THIẾT KẾ (điểm em muốn giải thích):
    Hàm log() được viết để KHÔNG BAO GIỜ throw.
    → Lỗi ghi nhật ký KHÔNG được làm hỏng nghiệp vụ chính.
    → Đây là đánh đổi có chủ ý: giảm độ tin cậy của nhật ký,
       đổi lại bảo vệ tiền và dữ liệu hội viên.
    → Lỗi ghi vẫn được ghi log cảnh báo để không bị bỏ qua im lặng.

  /admin/audit-logs — lọc theo hành động / thực thể / người / khoảng thời gian
  132 dòng trong dữ liệu mẫu
```

**Lời nói**
Đây là quyết định thiết kế em muốn giải thích nhất. Hệ thống ghi 40 loại hành động lên 13 loại thực thể, mỗi dòng chứa ai thực hiện, làm gì, trên thực thể nào, kèm IP và thời điểm. Câu hỏi em gặp: nếu bảng nhật ký chết — hết chỗ hay cơ sở dữ liệu lập chúc — nghiệp vụ chính có nên dừng không? Em trả lời là không. Nếu ai đó đang thanh toán mà hệ thống báo lỗi chỉ vì không ghi được nhật ký, thiệt hại lớn hơn nhiều so với việc thiếu một dòng. Vì vậy hàm ghi nhật ký được viết để không bao giờ ném lỗi, và khi lỗi thì in cảnh báo ra log hệ thống để không bị bỏ qua im lặng. Em hiểu đây là đánh đổi — nó làm giảm độ đầy đủ của nhật ký — nhưng đây là lựa chọn có chủ ý.

**Gợi ý trình chiếu:** Screenshot trang `/admin/audit-logs` đang lọc theo hành động.

**Thời lượng:** 1:03

---

## Slide 15 — Các nhóm chức năng còn lại

**Slide**
```
HUẤN LUYỆN VIÊN & LỊCH TẬP
  Lịch cá nhân + lớp nhóm, cổng riêng cho HLV, tiến trình tập

THIẾT BỊ & BẢO TRÌ
  Vòng đời thiết bị, lịch bảo trì, thiết bị hỏng → tự sinh thông báo

KHUYẾN MÃI
  Tự tính subtotal / discount / total, kiểm tra thời hạn, đếm lượt dùng

THÔNG BÁO
  Chuông 3 phía (quản trị · lễ tân · hội viên), gửi theo vai trò/chi nhánh

BÁO CÁO  →  8 tab: doanh thu · hội viên · check-in · thiết bị · HLV · khuyến mãi
             · chuyên cần · sinh trắc học     + xuất CSV
```

**Lời nói**
Ngoài ba phần vừa rồi, hệ thống còn có: lịch tập cá nhân và lớp nhóm với cổng riêng cho huấn luyện viên — em tách riêng vì huấn luyện viên không nên xem hồ sơ tài chính của hội viên; quản lý thiết bị với lịch bảo trì, và khi thiết bị hỏng thì hệ thống tự sinh thông báo; khuyến mãi với tiền giảm do hệ thống tự tính, vì tự tính là chỗ dễ sai nhất; thông báo có chuông ở cả ba phía; và trung tâm báo cáo tám tab kèm xuất CSV có BOM để mở bằng Excel tiếng Việt không lỗi font.

**Gợi ý trình chiếu:** Montage 6 ảnh màn hình nhỏ của các trang tương ứng.

**Thời lượng:** 0:43

---

## Slide 16 — Giao diện & hệ thống thiết kế

**Slide**
```
DESIGN SYSTEM RIÊNG — dark-only, tương phản mạnh

  Nền #0B0D0F   ·   Surface #15191D   ·   Accent neon #B7FF00
  Chữ #F5F5F5 / phụ #9AA0A6   ·   Viền #272C31   ·   Danger #FF4545

  2 FONT:  Barlow Condensed (tiêu đề) · Be Vietnam Pro (nội dung)
  Icon:   lucide-react
  Motion: component Reveal — IntersectionObserver, tôn trọng prefers-reduced-motion
  Ảnh:   next/image, tải trùng tiên, luôn có alt tiếng Việt

  Dark-only: KHÔNG có nút bật/tắt, KHÔNG có class dark:
  Neon CHỈ làm accent — không tô nền lớn, không gradient neon
```

**Lời nói**
Về giao diện, em tự xây một hệ thống thiết kế riêng thay vì dùng giao diện có sẵn, và bắt buộc tuân thủ xuyên suốt. Toàn bộ là dark-only — em cố ý không làm nút bật sáng tắt tối, vì sự nhất quán quan trọng hơn tuỳ chọn cá nhân. Màu neon chỉ dùng làm điểm nhấn, không bao giờ tô nền lớn hay gradient, vì như vậy nó mất tác dụng chỉ dẫn mắt. Về chuyển động, em dùng IntersectionObserver và có kiểm tra prefers-reduced-motion, nên nếu người dùng bật giảm chuyển động vì nhạy cảm thần kinh thì hiệu ứng tự tắt.

**Gợi ý trình chiếu:** 2 ảnh: trang chủ (desktop) và trang member (mobile), đặt
cạnh nhau để thấy responsive.

**Thời lượng:** 0:42

---

## Slide 17 — Bảo mật

**Slide**
```
7 LỚP BẢO MẬT

1. Helmet                    7 header bảo mật chuẩn (XSS, clickjacking, sniff)
2. JWT + bcrypt              mật khẩu hash 10 vòng, token hạn có kiểm soát
3. RBAC Guard                chặn 401/403 trước khi chạm tới service
4. Rate limit (@nestjs/throttler)
                             toàn cục 300 req/phút · login 10/60s · đăng ký 5/300s
5. CORS allowlist            không bật "*"
6. Validation + AllExceptionsFilter
                             mọi lỗi trả về cùng định dạng — không lộ stack trace
7. Ràng buộc DB              @unique ở mọi khóa nghiệp vụ (lớp phòng thủ cuối)

⚠ Đã kiểm tra: không lộ biến môi trường, không lộ mật khẩu trong audit metadata
```

**Lời nói**
Bảo mật em tổ chức thành bảy lớp: helmet chống XSS và clickjacking; xác thực với bcrypt mười vòng và token có thời hạn; guard phân quyền chặn ngay tại cửa; rate limit — em nhấn lớp này vì nó giải quyết đúng bài toán em gặp lúc bắt đầu: toàn cục 300 request mỗi phút, riêng API đăng nhập chỉ 10 lần trong 60 giây, không có nó thì kẻ xấu dò mật khẩu không giới hạn; CORS theo danh sách cho phép; bộ lọc lỗi tập trung để không lộ stack trace; và ràng buộc ở tầng cơ sở dữ liệu — lớp phòng thủ cuối khi mọi kiểm tra ở tầng trên đều bị bỏ sót.

**Gợi ý trình chiếu:** Danh sách 7 lớp, hiện từng dòng.

**Thời lượng:** 0:48

---

## Slide 18 — Kết quả kiểm thử

**Slide**
```
KIỂM THỬ TỰ ĐỘNG — chạy trong CI mỗi lần đẩy code

  typecheck (tsc --noEmit)          0 lỗi TypeScript
  ESLint                           0 lỗi, 0 cảnh báo
  Prettier --check                  đạt
  next build                        đạt — 49 route, không lỗi
  nest build + prisma validate     đạt

  SMOKE TEST API               76/76 PASS
    ✔ security header · RBAC 401/403
    ✔ E2E: đăng ký → mua gói → admin xác nhận → check-in/out → báo cáo

  QA GIAO DIỆN (Playwright)    38 route × 6 viewport = 228 lượt kiểm tra
    375 · 430 · 768 · 1280 · 1440 · 1920 px  (3 vai trò đăng nhập)
    → 0 lỗi console · 0 lỗi HTTP ≥ 400 · 0 tràn ngang

  KIỂM TRA DỮ LIỆU     14 hoá đơn khớp tiền · 0 lệch · 0 trùng thanh toán
```

**Lời nói**
Kiểm thử em thiết kế tự động chạy trong CI, gồm bốn lớp. Lớp đầu là kiểm tra tĩnh: TypeScript, ESLint, Prettier và build — đều đạt, build sinh 49 route. Lớp thứ hai là smoke test API, 76 trên 76 đạt, và bộ test này mô phỏng nghiệp vụ thật: đăng ký, mua gói tập, admin xác nhận thanh toán, check-in và check-out, rồi truy vấn báo cáo xem số liệu có khớp không. Lớp thứ ba là QA giao diện bằng Playwright: 38 route trên 6 kích thước màn hình với 3 vai trò, tổng 228 lượt, với ba tiêu chí là không lỗi console, không lỗi HTTP từ 400 trở lên, và không phần tử nào tràn ngang — tiêu chí thứ ba là lý do em chọn sáu kích thước thay vì chỉ test desktop. Lớp thứ tư là kiểm tra toàn vẹn dữ liệu: 14 hoá đơn đối chiếu giao dịch, không lệch đồng nào.

**Gợi ý trình chiếu:** Chụp màn hình kết quả CI (check xanh các bước).

**Thời lượng:** 1:04

---

## Slide 19 — Demo trực tiếp

**Slide**
```
DEMO 3 KỊCH BẢN

① QUẦY LỄ TÂN — Đăng ký hội viên mới (3 bước)
   Ghi hồ sơ → duyệt yêu cầu → làm thẻ tập → thu phí → in hoá đơn
   → quét mặt check-in 1:N

② HỘI VIÊN — Check-in không cần thẻ
   Đăng ký khuôn mặt (tick đồng ý NĐ13) → quét mặt 1:1 → xem lịch sử lượt tập

③ QUẢN TRỊ — Báo cáo & nhật ký
   /admin/reports/revenue (xuất CSV) → /admin/audit-logs (lọc theo hành động)

⚠ Dự phòng: nếu mạng/WiFi hỏng → quay sẵn video 4 phút
```

**Lời nói**
Phần này em chuyển sang demo trực tiếp. Kịch bản một, em đóng vai lễ tân: đăng ký hội viên mới qua quy trình ba bước, duyệt yêu cầu, làm thẻ tập, thu phí và in hoá đơn, rồi quét mặt ghi lượt tập. Kịch bản hai, em đóng vai hội viên: đăng ký khuôn mặt — em sẽ cho các thầy cô thấy ô đồng ý theo Nghị định 13 — rồi check-in bằng khuôn mặt. Kịch bản ba, phía quản trị: báo cáo doanh thu, xuất CSV, rồi lọc nhật ký hệ thống theo một hành động. Em có chuẩn bị video dự phòng nếu mạng hỏng.

**Gợi ý trình chiếu:** Chạy thật trên `localhost:3000`. Đăng nhập sẵn:
`staff@gym.com` / `Staff@123456`.

**Thời lượng:** 0:44 *(phần demo thực thi ngoài kịch bản lời nói)*

---

## Slide 20 — Ưu điểm & điểm khác biệt

**Slide**
```
ĐIỂM MẠNH SO VỚ MỘT ĐỒ ÁN QUẢN LÝ THÔNG THƯỜNG

✔ NHẬN DIỆN KHUÔN MẶT CHẠY 100% PHÍA CLIENT
  → dữ liệu sinh trắc học không rời khỏi máy; server không tốn CPU suy luận
  → khắc phục đúng rủi ro pháp lý lớn nhất

✔ CHẤT LƯỢNG ĐẦU VÀO CÓ KIỂM SOÁT
  → chặn ảnh mờ / lệch khung / đeo kính trước khi ghi vào DB
  → cắt ảnh tham chiếu đúng vùng mặt, có xem trước cho lễ tân

✔ NHẬT KÝ HỆ THỐNG 40 LOẠI HÀNH ĐỘNG
  → truy vết được mọi thao tác xoá/sửa — không chỉ ghi "ai login"

✔ NGHIỆP VỤ TIỀN CÓ TRANSACTION + RÀNG BUỘC DB
  → transaction trong ghi tiền, @unique chặn trùng khóa nghiệp vụ
```

**Lời nói**
Em tóm tắt bốn điểm khác biệt. Một: nhận diện khuôn mặt chạy hoàn toàn phía client — không chỉ tối ưu hiệu năng mà còn khắc phục đúng rủi ro pháp lý lớn nhất, vì dữ liệu không rời khỏi máy người dùng. Hai: có kiểm soát chất lượng đầu vào — chặn ảnh mờ, ảnh lệch khung, ảnh có kính trước khi ghi vào cơ sở dữ liệu; đây là ba lỗi em thực sự tìm ra khi thử trên máy thật. Ba: nhật ký 40 loại hành động nên truy vết được mọi thao tác sửa hay xoá. Và bốn: nghiệp vụ tiền có transaction và ràng buộc ở tầng cơ sở dữ liệu.

**Gợi ý trình chiếu:** Không cần ảnh — đây là slide lời, tập trung vào việc nói.

**Thời lượng:** 0:47

---

## Slide 21 — Hạn chế

**Slide**
```
NHỮNG PHẦN CHƯA HOÀN THIỆN — em nói thẳng

✗ Chưa có test tự động dạng unit/integration (Jest)
   → hiện kiểm thử bằng script smoke + Playwright, chạy thủ công
✗ Chưa triển khai môi trường thật
   → mới chạy localhost + PostgreSQL native, chưa có HTTPS
✗ Chưa có Redis / cache / chống tải phân tán
   → báo cáo tổng hợp trực tiếp từ DB
✗ MoMo / VNPay mới ở mức stub, chưa nối API cổng thật
✗ Nhận dạng khuôn mặt chạy ở trình duyệt → phụ thuộc độ mạnh máy tính quầy
✗ Đa chi nhánh mới ở mức dữ liệu mẫu, chưa tách báo cáo theo chi nhánh thật
✗ Bước kiểm tra đeo kính cần Azure AI Vision — hiện chưa cấu hình key nên
   đang tự bỏ qua theo thiết kế fail-open
```

**Lời nói**
Em nói thẳng những phần chưa hoàn thiện. Chưa có test tự động dạng unit và integration — đây là hạn chế lớn nhất, hiện dùng script smoke và Playwright phải chạy thủ công. Chưa triển khai lên môi trường thật, mới chạy localhost và chưa có HTTPS. Chưa có Redis nên báo cáo đọc thẳng từ cơ sở dữ liệu, sẽ chậm khi dữ liệu lớn. MoMo và VNPay mới ở mức khung. Nhận dạng khuôn mặt chạy ở trình duyệt nên phụ thuộc độ mạnh máy tính ở quầy. Đa chi nhánh mới ở mức dữ liệu mẫu. Và em vừa thêm bước kiểm tra đeo kính bằng dịch vụ Azure, nhưng chưa cấu hình được khóa nên hệ thống đang tự bỏ qua bước này — em nói rõ vì nếu không nói thì các thầy cô sẽ tưởng tính năng đang chạy.

**Gợi ý trình chiếu:** Không tô đỏ toàn bộ — hãy dùng màu nhấn nhẹ. Sự thành
thật ở slide này thường gây ấn tượng tốt hơn việc giấu giới hạn.

**Thời lượng:** 0:58

---

## Slide 22 — Hướng phát triển

**Slide**
```
ƯU TIÊN THEO THỨ TỰ

1. TEST TỰ ĐỘNG
   Unit + e2e trong CI, mục tiêu coverage 70%+  → khép lại hạn chế lớn nhất

2. HẠ TẦNG TRIỂN KHAI
   Docker Compose · Nginx reverse proxy · HTTPS · sao lưu DB tự động

3. HIỆU NĂNG
   Redis cache cho báo cáo · rate limit dùng chung nhiều instance
   · đọc số liệu dashboard bằng WebSocket thay vì tải lại trang

4. MỞ RỘNG NGHIỆP VỤ
   Nối cổng thanh toán thật (VNPay/MoMo) · ví điện tử
   · tách báo cáo theo chi nhánh thật sự

5. SẢN PHẨM
   Ứng dụng mobile hội viên (React Native) quét QR check-in
   · đồng bộ dữ liệu khi mất mạng
```

**Lời nói**
Từ đó em đề xuất lộ trình theo thứ tự ưu tiên. Cao nhất là test tự động, vì đây là hạn chế lớn nhất và có nó thì các giai đoạn mở rộng sau mới an toàn. Sau đó là hạ tầng triển khai: Docker, Nginx reverse proxy, HTTPS và sao lưu cơ sở dữ liệu tự động — vì một hệ thống xử lý dữ liệu hội viên mà không sao lưu thì rủi ro mất dữ liệu là thực tế. Về hiệu năng, thêm Redis để cache báo cáo và dùng WebSocket để dashboard cập nhật trực tiếp. Cuối cùng là ứng dụng mobile để hội viên check-in bằng mã QR.

**Gợi ý trình chiếu:** Lộ trình ngang 5 mốc, dùng biểu tượng timeline.

**Thời lượng:** 0:46

---

## Slide 23 — Bài học kinh nghiệm

**Slide**
```
BA BÀI HỌC EM RÚT RA — và đều đến từ lỗi thực tế, không phải từ lý thuyết

1. RÀNG BUỘC NGHIỆP VỤ PHẢI NẰM Ở TẦNG THẤP NHẤT
   1 số điện thoại tạo được 3 tài khoản
   → thêm @unique vào schema + bắt lỗi trả về 409 kèm thông tin dễ hiểu

2. NGƯỠNG ĐÚNG PHẢI ĐO, KHÔNG ĐOÁN
   Ngưỡng chất lượng ảnh đặt quá dễ → chụp được cả mặt mờ, ảnh cắt sai vùng
   → phải thử với webcam thật và xem lại ảnh kết quả

3. TÍNH NĂNG CÓ YẾU TỐ PHÁP LÝ PHẢI ĐƯỢC XEM LẠI TỪ ĐẦU
   Văn bản đồng ý ghi "không chia sẻ cho bên thứ ba" — sai ngay khi thêm
   bước kiểm tra đeo kính. Công nghệ thay đổi thì nghĩa vụ thông báo
   cũng phải thay đổi theo.
```

**Lời nói**
Em chia sẻ ba bài học, cả ba đến từ lỗi thực tế chứ không từ lý thuyết. Một: ràng buộc nghiệp vụ phải nằm ở tầng thấp nhất — em chỉ kiểm tra ở tầng ứng dụng mà quên ràng buộc ở database, nên một số điện thoại tạo được ba tài khoản; cách sửa đúng không phải thêm một lần kiểm tra nữa mà là đưa ràng buộc xuống tầng thấp hơn. Hai: ngưỡng phải đo chứ không đoán — em đặt ngưỡng chất lượng ảnh quá dễ, và hệ thống thành công một cách nguu dốt, chụp được cả mặt mờ và cắt sai vùng ảnh; chỉ khi xem lại ảnh kết quả bằng mắt mới thấy vấn đề. Ba: tính năng có yếu tố pháp lý phải được xem lại từ đầu — văn bản đồng ý viết là không chia sẻ cho bên thứ ba là đúng ở thời điểm đó, nhưng thêm bước kiểm tra đeo kính thì nó thành sai. Công nghệ thay đổi thì nghĩa vụ thông báo cũng phải thay đổi theo.

**Gợi ý trình chiếu:** Không cần ảnh. Slide lời — để hội đồng tập trung vào nội dung.

**Thời lượng:** 1:12

---

## Slide 24 — Kết luận

**Slide**
```
KẾT LUẬN

✔ ĐÃ HOÀN THÀNH
  Hệ thống quản lý & vận hành phòng tập gym đầy đủ nghiệp vụ
  11 nhóm chức năng · 161 API · 20 model · 5 vai trò
  242 file · 40.319 dòng · kiểm thử 76/76 API + 228 lượt QA giao diện
  Điểm nhấn: nhận diện khuôn mặt FACE_ID chạy 100% phía client
            + nhật ký hệ thống 40 loại hành động, tuân thủ NĐ 13/2023

✔ GIÁ TRỊ THỰC TẾ
  Sổ bấm thẻ giấy → hệ thống số hoá
  Không còn tranh chấp dữ liệu khi có khiếu nại
  Tổng hợp doanh thu từ vài giờ → vài giây
```

**Lời nói**
Em tổng kết. Đồ án đã hoàn thành các mục tiêu: hệ thống quản lý vận hành phòng tập với đầy đủ nghiệp vụ, gồm 11 nhóm chức năng, 161 API, 20 mô hình dữ liệu và 5 vai trò phân quyền, trên 242 file và hơn 40 nghìn dòng mã. Chất lượng được kiểm chứng: 76 trên 76 smoke test và 228 lượt kiểm tra giao diện đều đạt. Điểm nhấn kỹ thuật là nhận diện khuôn mặt chạy hoàn toàn phía client và nhật ký 40 loại hành động, tuân thủ Nghị định 13. Về giá trị thực tế, quy trình sổ bấm thẻ giấy đã được số hoá, khiếu nại về hồ sơ thì có dữ liệu để đối chiếu, và tổng hợp doanh thu rút từ vài giờ xuống còn vài giây.

**Gợi ý trình chiếu:** Không cần ảnh.

**Thời lượng:** 0:54

---

## Slide 25 — Cảm ơn

**Slide**
```
XIN CẢM ƠN THẦY CÔ VÀ CÁC BẠN!

                    "Hệ thống tốt không phải là hệ thống có nhiều tính năng nhất,
                     mà là hệ thống giúp con người ít phải làm sai hơn."

Em sẵn sàng nhận câu hỏi của hội đồng ạ.
```

**Lời nói**
Em xin cảm ơn quý thầy cô và các bạn đã lắng nghe. Em muốn gửi lại câu này: theo em, một hệ thống tốt không phải là hệ thống có nhiều tính năng nhất, mà là hệ thống giúp con người ít phải làm sai hơn — và đó cũng là lý do em xây dựng nhật ký hệ thống cùng ràng buộc ở tầng cơ sở dữ liệu. Em sẵn sàng nhận câu hỏi của hội đồng ạ.

**Gợi ý trình chiếu:** Để trang chiếu tối giản, chỉ chữ trắng + 1 dòng nhấn mạnh.

**Thời lượng:** 0:32

---

# ĐỐI CHIẾU THỜI GIAN

| Slide | Nội dung | Từ | Thời lượng | Dùng khi 20′ |
| ---: | :--- | ---: | ---: | :--- |
| 1 | Bìa đề | 81 | 0:32 | ✓ |
| 2 | Vấn đề thực tế | 100 | 0:40 | ✓ |
| 3 | Mục tiêu & phạm vi | 61 | 0:24 | ✓ |
| 4 | Phân tích yêu cầu chức năng | 77 | 0:31 | ✓ |
| 5 | Công nghệ chọn và lý do | 79 | 0:32 | ✓ |
| 6 | Kiến trúc tổng thể | 97 | 0:39 | ✓ |
| 7 | Mô hình dữ liệu | 90 | 0:36 | ✓ |
| 8 | Phân quyền RBAC | 93 | 0:37 | ✓ |
| 9 | Đăng ký hội viên 2 bước (xác minh email) | 106 | 0:42 | ✓ |
| 10 | Thanh toán & hóa đơn | 119 | 0:48 | ✓ |
| 11 | Check-in thời gian thực | 106 | 0:42 | ✓ |
| **12** | **ĐIỂM NHẤN: Nhận diện khuôn mặt FACE_ID** | 168 | 1:07 | ✓ |
| **13** | **FACE_ID: Tuân thủ pháp luật (NĐ 13/2023)** | 195 | 1:18 | ✓ |
| **14** | **Nhật ký hệ thống (Audit Log)** | 158 | 1:03 | ✓ |
| 15 | Các nhóm chức năng còn lại | 108 | 0:43 | bỏ |
| 16 | Giao diện & hệ thống thiết kế | 106 | 0:42 | bỏ |
| 17 | Bảo mật | 119 | 0:48 | ✓ |
| 18 | Kết quả kiểm thử | 160 | 1:04 | ✓ |
| 19 | Demo trực tiếp | 109 | 0:44 | ✓ |
| 20 | Ưu điểm & điểm khác biệt | 117 | 0:47 | bỏ |
| 21 | Hạn chế | 146 | 0:58 | ✓ |
| 22 | Hướng phát triển | 114 | 0:46 | ✓ |
| 23 | Bài học kinh nghiệm | 181 | 1:12 | ✓ |
| 24 | Kết luận | 136 | 0:54 | ✓ |
| 25 | Cảm ơn | 80 | 0:32 | ✓ |

| | **Bản rút gọn (22 slide)** | **2575** | **17:09** | |
| | Cộng demo trực tiếp 3:00 | | **20:09** | |
| | *Bản đầy đủ (25 slide)* | *2906* | *22:21* | *nói hết* |

> Cột "Từ" và "Thời lượng" được **đo tự động** từ chính phần "Lời nói" bằng script
> đếm từ, quy ra 150 từ/phút — đây là tốc độ nói bình thường khi luyện tập.
>
> **Nếu hội đồng cho đúng 20 phút:** bỏ slide 15, 16 và 20, còn lại 20:09.
> Ba slide đó là phần "bổ sung", bỏ đi không mất mạch chính.
>
> **Nếu được 25 phút:** trình bày đủ 25 slide, tổng 22:21.
>
> **Dự phòng:** nếu đang nói mà bị trễ, hãy bỏ slide 7 (mô hình dữ liệu) và
> slide 22 (hướng phát triển) — hai slide này nói nhanh cũng được vì bảng trên
> slide đã tự truyền đạt thông tin.

---

# PHỤ LỤC HỎI ĐÁP DỰ PHÒNG

### 1. Tại sao chọn NestJS mà không dùng ExpressJS?

NestJS bản chất là framework xây trên Express, nhưng đi kèm ba thứ em cần: hệ
thống module với dependency injection, guard và interceptor. Trong dự án này em
cần phân quyền 5 vai trò ở 161 endpoint — nếu tự viết bằng Express thì logic kiểm
tra quyền sẽ lặp lại ở từng route và rất dễ sót. Với NestJS em khai báo decorator
`@Roles` ngay trên controller, guard lo phần kiểm tra. Nếu quy mô nhỏ hơn nhiều
thì em cũng sẽ chọn Express để đơn giản hơn.

### 2. Vì sao chọn PostgreSQL mà không dùng MySQL?

Ba lý do. Một là hỗ trợ transaction và cách ly mức tốt — quan trọng với nghiệp vụ
tiền. Hai là ràng buộc `unique` cho phép nhiều giá trị NULL cùng tồn tại, đúng nhu
cầu "nhân viên không bắt buộc khai số điện thoại". Ba là hỗ trợ JSONB tốt, phục vụ
trường `metadata` của nhật ký hệ thống. Nếu quen MySQL hơn thì em có thể chuyển,
vì Prisma che gần hết khác biệt.

### 3. Tại sao không dùng machine learning để kiểm tra đeo kính?

Em đã xem xét. Thư viện đang dùng ở máy không có model nhận diện kính — bật module
`gear` của nó thực chất là dự đoán tuổi và giới tính, không liên quan gì đến kính,
mà em không muốn dùng dữ liệu nhạy cảm đó. Phương án cuối cùng em chọn là gọi
Azure AI Vision, dùng đúng thao tác Detect nên không cần đăng ký quyền truy cập
giới hạn. Em cũng thiết kế để nếu dịch vụ lỗi thì hệ thống bỏ qua, tuyệt đối
không chặn hội viên.

### 4. Có thể bị đánh cắp dữ liệu khuôn mặt không?

Về phía truyền tải, hệ thống dùng HTTPS ở môi trường thật và mọi request đều qua
guard xác thực. Điểm quan trọng là **vector khuôn mặt được tạo ngay trên trình
duyệt**, nên dữ liệu gốc không rời khỏi máy người dùng, chỉ có dãy 1024 số được
gửi lên. Ngoài ra mỗi hội viên có thể tự xoá dữ liệu của mình bất cứ lúc nào,
và mọi thao tác quản trị đều được ghi vào nhật ký hệ thống.

### 5. Hệ thống có bị chặn nếu người dùng cố dò mật khẩu?

Có, và đây là lớp em chủ động thêm. Toàn cục giới hạn 300 request mỗi phút, riêng
API đăng nhập chỉ cho 10 lần trong 60 giây theo địa chỉ IP. Ngoài ra mật khẩu được
hash bằng bcrypt mười vòng nên kể cả có rò rỉ cơ sở dữ liệu thì cũng không đọc
được mật khẩu gốc.

### 6. Hệ thống có mở rộng được cho nhiều chi nhánh không?

Về mô hình dữ liệu thì có — bảng `Branch` và `Room` đã được thiết kế từ đầu, và
thông báo cũng đã hỗ trợ gửi theo chi nhánh cụ thể. Nhưng em nói thẳng là phần
báo cáo phân tách theo chi nhánh thì **chưa hoàn thiện**, hiện mới có dữ liệu mẫu
3 chi nhánh. Đây là việc em đã đưa vào lộ trình phát triển.

### 7. Tại sao chọn modular monolith mà không tách microservice?

Vì quy mô một phòng tập không cần phân tán. Tách microservice lúc này sẽ thêm
chi phí vận hành điều phối, xử lý giao dịch phân tán và triển khai mà chưa mang lại
lợi ích hiệu năng nào. Em chọn modular monolith — tách 12 module bằng interface —
để khi thực sự cần mở rộng thì tách module đó ra service riêng mà không phải viết
lại. Phần có khả năng tách trước nhất là module báo cáo, vì nó nặng và ít phụ thuộc.

### 8. Nếu cơ sở dữ liệu chết giữa chừng thì sao?

Với nghiệp vụ tiền, em xử lý bằng transaction: ghi giao dịch và sinh hoá đơn cùng
lúc, thành công thì cả hai, thất bại thì không cái nào được ghi — không có
trạng thái "đã nhận tiền nhưng không có hoá đơn". Với phần khác, Prisma khai báo
quan hệ và ràng buộc khóa ngoại ở tầng database nên dữ liệu không thể ở trạng
thái nửa vời. Tất nhiên em cũng thừa nhận đồ án chưa thiết lập sao lưu tự động —
đây là hạn chế em đã liệt kê.

### 9. 228 lượt kiểm tra giao diện thì con số đó có ý nghĩa không?

Ý nghĩa của nó là **tiêu chí kiểm tra**, không chỉ là con số. Ba điều em kiểm ở
mỗi lượt: không có lỗi trong console của trình duyệt, không có request nào trả
mã lỗi từ 400 trở lên, và không có phần tử nào tràn ra ngoài bề rộng màn hình.
Điều kiện thứ ba là lý do em chọn sáu kích thước màn hình thay vì chỉ test desktop
— lỗi tràn ngang chỉ xuất hiện ở một số độ rộng nhất định. Tất nhiên em thừa nhận
đây là kiểm thử tự động bằng script, chưa phải unit test, và chưa có độ phủ mã
nguồn.

### 10. Hệ thống xử lý được bao nhiêu người dùng?

Em chưa đo tải thực nghiệm, nên em không dám đưa ra con số cụ thể — em nghĩ nói
thẳng không biết còn tốt hơn bịa ra. Điều em có thể nói là: phần đọc nặng nhất là
báo cáo tổng hợp chưa có cache, nên khi dữ liệu lên hàng triệu bản ghi thì phần
này sẽ là điểm nghẽn. Vì vậy Redis cache và tách báo cáo ra service riêng là hai
việc em xếp ưu tiên trong lộ trình.

### 11. Tại sao hàm ghi nhật ký lại cho phép lỗi bỏ qua?

Đây là đánh đổi có chủ ý và em đã trình bày ở slide 14. Lý do: nếu nhật ký hỏng
mà nghiệp vụ chính cũng dừng, thì thiệt hại lớn hơn nhiều. Chọn hướng ngược lại,
người quản trị sẽ mất dấu vết, nhưng dữ liệu tài chính và hồ sơ hội viên vẫn an
toàn. Em chấp nhận mất độ đầy đủ để bảo vệ tính đúng đắn của phần dữ liệu chính.
Để không bị bỏ qua trong im lặng, mỗi lần ghi lỗi vẫn in cảnh báo ra log hệ thống.

### 12. Nếu thêm tính năng mới thì đồ án này còn đúng với đề tài không?

Em nghĩ đề tài vẫn đúng vì trọng tâm là quản lý vận hành phòng tập, còn các tính
năng em thêm vào đều phục vụ trực tiếp cho mục tiêu đó. Ví dụ bước kiểm tra đeo
kính sinh ra từ chính nhu cầu chất lượng dữ liệu của tính năng nhận diện khuôn
mặt. Điều em cố giữ là mọi tính năng đều gắn với một bài toán nghiệp vụ cụ thể,
không thêm công nghệ chỉ để có công nghệ.
