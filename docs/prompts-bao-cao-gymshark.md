# Bộ prompt NotebookLM — Báo cáo đồ án GymShark

> Mục đích: mỗi prompt tương ứng **một mục trong mục lục** của file PDF mẫu (`Gym master.pdf`), nhưng ép NotebookLM viết về **đúng dự án GymShark hiện tại**, không sao chép đề tài EMS trong mẫu.
>
> Giả định: "Notebook AI" = NotebookLM (hoặc công cụ tương tự nhận nguồn + prompt). Cứ dán từng prompt vào khung chat, đính kèm nguồn như phần gợi ý.

---

## 0. Cách dùng & quy tắc chung (đọc trước)

### 0.1. Chuẩn bị nguồn

NotebookLM xử lý tốt `.md`, `.txt`, `.pdf`. Nếu công cụ không nhận `.prisma` / `.ts` / `.tsx`, hãy copy nội dung file đó vào một file `.md` (giữ nguyên code trong khung code) rồi upload. Nên gộp theo cụm để đỡ tốn lượt upload:

| Cụm nguồn | File nên đính kèm |
| :--- | :--- |
| **A — Tổng quan** | `README.md`, `module.md`, `Architechture.md`, `AGENTS.md`, `skill.md`, `frontend/package.json`, `backend/package.json` |
| **B — Thiết kế** | `backend/prisma/schema.prisma`, `backend/src/common/constants/db-enums.ts`, `backend/src/common/enums/role.enum.ts`, `backend/prisma/seed.ts`, `DESIGN_SYSTEM.md` |
| **C — Backend** | `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/common/**`, `backend/src/modules/**/\*.controller.ts`, `*.service.ts` của các module tương ứng |
| **D — Frontend** | `frontend/src/app/**/page.tsx`, `frontend/src/services/*.ts`, `frontend/src/components/**`, `frontend/src/lib/axios.ts`, `frontend/src/middleware.ts` |
| **E — Kiểm thử** | `README.md` (mục Kết quả kiểm thử), `.github/workflows/ci.yml`, các script QA trong thư mục `Temp/opencode/pw/` nếu bạn upload được |

> Mẹo: upload Cụm A + B một lần, dùng cho các prompt từ 01 đến 19. Upload thêm C + D cho các prompt 20 trở đi. Nếu notebook bị đầy, tạo notebook mới theo chương.

### 0.2. Đánh số lại so với PDF mẫu

PDF mẫu bị lặp số (Lời mở đầu dùng 1.1–1.4, Chương 1 cũng dùng 1.1–1.4; thân bài lại ghi "Chương 2 / Chương 3" cho triển khai và kiểm thử). Bộ prompt này dùng **đánh số sạch**: Lời mở đầu (0.1–0.4) → Chương 1 (1.1–1.4) → Chương 2 (2.1–2.4) → Chương 3 (3.1–3.4) → Chương 4 (4.1–4.8) → Chương 5 (5.1–5.4) → Phụ lục. Nếu bạn muốn giữ y hệt mẫu, sửa số trong prompt cho khớp mục lục Word của bạn.

### 0.3. Prompt chung — dán vào "Custom instructions"/"Prompt mặc định", hoặc thêm vào đầu mỗi prompt

```text
Bạn là trợ lý biên tập báo cáo đồ án tốt nghiệp cho dự án "GymShark / GymMaster Pro — Hệ thống Quản lý & Vận hành Phòng tập Gym (Full-Stack)".

NGUỒN & ĐỘ TIN CẬY:
- Chỉ dùng thông tin có trong các nguồn tôi đính kèm. Không bịa module, API, bảng, số liệu, tên trường, mã lỗi hay kết quả kiểm thử.
- Khi các nguồn mâu thuẫn, ưu tiên theo thứ tự: (1) mã nguồn thực tế (schema.prisma, package.json, controller/service, main.ts), (2) DESIGN_SYSTEM.md / AGENTS.md / skill.md, (3) module.md / Architechture.md, (4) README.md. Nếu vẫn mâu thuẫn, ghi rõ một dòng "Điểm cần đối chiếu: ..." ở cuối mục.
- Ví dụ mâu thuẫn đã biết: README có chỗ ghi "dark-only" và "chưa tích hợp email" nhưng DESIGN_SYSTEM.md mô tả 2 theme sáng/tối còn code đã có nodemailer + EmailVerification; README ghi 35 model nhưng schema.prisma có 36 model (kể cả BeverageLocation @ignore); AGENTS.md còn nhắc gỡ thiết bị nhưng schema vẫn có Equipment/EquipmentMaintenance. Hãy bám code và nêu đối chiếu.
- QUY ƯỚC RIÊNG VỀ THANH TOÁN (rất quan trọng): web chỉ hỗ trợ thu tiền **CASH (tiền mặt) và BANK_TRANSFER (chuyển khoản)** do lễ tân/quản lý xác nhận thủ công. **KHÔNG viết rằng web có thanh toán MoMo/VNPay/thẻ**: enum `PaymentMethod` có `MOMO`/`VNPAY` trong code, `MomoGateway` là stub (`integrated: false`), VNPay không có gateway, còn các option MoMo/VNPAY ở giao diện cũ chỉ là demo/bị `disabled` và dữ liệu seed là dữ liệu mẫu. `module.md` có nhắc "MOMO/VNPAY stub" — đó là mô tả kiến trúc lỗi thời (README.md đã sửa lại), phải bám luồng đăng ký thật `frontend/src/app/(member)/member/register-membership/[packageId]/page.tsx` và gateway `cash.gateway.ts` / `bank-transfer.gateway.ts`. Có thể nhắc MoMo/VNPay như **định hướng tương lai** (mục 5.4) nhưng tuyệt đối không coi là tính năng đã triển khai.

CHỐNG SAO CHÉP MẪU:
- File PDF mẫu là đề tài EMS (Event Management System). Nó chỉ là KHUNG HÌNH THỨC (cấu trúc mục, văn phong, kiểu bảng biểu), KHÔNG phải dữ liệu.
- Tuyệt đối không viết TypeORM, SQL Server 2019, Clean Architecture 4 lớp domain/application/infrastructure/presentation, EventRequests, Quotations, Contracts, "Chuyên viên Sự kiện", "Lãnh đạo Trung tâm" — đó là của mẫu.
- Dự án này dùng: NestJS 10 + Prisma 5 + SQL Server 2022, mô hình "module-based monolith" (AppModule import các feature module), Next.js 14 App Router, Tailwind CSS 3, TanStack Query v5, Socket.IO, JWT + RBAC 5 vai trò ADMIN/MANAGER/STAFF/TRAINER/MEMBER.

QUY ƯỚC VIẾT:
- Tiếng Việt, văn phong báo cáo học thuật nhưng rõ ràng; không dùng emoji; không nói "tôi", dùng "đề tài", "hệ thống", "tác giả".
- Gắn tên file/đường dẫn cụ thể khi nói về hiện thực (ví dụ backend/prisma/schema.prisma). Mọi tên lớp, hàm, endpoint, trạng thái phải khớp nguồn.
- Nếu thông tin bị thiếu, chèn [CẦN BỔ SUNG: ...] ngay tại chỗ — không tự chế.
- Không viết "đạt 100%", "hoàn hảo", "không có lỗi" khi nguồn không khẳng định; dẫn số liệu kèm nguồn, ví dụ "(theo README.md)".
- Output Markdown, dùng heading theo đúng cấp mục tôi yêu cầu, có bảng khi liệt kê, có đoạn kết luận ngắn ở cuối mục.
```

---

## PHẦN A — LỜI MỞ ĐẦU

### A1. Mục 0.1 — Lý do chọn đề tài

```text
Viết mục 0.1 "Lý do chọn đề tài" cho báo cáo đồ án GymShark. Bám sát lối viết của mục 1.1 trong PDF mẫu (từ bối cảnh chuyển đổi số → nỗi đau quản lý thủ công → khoảng trống giải pháp → tên đề tài được chọn), nhưng nội dung phải là ngành phòng tập gym.

Cấu trúc bắt buộc:
1) Bối cảnh: nhu cầu tập luyện sau dịch, mô hình phòng tập/ chuỗi phòng tập, áp lực vận hành.
2) Thực trạng thủ công: quản lý hội viên bằng Excel/Zalo, thẻ tập giấy, tính tiền và đối soát ca bằng tay, check-in ghi sổ, thiếu lịch sử thanh toán và nhật ký thao tác.
3) Khoảng trống công nghệ: các app fitness phổ biến thiên về bán lẻ/booking lớp, chưa giải quyết trọn vẹn "hậu trường" của phòng gym Việt Nam (hội viên + thẻ + tiền + ca trực + PT + thiết bị + sinh trắc học).
4) Khẳng định lựa chọn: nêu tên đề tài "Xây dựng hệ thống Quản lý & Vận hành Phòng tập Gym theo mô hình module-based monolith, tích hợp check-in sinh trắc học và báo cáo thời gian thực" (có thể chỉnh tên cho khớp đề tài của tôi nếu nguồn ghi khác).

Dẫn chứng cụ thể từ nguồn: các vấn đề mà module.md và README.md liệt kê (đăng ký 2 bước có mã xác minh email, luồng PENDING → ACTIVE, hoàn tiền qua MembershipChangeRequest, ca làm đối chiếu tiền mặt, FaceEmbedding cần consent theo Nghị định 13/2023/NĐ-CP).

Độ dài 500–700 chữ. Áp dụng prompt chung.
```

### A2. Mục 0.2 — Mục tiêu nghiên cứu

```text
Viết mục 0.2 "Mục tiêu nghiên cứu" cho đồ án GymShark, theo cấu trúc 2 phần "Về mặt lý thuyết" / "Về mặt thực tiễn" như PDF mẫu nhưng đổi nội dung cho phù hợp.

- Lý thuyết: vận dụng Agile/Scrum; phân tích và lựa chọn kiến trúc module-based monolith với NestJS thay vì áp đặt Clean Architecture 4 lớp; thiết kế CSDL quan hệ chuẩn 3NF trên SQL Server 2022 qua Prisma; mô hình hóa quy trình bằng Use Case / Activity Diagram / ERD; xem xét bảo mật dữ liệu nhạy cảm (sinh trắc học theo NĐ 13/2023/NĐ-CP).
- Thực tiễn: liệt kê các khả năng có thật trong nguồn — cổng công khai + 3 cổng người dùng (/admin, /member, /trainer) + kiosk; đăng ký hội viên xác minh email; vòng đời thẻ tập PENDING→ACTIVE; thu tiền CASH/BANK_TRANSFER có xác nhận thủ công tại quầy kèm hóa đơn; check-in MANUAL/STAFF/FACE_ID; lịch tập PT/lớp nhóm; HLV, dinh dưỡng, chat realtime; ca làm & POS nước uống; thông báo, báo cáo, audit log. Không liệt kê thanh toán MoMo/VNPay vào tính năng (xem quy ước thanh toán trong prompt chung).

Chốt bằng 1 đoạn ngắn nêu sản phẩm đầu ra là Web App + REST API/Swagger, chạy localhost:3000 và :3001/api. Mỗi luồng tính năng phải có tên module/đường dẫn đối ứng trong ngoặc đơn. Độ dài 450–600 chữ. Áp dụng prompt chung.
```

### A3. Mục 0.3 — Đối tượng và phạm vi nghiên cứu

```text
Viết mục 0.3 "Đối tượng và phạm vi nghiên cứu" cho đồ án GymShark.

Đối tượng nghiên cứu gồm 3 nhóm, mô tả rõ từng nhóm:
(1) Quy trình nghiệp vụ thực tế của phòng tập: đăng ký → xác minh → hồ sơ hội viên → gói tập/Payment/Invoice → check-in/check-out → phân công HLV/lịch tập → chấm ca & bán nước → báo cáo/audit.
(2) Nguyên lý thiết kế phần mềm: module-based monolith, tầng common (guards/decorators/filters/interceptors), Prisma ORM, phân quyền RBAC 5 vai trò, realtime Socket.IO.
(3) Hệ sinh thái công nghệ: NestJS 10, Prisma 5, SQL Server 2022, Next.js 14 App Router, React 18, TypeScript, Tailwind CSS 3, TanStack Query v5, Axios, Socket.IO, @vladmandic/human 3.3.6.

Phạm vi nghiên cứu phải nói rõ cái CÓ và cái KHÔNG:
- CÓ: quản trị nội bộ + cổng hội viên/HLV + website công khai; nhận diện khuôn mặt 1:1 và 1:N chạy client-side; dữ liệu cá nhân có consent.
- KHÔNG: thanh toán MoMo/VNPay/thẻ trên web (không có cổng thật; option bị disable hoặc chỉ là thiết kế demo, enum/stub chỉ là nền tảng code), ứng dụng di động native, hệ thống thanh toán bảo hiểm/hoá đơn điện tử thuế, tích hợp thiết bị IoT tập luyện, multi-branch (đã gộp về một địa điểm theo migration sqlserver-remove-branch-management.sql — kiểm tra lại trong nguồn trước khi khẳng định).

Độ dài 400–550 chữ, có 2 bảng nhỏ: "Đối tượng" và "Phạm vi". Áp dụng prompt chung.
```

### A4. Mục 0.4 — Phương pháp nghiên cứu

```text
Viết mục 0.4 "Phương pháp nghiên cứu" cho đồ án GymShark theo đúng 4 phương pháp của PDF mẫu nhưng diễn giải bằng ngữ cảnh dự án:

1) Khảo sát thực tế: quan sát quy trình lễ tân, thu ngân, HLV; thu thập biểu mẫu đăng ký, phiếu thu, sổ check-in. Nêu rõ đây là giả định thiết kế nếu nguồn không có tài liệu khảo sát thực địa — đánh dấu [CẦN BỔ SUNG: phiếu khảo sát/ảnh biểu mẫu thực tế].
2) Mô hình hóa Agile: user story → backlog theo Sprint (gợi ý 9 Sprint/Kỳ như lịch sử WORKLOG nếu có trong nguồn; nếu không, chỉ nói chia Sprint 1–2 tuần, không bịa số).
3) Phân tích & thiết kế hệ thống: UML Use Case, Activity Diagram, ERD, chuẩn hóa 1NF/2NF/3NF, thiết kế DTO + class-validator.
4) Kiểm chứng thực nghiệm: typecheck/lint/format/build, smoke API, QA Playwright nhiều viewport, kiểm tra phân quyền và rate limit — dẫn kết quả có trong README.md, không tự nâng số.

Mỗi phương pháp có 1 đoạn "Sản phẩm đầu ra của phương pháp này là ...". Độ dài 450–600 chữ. Áp dụng prompt chung.
```

---

## CHƯƠNG 1 — TỔNG QUAN ĐỀ TÀI VÀ KHẢO SÁT HỆ THỐNG

### A5. Mục 1.1 — Đặt vấn đề và tình hình ứng dụng công nghệ

```text
Viết mục 1.1 cho báo cáo GymShark, gồm 1.1.1 "Tình hình ứng dụng trong nước" và 1.1.2 "Tình hình ứng dụng ngoài nước".

Mở đầu bằng một đoạn đặt vấn đề: ngành fitness Việt Nam tăng trưởng, phòng tập chuyển từ bán thẻ sang vận hành dữ liệu hội viên; "hậu trường" (thủ tục, tiền, ca trực, tiến trình tập) vẫn rời rạc.

1.1.1 Trong nước: nêu thực trạng dùng Excel, Zalo, phần mềm thu ngân đơn lẻ; các SaaS quản lý gym nội địa thường tập trung bán thẻ/đặt lịch, ít gắn ca làm, hoàn tiền có phê duyệt và audit log. Có thể nêu tên sản phẩm đại diện nếu nguồn có; nếu không, nói chung chung và đánh dấu [CẦN BỔ SUNG: tên đối thủ cụ thể cần khảo sát].
1.1.2 Ngoài nước: nêu xu hướng SaaS (Mindbody, ClassPass, Gymmaster... — chỉ liệt kê nếu bạn đính kèm nguồn website hoặc tự điền vào nguồn; nếu không có nguồn thì viết ở mức "các nền tảng Event/Fitness Tech quốc tế" và đánh dấu [CẦN BỔ SUNG]). Nhấn mạnh điểm mạnh (booking, thanh toán, app người dùng) và điểm không phù hợp (chi phí, đặc thù tiền mặt/QR chuyển khoản tại quầy ở Việt Nam).

Kết thúc bằng 1 đoạn chuyển tiếp sang khảo sát phần mềm ở mục 1.2. Độ dài 700–900 chữ. Áp dụng prompt chung.
```

### A6. Mục 1.2 — Khảo sát các hệ thống/phần mềm liên quan

```text
Viết mục 1.2 cho đồ án GymShark, gồm 1.2.1 "Khảo sát các hệ thống thương mại quốc tế" và 1.2.2 "Khảo sát các nền tảng quản trị nội bộ tổng hợp".

Đối chiếu với cách PDF mẫu khảo sát Eventbrite/Cvent và Base/1Office, nhưng đổi sang miền fitness:
- Nhóm quốc tế: Mindbody, ClassPass, Gymmaster (hoặc tương đương) — phân tích mạnh về booking, membership, app hội viên, thanh toán; yếu về ca làm lễ tân, đối soát tiền mặt, hoàn tiền phê duyệt.
- Nhóm nội bộ Việt Nam: Base.vn, 1Office — mạnh về luồng duyệt, nhật ký, giao việc; yếu về nghiệp vụ gym (thẻ tập, check-in sinh trắc học, quota PT).

Bắt buộc tạo bảng "Bảng 1.1 — Bảng khảo sát" với các cột: STT | Hệ thống | Đối tượng hướng tới | Tính năng nổi bật | Điểm chưa đáp ứng với bài toán GymShark. Ghi chú dưới bảng rằng thông tin khảo sát cần được trích dẫn từ nguồn website chính thức; nếu thiếu nguồn thì để [CẦN BỔ SUNG: link tài liệu] thay vì tự bịa chi tiết giá/phiên bản.

Độ dài 600–800 chữ + 1 bảng. Áp dụng prompt chung.
```

### A7. Mục 1.3 — Phân tích ưu và nhược điểm của hệ thống hiện có

```text
Viết mục 1.3 cho đồ án GymShark gồm 1.3.1 "Ưu điểm" và 1.3.2 "Khuyết điểm", bám cấu trúc PDF mẫu nhưng nội dung gym.

Ưu điểm:
- Nhóm quốc tế: tự động hóa booking/thanh toán, trải nghiệm hội viên tốt, báo cáo trực quan.
- Nhóm nội bộ: workflow phê duyệt rõ, audit/truy vết, phân quyền.

Khuyết điểm (đây là phần quan trọng, phải dẫn tới giải pháp của đồ án):
- Thiếu luồng "đăng ký → xác minh email → hồ sơ → thẻ → Payment/Invoice" khép kín với trạng thái rõ ràng.
- Chưa gắn check-in (MANUAL/STAFF/FACE_ID) với báo cáo chuyên cần và dữ liệu sinh trắc học có consent.
- Chưa xử lý nghiệp vụ tài chính nhạy cảm: hoàn tiền một phần, bảo lưu thẻ, đối chiếu quota PT, giao dịch chờ xác nhận theo ca.
- Chưa có nhật ký hệ thống 53 loại hành động + cảnh báo realtime cho quản lý.
- Phụ thuộc nền tảng nước ngoài, khó tùy biến theo cách thu tiền mặt/chuyển khoản tại quầy ở Việt Nam.

Mỗi khuyết điểm kết thúc bằng một câu ngắn "→ GymShark giải quyết bằng ..." có tên module tương ứng. Độ dài 600–800 chữ. Áp dụng prompt chung.
```

### A8. Mục 1.4 — Đề xuất giải pháp và kết luận

```text
Viết mục 1.4 "Đề xuất giải pháp và kết luận" cho đồ án GymShark theo cấu trúc PDF mẫu: xác định ngách thị trường → tổng quan giải pháp → chuỗi nghiệp vụ khép kín → kỳ vọng.

- Ngách: hệ thống không cạnh tranh app bán thẻ đại chúng mà tập trung vận hành nội bộ phòng gym quy mô vừa và nhỏ, nơi tiền mặt/chuyển khoản, lễ tân, HLV và hội viên cần cùng một nguồn dữ liệu.
- Tổng quan giải pháp: Web App gồm cổng công khai, /admin, /member, /trainer, /kiosk; REST API NestJS + Swagger; CSDL SQL Server 2022 qua Prisma; realtime Socket.IO.
- Chuỗi khép kín: Đăng ký + mã xác minh email → hồ sơ Member → gói Membership/Payment/Invoice → xác nhận thu tiền → check-in (QR/thủ công/Face ID) → lịch tập & tiến trình → ca làm & POS nước uống → báo cáo & audit log.
- Kết luận: nêu giá trị mang lại (giảm thao tác thủ công, minh bạch dòng tiền, truy vết được ai làm gì, tuân thủ NĐ 13 cho dữ liệu khuôn mặt) nhưng không dùng từ "hoàn hảo/100%".

Độ dài 600–800 chữ. Áp dụng prompt chung.
```

---

## CHƯƠNG 2 — CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ SỬ DỤNG

### A9. Mục 2.1 — Quản lý dự án và kiến trúc phần mềm

```text
Viết mục 2.1 cho đồ án GymShark gồm 2.1.1 "Phương pháp luận Agile/Scrum" và 2.1.2 "Mô hình kiến trúc phần mềm áp dụng".

2.1.1: giữ nguyên khung Scrum của PDF mẫu (Product Backlog, Sprint 1–2 tuần, đánh giá & thích ứng cuối Sprint) nhưng lấy ví dụ user story của gym ("Với tư cách hội viên, tôi muốn tự hủy yêu cầu thanh toán chờ...", "Với tư cách lễ tân, tôi muốn chấm công ca...", "Với tư cách quản lý, tôi muốn đối chiếu tiền mặt cuối ca..."). Không bịa số Sprint nếu nguồn không ghi rõ.

2.1.2: Đây là chỗ dễ sai nhất — hãy trung thực:
- Trình bày Clean Architecture như lý thuyết nền (Robert C. Martin, quy tắc phụ thuộc, 4 lớp) trong 1 đoạn ngắn.
- Sau đó nêu rõ "mô hình hiện thực của đề tài là module-based monolith": AppModule import 31 feature module; mỗi module gồm controller → service → dto → entity; tầng common/ chứa guards (JwtAuthGuard, RolesGuard), decorators (@Roles, @Public, @CurrentUser), filters (AllExceptionsFilter), interceptor realtime; PrismaModule/PrismaService là lớp truy cập dữ liệu; AuditLogsModule là @Global.
- Giải thích lý do chọn module-based thay vì 4 lớp cứng nhắc: quy mô đồ án, tốc độ phát triển, khớp với DI của NestJS; đồng thời nêu cách vẫn giữ được "tách bạch" (service không tự query DB ngoài PrismaService, rule*nằm ở backend chứ không ở UI theo skill.md).
- Kết thúc bằng sơ đồ Mermaid flowchart tầng Client → Controller → Service → Prisma → SQL Server + nhánh Socket.IO.

Độ dài 800–1.000 chữ + 1 sơ đồ Mermaid. Áp dụng prompt chung.
```

### A10. Mục 2.2 — Công nghệ Backend & Cơ sở dữ liệu

```text
Viết mục 2.2 cho đồ án GymShark gồm:
2.2.1 Node.js & NestJS 10 (event-driven, DI, module, ValidationPipe whitelist + forbidNonWhitelisted + transform, global prefix /api, Swagger /api/docs).
2.2.2 Prisma 5 thay vì TypeORM (schema.prisma, PrismaService kế thừa PrismaClient và onModuleInit, db push cho DB mới, KHÔNG dùng prisma/migrate, migration SQL thủ công cho DB legacy như sqlserver-gymdb-preserve-migration.sql). Phải nói rõ đây là điểm khác với PDF mẫu.
2.2.3 SQL Server 2022 (ACID, ràng buộc PK/FK/UNIQUE/CHECK theo code + schema, index theo truy vấn, thủ tục lưu trữ usp_ReceiveBeverageImport / usp_CompleteBeverageSale và các view vw_Beverage*).
2.2.4 Bảo mật & hạ tầng kèm theo: Passport JWT, bcryptjs 10 vòng, helmet, @nestjs/throttler (300/60s toàn cục, login 10/60s, register 5/300s), CORS allowlist, AllExceptionsFilter, nodemailer, pdfkit, qrcode.

Lý do chọn SQL Server phải gắn với nghiệp vụ tiền bạc/hoàn tiền/quota PT và tính toàn vẹn, không chép nguyên đoạn "SQL Server 2019" của mẫu. Mỗi công nghệ có 1 câu "Lý do chọn". Độ dài 800–1.000 chữ. Áp dụng prompt chung.
```

### A11. Mục 2.3 — Các công nghệ Frontend

```text
Viết mục 2.3 cho đồ án GymShark gồm:
2.3.1 Next.js 14 App Router + React 18 + TypeScript: route group (public)/(auth)/(member)/(trainer)/(admin), layout riêng, middleware chặn theo role, SSR/CSR, not-found.tsx + error.tsx.
2.3.2 Tailwind CSS 3 + DESIGN_SYSTEM: palette ink/surface/neon/chalk/muted/line/danger bằng CSS variable, 2 theme sáng/tối (mặc định dark, lưu gym_theme), font Barlow Condensed + Be Vietnam Pro, icon lucide-react, cn() = clsx + tailwind-merge, không class dark: thủ công, neon chỉ làm accent 2%.
2.3.3 Quản lý dữ liệu & form: TanStack Query v5 (staleTime 2 phút, retry 1), Axios interceptor tự gắn JWT & xử lý 401, react-hook-form + zod, React Query invalidate sau mutation realtime.
2.3.3b Realtime & đặc thù: Socket.IO client; framer-motion/Reveal tôn trọng prefers-reduced-motion; component charts SVG tự vẽ (KHÔNG dùng recharts); @vladmandic/human 3.3.6 chạy client-side, trích vector 1024 chiều; three.js chỉ ở hero công khai.

Nêu rõ "không cài thư viện biểu đồ ngoài" và "không dùng package mới khi chưa được duyệt" theo AGENTS.md. Độ dài 800–1.000 chữ, có bảng tóm tắt "Công nghệ | Vai trò | Lý do chọn". Áp dụng prompt chung.
```

### A12. Mục 2.4 — Mô hình triển khai hệ thống

```text
Viết mục 2.4 "Mô hình triển khai hệ thống" cho đồ án GymShark theo cấu trúc Deployment Architecture của PDF mẫu: tầng Client → tầng Ứng dụng (FE :3000 / BE :3001/api) → tầng CSDL (SQL Server 2022 :1433, gym_db), kèm Swagger, realtime Gateway, CI .github/workflows/ci.yml, Docker Compose, reverse proxy HTTPS/nginx khi deploy.

Cụ thể hóa:
- Frontend gọi REST qua NEXT_PUBLIC_API_URL (mặc định http://localhost:3001/api), Axios tự gắn JWT.
- Backend chạy script SQL idempotent trước start (db:sync-single-location, db:sync-staff-shift-settlement, db:sync-weekly-shifts) — nêu đây là cơ chế tự cập nhật schema an toàn cho DB có dữ liệu.
- Realtime: sau mutation HTTP thành công, backend chỉ phát metadata route, frontend refetch React Query — KHÔNG gửi dữ liệu nghiệp vụ qua socket (theo README.md).
- CI: typecheck → lint → format:check → build (FE); prisma validate → generate → build (BE).
- Deploy khuyến nghị: JWT_SECRET ≥ 32 ký tự, CORS_ORIGIN domain thật, HTTPS reverse proxy; rate limit đang lưu in-memory cần Redis nếu chạy nhiều instance.

Kết thúc bằng sơ đồ Mermaid dạng flowchart hoặc graph TB. Độ dài 600–800 chữ + sơ đồ. Áp dụng prompt chung.
```

---

## CHƯƠNG 3 — PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### A13. Mục 3.1 — Xác định yêu cầu hệ thống

```text
Viết mục 3.1 cho đồ án GymShark gồm 3.1.1 "Các tác nhân hệ thống (Actors)" và 3.1.2 "Danh sách chức năng nghiệp vụ".

Actors (5 vai trò + 2 tác nhân ngoài), mô tả trách nhiệm cụ thể:
- ADMIN: toàn quyền, quản trị tài khoản, phân quyền, cài đặt, xem audit.
- MANAGER: vận hành + duyệt yêu cầu thay đổi hợp đồng, xem audit, báo cáo.
- STAFF: lễ tân check-in, hồ sơ, thu tiền CASH/BANK_TRANSFER, bán nước trong ca; KHÔNG xem audit (403).
- TRAINER: lịch dạy, học viên, tiến trình, thực đơn, chat.
- MEMBER: tự đăng ký/gia hạn, xem hóa đơn, check-in, lịch tập, hồ sơ, thông báo dữ liệu của chính mình.
- Dịch vụ email SMTP (nodemailer) là tác nhân ngoài — nếu nguồn có. KHÔNG đưa "cổng thanh toán MoMo/VNPay" vào danh sách tác nhân: web chỉ có luồng thu tiền CASH/BANK_TRANSFER do STAFF/ADMIN xác nhận thủ công.

3.1.2 phải liệt kê các nhóm chức năng theo module thực tế (không dùng 6 module của mẫu): Auth/Users, Members, Packages/Memberships (+ MembershipChangeRequest), Payments/Invoices, Checkins/Faces, Trainers/Schedules/Programs/Exercises/BodyMetrics/ClassBookings, Foods/MealPlans/Chat, Rooms/Equipment, StaffShifts/Beverages, Notifications, Reports, AuditLogs, Public/Health.

Bắt buộc có bảng ma trận RBAC 5 cột với các dòng: dashboard, hồ sơ/thẻ, thu tiền, duyệt hoàn tiền, audit log, ca làm, giao diện HLV, dữ liệu cá nhân. Dòng "dữ liệu cá nhân" phải ghi rõ lấy từ sub trong JWT. Độ dài 800–1.000 chữ + bảng. Áp dụng prompt chung.
```

### A14. Mục 3.2 — Mô hình Use Case

```text
Viết mục 3.2 cho đồ án GymShark:
- 3.2.1 Biểu đồ Use Case cấp 0 (tổng quát): tạo bằng Mermaid hoặc mô tả bằng chữ + chỗ chèn hình; thể hiện 5 actor với các nhóm use case lớn.
- 3.2.2 Phân rã Use Case cấp 1 theo module (Auth, Hội viên & gói, Thanh toán, Check-in, Lịch tập/PT, Vận hành & báo cáo).
- 3.2.3 Đặc tả 5 Use Case cốt lõi theo đúng bảng của PDF mẫu (Tên Use Case | Tác nhân | Mục đích | Tiền điều kiện | Luồng sự kiện chính | Luồng ngoại lệ | Hậu điều kiện):
  UC1 "Đăng ký hội viên & xác minh email" (EmailVerification, codeHash bcrypt, expiresAt, attempts, 5/300s & 10/300s),
  UC2 "Đăng ký/gia hạn gói & thanh toán" (Membership PENDING → Payment PENDING → xác nhận → ACTIVE + Invoice INV-YYYY-NNNNNN),
  UC3 "Check-in bằng khuôn mặt" (FACE_ID, consentAt, ngưỡng 0.6 self / 0.7 1:N, anti-spoof real < 0.3, 404 khi trượt 1:N),
  UC4 "Yêu cầu chấm dứt hợp đồng & hoàn tiền" (MembershipChangeRequest: REQUESTED → PENDING_MANAGER_PROPOSAL → AWAITING_MEMBER_CONFIRMATION → PENDING_MANAGER_APPROVAL → PENDING_PAYOUT → COMPLETED),
  UC5 "Chấm công & chốt ca" (StaffShift SCHEDULED → IN_PROGRESS → COMPLETED, cashExpected/cashCounted/cashDifference, chặn nếu còn giao dịch tiền mặt chờ).

Mỗi bảng phải có luồng ngoại lệ (hết hạn mã, sai mã, trùng transactionRef 409, lệch tiền phải ghi lý do...). Độ dài 1.200–1.500 chữ. Áp dụng prompt chung.
```

### A15. Mục 3.3 — Biểu đồ hoạt động (Activity Diagram)

```text
Viết mục 3.3 cho đồ án GymShark. Dạng swimlane như PDF mẫu nhưng 5 làn: Hội viên | Hệ thống | Lễ tân/STAFF | Quản lý (MANAGER/ADMIN) | HLV.

Mô tả 3 luồng end-to-end theo 4 giai đoạn kiểu mẫu:
Luồng A — Gia nhập: Hội viên gửi đăng ký → hệ thống lưu EmailVerification + gửi mã → nhập mã (sai quá ngưỡng thì xoá, xin lại) → tạo User + Member → chọn gói → tạo Membership PENDING + Payment + Invoice → khách chuyển khoản/đóng tiền → STAFF/ADMIN xác nhận thủ công (chỉ CASH/BANK_TRANSFER) → Membership ACTIVE + thông báo realtime.
Nhánh phủ quyết: hội viên tự hủy Payment chờ; nếu muốn hoàn tiền thì vào luồng C.
Luồng B — Vận hành hàng ngày: check-in (QR/thủ công/Face ID) → CheckIn CHECKED_IN → check-out → báo cáo chuyên cần; STAFF vào ca → POS bán nước → đối soát → chốt quỹ → Payments/CASH được gắn đúng ca.
Luồng C — Thay đổi hợp đồng: gửi yêu cầu FREEZE hoặc CANCEL_REFUND → quản lý đề xuất (quota PT, ngày còn lại) → hội viên xác nhận → ADMIN duyệt → ghi nhận chi trả → COMPLETED + audit.
Luồng D — HLV: phân công TrainerMember → tạo lịch → ghi TrainingProgress → gửi MealPlan qua chat.

Mỗi luồng có nút quyết định rõ (Decision Node) và ghi trạng thái chuyển đổi. Kèm 1 sơ đồ Mermaid flowchart (hoặc stateDiagram) và 1 đoạn "Kết luận về mô hình" kiểu mẫu. Độ dài 1.000–1.300 chữ. Áp dụng prompt chung.
```

### A16. Mục 3.4.1 — Từ điển dữ liệu

```text
Viết mục 3.4.1 "Từ điển dữ liệu" cho đồ án GymShark. Đây là mục dài nhất, phải bám sát backend/prisma/schema.prisma.

YÊU CẦU BẮT BUỘC:
- Liệt kê TOÀN BỘ 36 model trong schema.prisma (kể cả BeverageLocation có @@ignore ánh xạ bảng Branch cũ) theo bảng với các cột: STT | Thực thể (tên model) | Thuộc tính | Kiểu dữ liệu Prisma/SQL Server | Giải nghĩa tiếng Việt | Ghi chú (PK/FK/unique/default/index/@@map).
- Nhóm các model theo cụm để dễ đọc: (1) Danh tính & hội viên: User, Member, Trainer, EmailVerification, PasswordReset, BeverageLocation; (2) Gói & tài chính: MembershipPackage, Membership, MembershipChangeRequest, Payment, Invoice, StaffShift, StaffShiftTemplate; (3) Vận hành tập luyện: Room, CheckIn, FaceEmbedding, TrainingSchedule, ClassBooking, BodyMetric, TrainerMember, Program, Exercise, ProgramExercise, TrainingProgress; (4) Tương tác & nội dung: AuditLog, Notification, Conversation, Message, MessageAttachment, Food, MealPlan, Meal, MealItem; (5) Cơ sở vật chất: Equipment, EquipmentMaintenance.
- Với mỗi thực thể, chỉ cần liệt kê các trường QUAN TRỌNG (khoá, trạng thái, tiền, thời gian, FK, unique) — không cần dư thừa mọi createdAt/updatedAt lặp lại, nhưng phải ghi chú quy ước chung "mọi model đều có createdAt/updatedAt trừ một số ngoại lệ".
- Thêm 1 bảng phụ cho 6 bảng ngoài Prisma: BeverageProduct, BeverageImport, BeverageImportItem, BeverageSale, BeverageSaleItem, BeverageStockMovement (theo README.md) + 4 view vw_Beverage* + 2 stored procedure.
- Thêm 1 bảng liệt kê các enum thực tế lấy từ backend/src/common/constants/db-enums.ts (UserRole, PaymentStatus, InvoiceStatus, CheckInMethod, CheckInStatus, MembershipStatus, MembershipChangeStatus, SessionType, ScheduleStatus, MessageType, MealPlanStatus, EquipmentStatus...). Nhấn mạnh: Prisma không khai báo `enum`, giá trị được định nghĩa bằng const trong mã nguồn — đây là điểm khác mẫu.

Không được chép danh sách thực thể của PDF mẫu (Customers/EventRequests/...). Độ dài không giới hạn, ưu tiên đầy đủ và chính xác. Áp dụng prompt chung.
```

### A17. Mục 3.4.2 & 3.4.3 — ERD và Lược đồ quan hệ

```text
Viết mục 3.4.2 "Mô hình thực thể liên kết (ERD)" và 3.4.3 "Chuyển đổi sang Lược đồ quan hệ" cho đồ án GymShark.

3.4.2: tạo sơ đồ Mermaid erDiagram thể hiện ít nhất các quan hệ chính, có cardinality và nhãn quan hệ:
User 1—0..1 Trainer / Member; Member 1—n Membership / Payment / Invoice / CheckIn / Notification / BodyMetric / ClassBooking / FaceEmbedding; Membership 1—0..n Payment (Payment.membershipId nullable) và 1—0..n Invoice; Payment 1—0..1 Invoice (paymentId unique); MembershipChangeRequest n—1 Membership + n—1 Member + 3 vai trò User (reviewedBy/approvedBy/completedBy); Trainer n—m Member qua TrainerMember; Trainer 1—n TrainingSchedule / Program / MealPlan; TrainingSchedule 1—n TrainingProgress / ClassBooking; Program 1—n ProgramExercise n—1 Exercise; Conversation 1—n Message 1—n MessageAttachment; MealPlan 1—n Meal 1—n MealItem n—0..1 Food; StaffShift 1—n Payment.
Chú thích hành vi xóa: Cascade (ProgramExercise, ClassBooking, BodyMetric, EquipmentMaintenance), SetNull (AuditLog.userId, Payment.confirmedById, Member.userId, TrainingSchedule.memberId/roomId), NoAction/Restrict (Payment.memberId, Membership.packageId, FaceEmbedding.memberId). Nhấn mạnh lý do giữ lịch sử tài chính và nhật ký.

3.4.3: trình bày lược đồ quan hệ dạng danh sách `TênBảng(khoachinh, ..., khoangoai → bảngcha [ON DELETE ...])` cho các bảng cốt lõi: User, Member, Trainer, MembershipPackage, Membership, MembershipChangeRequest, Payment, Invoice, StaffShift, CheckIn, FaceEmbedding, TrainingSchedule, TrainingProgress, AuditLog. Nêu quy ước đặt tên bảng do Prisma @@map/@@ignore (BeverageLocation → Branch).

Kết thúc 1 đoạn đối chiếu ERD ↔ schema.prisma. Độ dài 900–1.200 chữ + 1 sơ đồ Mermaid. Áp dụng prompt chung.
```

### A18. Mục 3.4.4 — Đánh giá và xác định dạng chuẩn

```text
Viết mục 3.4.4 "Đánh giá và xác định Dạng chuẩn (1NF, 2NF, 3NF)" cho đồ án GymShark, giữ nguyên cấu trúc chứng minh của PDF mẫu nhưng lấy ví dụ thật từ schema.prisma:

- 1NF: mọi trường đều giá trị nguyên tố; ví dụ không lưu danh sách môn tập trong một cột mà tách ProgramExercise (mỗi bài 1 dòng có sets/reps/rest/orderIndex); embedding của FaceEmbedding là chuỗi JSON số nhưng được xử lý như một giá trị duy nhất phục vụ cosine — giải thích rõ đây là trường hợp đặc biệt của dữ liệu vector, không vi phạm 1NF ở mức thiết kế quan hệ; phone/email của User là đơn trị.
- 2NF: dùng khóa chính nhân tạo dạng UUID String @default(uuid()) cho hầu hết model (khác với INT IDENTITY của mẫu), và unique/newsequentialid() cho StaffShift/StaffShiftTemplate; vì khóa đơn nên không có phụ thuộc một phần. Ví dụ Invoice.total phụ thuộc hoàn toàn vào Invoice.id.
- 3NF: phân tách để tránh phụ thuộc bắc cầu — thông tin người dùng nằm ở User, hồ sơ ở Member, thẻ ở Membership; Payment chỉ giữ memberId/packageId dạng FK; MealItem lưu snapshot tên/dinh dưỡng tại thời điểm gửi để thực đơn đã gửi không đổi khi Food thay đổi (đây là ngoại lệ có chủ đích, phải giải thích là "snapshot nghiệp vụ", không phải vi phạm 3NF). Tương tự Payment.discountAmount và Invoice.subtotal/discount/total được lưu cố định để bảo toàn lịch sử tiền.

Mỗi dạng chuẩn có "Nguyên tắc" → "Chứng minh trên GymShark" → "Kết luận". Cuối mục có TỔNG KẾT 3NF như mẫu. Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

### A19. Mục 3.4.5 — Ràng buộc toàn vẹn

```text
Viết mục 3.4.5 "Mô tả ràng buộc toàn vẹn" cho đồ án GymShark theo 5 loại như PDF mẫu:

1) Thực thể (PK): UUID @default(uuid()) cho đa số model; @db.UniqueIdentifier + newsequentialid() cho StaffShift/StaffShiftTemplate; @@id không tổ hợp. Nêu rõ lý do tách định danh khỏi logic nghiệp vụ.
2) Tham chiếu (FK): phân loại Cascade / SetNull / NoAction(Restrict) và lấy ví dụ cụ thể từ schema.prisma. Nhấn mạnh quy tắc "dữ liệu lịch sử giữ lại": AuditLog.userId SetNull, Payment.confirmedById SetNull, Member.userId SetNull; dữ liệu tài chính NoAction; dữ liệu chi tiết phụ thuộc Cascade.
3) Miền giá trị: CHECK/DEFAULT được thực hiện ở tầng ứng dụng bằng class-validator + const enum trong db-enums.ts (vì Prisma schema không có ràng buộc CHECK) — nói rõ sự khác này với mẫu; ví dụ trạng thái PaymentStatus, InvoiceStatus, CheckInMethod, StaffShift status; DEFAULT như status ACTIVE, isRead false, createdAt now(); @Throttle cho giới hạn tần suất.
4) Ngữ nghĩa/Unique: User.email, User.phone (có điều kiện NULL), Member.code, Member.referralCode, MembershipPackage.code, Payment.code, Payment.transactionRef, Invoice.invoiceNumber (INV-YYYY-NNNNNN), Room.code, Equipment.code, FaceEmbedding.consentAt không phải unique nhưng là điều kiện nghiệp vụ, ClassBooking @@unique([scheduleId, memberId]), Conversation @@unique([trainerId, memberId]). Giải thích ý nghĩa chống trùng mã hóa đơn/mã giao dịch.
5) NOT NULL & index: các trường sống còn (Member.code, Payment.amount, Invoice.total, CheckIn.checkInTime, FaceEmbedding.consentAt) và các @@index theo status/memberId/createdAt/email/code; index trong SQL migration (IX_StaffShift_Staff_StartTime, IX_Payment_StaffShift_Status_PaidAt...).

Kết thúc bằng bảng tổng hợp "Loại ràng buộc | Ví dụ trong GymShark | Mục đích". Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

---

## CHƯƠNG 4 — TRIỂN KHAI ỨNG DỤNG HỆ THỐNG

> Lưu ý cho các prompt 20–27: hãy viết theo kiểu "minh chứng mã nguồn" của Chương 4 trong PDF mẫu — nêu tên file, tên hàm/endpoint, đoạn code ngắn (3–8 dòng) và diễn giải, kèm chỗ chèn ảnh giao diện `[Hình 4.x — ...]`. Không chép code của mẫu.

### A20. Mục 4.1 — Kiến trúc mã nguồn

```text
Viết mục 4.1 "Kiến trúc mã nguồn" cho đồ án GymShark.

- Vẽ cây thư mục (dạng code block) gồm: root (docker-compose.yml, README.md, AGENTS.md, DESIGN_SYSTEM.md, .github/workflows/ci.yml), backend/ (prisma/schema.prisma, prisma/seed.ts, src/main.ts, src/app.module.ts, src/common/{guards,decorators,filters,interceptors,enums,constants,utils}, src/modules/<31 module>), frontend/ (src/app với 5 route group, src/components/{ui,layout,guards,home,charts,notifications,training,three}, src/services, src/lib, src/providers).
- Giải thích 4 lớp tương đương của module-based monolith: Presentation (controller + DTO + Swagger), Application (service/use-case nghiệp vụ trong module), Domain/Data (Prisma model + const enum + rule ở backend), Infrastructure (PrismaModule, socket gateway, mailer, script SQL). Nói rõ đây KHÔNG phải 4 thư mục cứng của Clean Architecture trong mẫu.
- Nêu quy tắc phụ thuộc thực tế: module service gọi nhau qua imports; mọi rule nằm ở backend (skill.md); danh sách phải có phân trang/tìm kiếm/lọc/sắp xếp (skill.md mục 8).
- Chốt bằng đoạn "Nhờ cấu trúc này, dự án dễ mở rộng module mới (ví dụ đã thêm faces, staff-shifts, beverages) mà không đập đi xây lại".

Kèm 1 sơ đồ cây thư mục + 1 đoạn giải thích. Độ dài 800–1.000 chữ. Áp dụng prompt chung.
```

### A21. Mục 4.2 — Triển khai module Auth, Users, RBAC & Audit

```text
Viết mục 4.2 cho đồ án GymShark: "Triển khai module Xác thực, Phân quyền & Nhật ký hệ thống".

Nội dung bắt buộc:
- Đăng nhập/đăng ký: POST /api/auth/login (rate limit 10/60s), Google OAuth (provider GOOGLE + providerId), quên mật khẩu qua PasswordReset (chỉ lưu codeHash bcrypt), đăng ký hội viên 2 bước qua EmailVerification (codeHash, expiresAt, attempts, send/resend 5/300s, verify 10/300s). Giải thích lý do không tạo User khi chưa xác minh mã.
- JWT payload tối thiểu {sub, email, role, iat, exp}; JwtAuthGuard toàn cục + @Public(); RolesGuard đọc @Roles(); dữ liệu cá nhân luôn lấy từ sub.
- Users: tạo/sửa/khóa tài khoản STAFF, gửi email mật khẩu tạm, đổi mật khẩu lần đầu.
- AuditLogsModule @Global: 53 action theo AUDIT_ACTION_META; audit.log() không bao giờ throw; không ghi password/token; trang /admin/audit-logs chỉ ADMIN/MANAGER, lọc theo user/action/entity/từ ngày/đến ngày/từ khóa + phân trang + xem metadata JSON.

Có 1 đoạn code ngắn minh họa @Roles + @CurrentUser hoặc audit.log(), 1 bảng "Endpoint | Vai trò | Mục đích", và chỗ chèn `[Hình 4.2 — Giao diện đăng nhập / trang nhật ký hệ thống]`. Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

### A22. Mục 4.3 — Triển khai module Hội viên & Gói tập

```text
Viết mục 4.3 cho đồ án GymShark: "Triển khai module Hội viên & Gói tập (Members, Packages, Memberships)".

Bao phủ:
- Hồ sơ Member: mã MEM-xxxx tự sinh, liên kết User (onDelete SetNull), thông tin cá nhân, referralCode/referredById + referralRewardedAt (chương trình giới thiệu).
- MembershipPackage: FIXED_TERM còn bán (durationDays, price, features, ptSessionValue); SESSION_BASED đã ngừng bán nhưng vẫn hiển thị trong lịch sử membership — kiểm tra kỹ nguồn trước khi viết, nếu code không ẩn thì ghi [CẦN BỔ SUNG].
- Vòng đời Membership: PENDING → ACTIVE → EXPIRED/CANCELLED; remainingSessions/ptSessionsIncluded/ptSessionsUsed/ptSessionValue dùng để đối chiếu quota PT và tính hoàn tiền.
- Luồng MembershipChangeRequest: CANCEL_REFUND & FREEZE, 7 trạng thái REQUESTED → PENDING_MANAGER_PROPOSAL → AWAITING_MEMBER_CONFIRMATION → PENDING_MANAGER_APPROVAL → PENDING_PAYOUT → COMPLETED (+ REJECTED), 3 người duyệt reviewedBy/approvedBy/completedBy, bảo lưu tối đa 30 ngày một lần.
- Hủy yêu cầu thanh toán tự do của hội viên; phân công HLV không tự tạo quota PT.
- Giao diện: /member/membership, /member/register-membership/[packageId], /admin/members/[id] (tab lịch sử), /admin/membership-packages.

Có 1 đoạn code ngắn (service tạo membership hoặc proposedRefundAmount), bảng trạng thái, và chỗ chèn `[Hình 4.3 — ...]`. Độ dài 1.000–1.300 chữ. Áp dụng prompt chung.
```

### A23. Mục 4.4 — Triển khai module Thanh toán & Hóa đơn

```text
Viết mục 4.4 cho đồ án GymShark: "Triển khai module Thanh toán & Hóa đơn".

Bao phủ:
- PaymentGateway abstraction: chỉ CASH & BANK_TRANSFER được triển khai thật (`manualConfirmation = true`, `integrated = true` trong `cash.gateway.ts` / `bank-transfer.gateway.ts`). `MomoGateway` là stub (`integrated = false`, chỉ trả thông báo "chưa được kích hoạt"), VNPay không có gateway — web không cho chọn MoMo/VNPay ở luồng đăng ký thật. Không viết như thể dự án đã tích hợp cổng ví/cổng thanh toán.
- Payment: code unique, amount, discountAmount, method, status PENDING/PAID/FAILED/CANCELLED/REFUNDED, transactionRef @unique (trùng → 409), paidAt, confirmedById/confirmedAt (SetNull khi xóa user).
- Phân quyền xác nhận: STAFF/ADMIN/MANAGER đều xác nhận được CASH/BANK_TRANSFER; code chặn STAFF với mọi phương thức có `manualConfirmation = false` (MOMO/VNPAY chỉ là enum, không phải luồng đang dùng). Đây là quy tắc bảo vệ trong `payments.service.ts`, không phải tính năng thanh toán ví.
- Invoice: invoiceNumber INV-YYYY-NNNNNN unique, subtotal - discount = total, 1-1 với Payment (paymentId @unique), trạng thái DRAFT/ISSUED/PAID/CANCELLED; in biên lai PDF tại /member/payments/[id] (pdfkit).
- Hoàn tiền: refundAmount/refundMethod, giao dịch độc lập có transaction; hoàn một phần trừ doanh thu báo cáo; khoản gắn hợp đồng phải đi qua MembershipChangeRequest.
- Giao diện: /admin/payments (+[id]), /member/payments (+[id]); luồng register-membership hiện thông tin chuyển khoản + nội dung "GYM <CODE> <PAYMENT>".

Có sơ đồ sequence Mermaid cho luồng "đăng ký gói → chuyển khoản → xác nhận → phát hành hóa đơn", 1 bảng trạng thái, chỗ chèn `[Hình 4.4 — ...]`. Độ dài 1.000–1.300 chữ. Áp dụng prompt chung.
```

### A24. Mục 4.5 — Triển khai module Check-in & Face ID

```text
Viết mục 4.5 cho đồ án GymShark: "Triển khai Check-in/Check-out và Nhận diện khuôn mặt".

Bao phủ:
- CheckIn model: method MANUAL/STAFF/FACE_ID, status CHECKED_IN/CHECKED_OUT, checkInTime/checkOutTime, liên kết Member (và equipmentId nullable), lịch sử và báo cáo chuyên cần theo giờ/theo phương thức.
- Cổng hội viên /member/checkin (tab Khuôn mặt), /member/checkins; lễ tân /admin/checkins quét thẻ; /admin/checkins/face-scan quét 1:N.
- FaceEmbedding: vector 1024 chiều lưu dạng String JSON, imageData data URL chỉ ở mẫu đầu, consentAt bắt buộc theo Nghị định 13/2023/NĐ-CP; rút lui đồng ý = xóa dòng; audit FACE_ENROLL / FACE_DELETE.
- Thuật toán: @vladmandic/human 3.3.6 chạy 100% client-side (model CDN) → cosine similarity; ngưỡng 0.6 cho tự check-in 1:1, 0.7 cho lễ tân 1:N; anti-spoof chặn mẫu real < 0.3; 1:1 lệch → 400, 1:N trượt → 404; body parser JSON 4mb để chứa payload vector + ảnh.
- Bẫy kỹ thuật đã ghi trong nguồn (nếu có): phải alias ESM bundle trong next.config.mjs + src/types/human-esm.d.ts; human.webcam.start() trả chuỗi lỗi chứ không ném exception. Nếu không tìm thấy trong nguồn thì bỏ qua, đừng bịa.

Có 1 sơ đồ sequence cho FACE_ID check-in, 1 bảng so sánh 3 phương thức, chỗ chèn `[Hình 4.5 — ...]`, và 1 đoạn ngắn về bảo mật dữ liệu sinh trắc học. Độ dài 1.000–1.300 chữ. Áp dụng prompt chung.
```

### A25. Mục 4.6 — Lịch tập, PT, chương trình & dinh dưỡng

```text
Viết mục 4.6 cho đồ án GymShark: "Triển khai module Lịch tập, Huấn luyện viên, Chương trình & Dinh dưỡng".

Bao phủ:
- Trainer: hồ sơ, specialization, rating, hourlyRate; TrainerMember giữ lịch sử phân công, chỉ 1 ACTIVE/member; permission chat suy ra từ phân công ACTIVE chứ không đọc từ Conversation.
- TrainingSchedule: PERSONAL_TRAINING / GROUP_CLASS / FREE_TRAINING; SCHEDULED/COMPLETED/CANCELLED/NO_SHOW; capacity + ClassBooking @@unique([scheduleId, memberId]); liên kết roomId & membershipId (SetNull để giữ lịch sử); TrainingProgress do HLV ghi sau buổi.
- Program/Exercise/ProgramExercise: chương trình tập có template, thứ tự bài, sets/reps/rest; Exercise là danh mục dùng chung — nếu nguồn còn ghi "bài tập là dữ liệu tĩnh frontend/src/lib/programs.ts" thì nêu rõ phần nào đã chuyển sang DB, phần nào chưa (đánh dấu đối chiếu nếu README và schema khác nhau).
- BodyMetric: cân nặng, % mỡ, vòng eo... vẽ biểu đồ tiến trình bằng SVG tự vẽ.
- Food/MealPlan/Meal/MealItem: thực đơn theo ngày/tuần, isTemplate, version, confirmedAt; MealItem lưu snapshot dinh dưỡng; gửi thực đơn qua Message type MEAL_PLAN kèm mealPlanId.
- Chat realtime Socket.IO: Conversation 1-1, tin nhắn TEXT/IMAGE/MEAL_PLAN/SYSTEM, deliveredAt/readAt/recalledAt/editedAt, attachments data URL; sau mutation chỉ phát metadata, client refetch React Query.
- Giao diện: /trainer/*, /member/schedule, /member/programs, /member/messages, /admin/schedules, /admin/trainers/[id].

Có 1 bảng module ↔ route ↔ bảng dữ liệu, 1 chỗ chèn `[Hình 4.6 — ...]`. Độ dài 1.100–1.400 chữ. Áp dụng prompt chung.
```

### A26. Mục 4.7 — Vận hành (thiết bị, phòng, ca làm, nước uống) & Báo cáo

```text
Viết mục 4.7 cho đồ án GymShark: "Triển khai các module Vận hành và Báo cáo".

Gồm 4 nhóm:
(1) Room & Equipment: Room.code unique, type GYM_AREA/CARDIO/...; Equipment code unique, status AVAILABLE/INACTIVE/MAINTENANCE/BROKEN; EquipmentMaintenance PENDING/IN_PROGRESS/COMPLETE/CANCELLED, báo cáo tình trạng.
(2) StaffShifts: tạo tài khoản STAFF + email mật khẩu tạm; StaffShiftTemplate mẫu theo thứ, sinh tối đa 31 ngày; trạng thái SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED; chấm công startedAt/endedAt; cashExpected/cashCounted/cashDifference, bắt buộc lý do khi lệch; chặn chốt khi còn Payment CASH chờ xác nhận; gán giao dịch đúng ca; migration SQL tự chạy khi start.
(3) Beverages: 6 bảng SQL Server ngoài Prisma + 4 view + 2 stored procedure; STAFF chỉ bán trong ca được phân; QR VietQR + CASSO đối soát 5 giây, chống dùng lại mã; doanh thu cộng vào ca; /admin/beverages/*, /member/beverages.
(4) Notifications & Reports: Notification đa kênh (bell admin/member/trainer), ticker 6h, referenceType/referenceId/data chống trùng, trigger từ checkin/payment/thiết bị; 8 tab báo cáo /admin/reports/* + lọc + export CSV có BOM; biểu đồ SVG tự vẽ, KPI dashboard.

Có bảng "Module | Bảng/View | API prefix | Màn hình", 1 chỗ chèn `[Hình 4.7 — ...]`. Độ dài 1.100–1.400 chữ. Áp dụng prompt chung.
```

### A27. Mục 4.8 — Giao diện & Hệ thống thiết kế

```text
Viết mục 4.8 cho đồ án GymShark: "Hiện thực hóa giao diện theo DESIGN_SYSTEM".

Nêu rõ:
- 2 theme sáng/tối lưu localStorage gym_theme; token Tailwind là CSS variable (:root sáng, .dark tối, mặc định dark); KHÔNG viết class dark: thủ công; grep kiểm tra emerald|teal-|slate-|rose-|bg-white|dark: phải ra 0 (theo AGENTS.md).
- Palette 7 token + tỷ lệ 70/20/8/2; neon chỉ accent, không nền lớn/không gradient neon.
- Font Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung) qua next/font/google; icon lucide-react; Reveal/IntersectionObserver + framer-motion ReducedMotion; cn().
- Thư viện component tự viết: Button/Card/Input/Select/Dialog/Badge/StatCard/Tabs/Toast/EmptyState/ErrorState/Spinner/Skeleton — không dùng package UI ngoài.
- 5 cụm route + layout/guard riêng; ảnh /images tông tối điện ảnh, alt tiếng Việt, next/image; responsive 6 viewport 375→1920 không overflow ngang; Three.js chỉ ở hero công khai với fallback ảnh.
- Nếu README và AGENTS.md mâu thuẫn về số theme, ưu tiên DESIGN_SYSTEM.md + code CSS và ghi "Điểm cần đối chiếu".

Có bảng token màu + 2 chỗ chèn `[Hình 4.8 — Trang chủ desktop / mobile]`. Độ dài 800–1.000 chữ. Áp dụng prompt chung.
```

---

## CHƯƠNG 5 — KIỂM THỬ, ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN

### A28. Mục 5.1 — Kiểm thử hệ thống

```text
Viết mục 5.1 "Kiểm thử hệ thống" cho đồ án GymShark theo đúng chất PDF mẫu: kiểm thử hộp đen + tích hợp API, kèm BẢNG 5.1 các testcase trọng yếu với cột Mã TC | Tên kịch bản | Các bước & Input | Kết quả mong đợi | Kết quả thực tế | Trạng thái.

Bắt buộc có 8 testcase (đổi nội dung cho gym, KHÔNG dùng EventRequest/Quotation của mẫu):
TC-01 Validate form đăng ký: để trống họ tên, email sai định dạng, số điện thoại trùng → zod/class-validator chặn, 400, không tạo User.
TC-02 Leo quyền RBAC: STAFF gọi GET /api/audit-logs → 403, dữ liệu không lộ; MEMBER gọi API payment của member khác → 404.
TC-03 Rate limit: gọi /api/auth/login quá 10 lần/60s → 429; gửi lại mã xác minh quá 5/300s → 429.
TC-04 Trùng mã: tạo Payment có transactionRef đã tồn tại → 409; tạo Invoice trùng invoiceNumber → lỗi unique được AllExceptionsFilter bắt, không crash.
TC-05 Luồng tiền: tạo Membership PENDING + Payment → xác nhận CASH → Membership ACTIVE + Invoice PAID, tổng tiền khớp; hủy Payment chờ thì không sinh hóa đơn.
TC-06 Hoàn tiền/quota: yêu cầu CANCEL_REFUND với ptSessionsUsed > 0 → proposedRefundAmount tính theo quota và ngày còn lại; luồng REQUESTED→...→COMPLETED ghi audit.
TC-07 Face ID: gửi vector sai → 400 (1:1) / 404 (1:N); mẫu real < 0.3 bị anti-spoof chặn; rút lui đồng ý xóa FaceEmbedding.
TC-08 Chốt ca: STAFF bấm chốt khi cashCounted ≠ cashExpected nhưng không ghi lý do → bị chặn; còn Payment CASH chờ → chưa cho chốt.

Sau bảng có đoạn "ĐÁNH GIÁ KẾT QUẢ KIỂM THỬ" theo 3 khía cạnh bảo mật / toàn vẹn dữ liệu / UX như mẫu, rồi thêm phần tổng hợp số liệu có trích nguồn: typecheck, lint, format:check, build FE (số route theo README — ghi rõ "theo README.md, có thể đã tăng"), build BE, prisma validate, smoke API 76/76, QA 38 route × 6 viewport 0 overflow/0 console error. KHÔNG tự nâng số; nếu số liệu cũ hơn code hiện tại, ghi chú cần chạy lại.

Độ dài 1.200–1.500 chữ + bảng 8 dòng. Áp dụng prompt chung.
```

### A29. Mục 5.2 — Đánh giá kết quả đạt được

```text
Viết mục 5.2 cho đồ án GymShark gồm:
5.2.1 "So sánh sản phẩm thực tế với mục tiêu đề ra ban đầu" — đối chiếu từng mục tiêu ở mục 0.2 với tính năng có thật: cổng công khai + 3 cổng người dùng, đăng ký xác minh email, vòng đời thẻ & thanh toán, check-in 3 phương thức, lịch tập/PT/dinh dưỡng/chat, ca làm & POS nước, báo cáo & audit. Nên có bảng "Mục tiêu | Kết quả hiện thực | Bằng chứng (file/route)".
5.2.2 "Ưu điểm của hệ thống" — theo 2 nhóm nghiệp vụ & kỹ thuật như mẫu:
  + Nghiệp vụ: quy trình khép kín, dòng tiền có xác nhận/hoàn tiền/bảo lưu, sinh trắc học có consent, chốt ca đối soát tiền, audit 53 action.
  + Kỹ thuật: module-based monolith dễ thêm module, Prisma + SQL Server giữ toàn vẹn, RBAC 2 lớp, realtime chỉ phát metadata để tránh lộ dữ liệu, design system nhất quán, CI chạy 4 bước FE + 3 bước BE.

Không dùng từ "100%", "hoàn hảo", "không còn lỗi". Mỗi ưu điểm phải có bằng chứng cụ thể. Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

### A30. Mục 5.3 — Hạn chế của hệ thống

```text
Viết mục 5.3 cho đồ án GymShark gồm 5.3.1 "Các nghiệp vụ chưa bao phủ hết", 5.3.2 "Giới hạn về công nghệ hiện tại", 5.3.3 "Rủi ro và hạn chế về bảo mật".

Bám nội dung thật đã nêu trong README.md/module.md, không chép hạn chế của mẫu:
- Nghiệp vụ: web chưa hỗ trợ thanh toán MoMo/VNPay (chỉ có enum `PaymentMethod`, stub `MomoGateway` và option demo bị disable; dữ liệu seed có giao dịch ví nhưng đó là dữ liệu mẫu, không chứng minh tính năng chạy được); chưa xuất hóa đơn điện tử/theo dõi thuế; chưa có ứng dụng di động native cho HLV/lễ tân; chương trình bài tập có phần dữ liệu tĩnh ở frontend/src/lib/programs.ts (đối chiếu với model Exercise/Program trong schema); chưa tự động cảnh báo trùng lịch phòng/thiết bị nâng cao.
- Công nghệ: chưa có unit/e2e test runner (mới smoke script + Playwright thủ công); refresh token chưa có (JWT 7 ngày); ảnh/attachment lưu data URL trong DB chưa dùng object storage; rate limit lưu in-memory chưa dùng Redis khi scale; CI đã có nhưng chưa deploy tự động.
- Bảo mật: chưa 2FA; dữ liệu sinh trắc học và ảnh chat là dữ liệu nhạy cảm theo NĐ 13/2023/NĐ-CP cần chính sách lưu trữ/xóa rõ ràng hơn; chưa WAF; cần HTTPS/reverse proxy khi đưa Internet; seed chứa tài khoản demo phải xóa khi production.

Mỗi hạn chế có 1 câu "Hướng xử lý xem mục 5.4". Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

### A31. Mục 5.4 — Định hướng phát triển tương lai

```text
Viết mục 5.4 "Định hướng phát triển tương lai" cho đồ án GymShark theo 4 nhóm như PDF mẫu nhưng nội dung gym:

5.4.1 AI trong huấn luyện & vận hành: dùng LLM gợi ý chương trình tập/ thực đơn dựa trên BodyMetric + lịch sử TrainingProgress; dự đoán rủi ro bỏ tập (churn) từ tần suất check-in; gợi ý định biên ca trực cuối tuần.
5.4.2 Hiện đại hóa chấm công & thiết bị: mở rộng Face ID sang điểm danh HLV/nhân viên, GPS/kiosk, cảnh báo thiết bị BROKEN tự động tạo phiếu bảo trì (work order).
5.4.3 Hoàn thiện tài chính: **lần đầu** tích hợp cổng thanh toán điện tử (MoMo/VNPay/QR — hiện web CHƯA có, chỉ mới để nền tảng enum/stub), đối soát tự động thay CASSO thủ công, xuất hóa đơn điện tử, báo cáo lợi nhuận theo ca/phòng/HLV.
5.4.4 Trải nghiệm hội viên: PWA/offline cho check-in, cổng hội viên đặt lịch/book lớp, nhắc tập qua đẩy thông báo, lưu ảnh/video lên object storage thay data URL; kèm 2FA + refresh token + Redis rate limit + unit test để khắc phục hạn chế mục 5.3.

Kết thúc bằng "KẾT LUẬN CHUNG" kiểu mẫu: hệ thống là nền móng, sẵn sàng nâng cấp. Không hứa hẹn tính năng đã làm là chưa làm. Độ dài 900–1.200 chữ. Áp dụng prompt chung.
```

---

## PHỤ LỤC

### A32. Phụ lục — Danh mục hình/bảng, tài liệu tham khảo, thuật ngữ

```text
Soạn phần Phụ lục cho báo cáo đồ án GymShark gồm 3 phần:

1) "Danh mục hình" và "Danh mục bảng" theo đúng kiểu PDF mẫu (cột: Hình/Bảng | Tên | Trang). Hãy LIỆT KÊ các hình/bảng mà các mục 3.x–5.x ở trên đã yêu cầu tạo (ERD, lược đồ quan hệ, activity diagram, cây thư mục, sequence thanh toán, sequence Face ID, bảng khảo sát 1.1, bảng use case, bảng từ điển dữ liệu, bảng RBAC, bảng testcase 5.1, bảng token màu...). Để số trang trống "..." để tôi điền sau khi render Word.

2) "Tài liệu tham khảo" theo chuẩn IEEE, chia 2 nhóm như mẫu:
- Sách/phương pháp luận: Robert C. Martin (Clean Architecture), Scrum Guide (Schwaber & Sutherland), UML Distilled (Martin Fowler), Database System Concepts (Silberschatz et al.) — giữ lại nhưng ghi chú đây là nền tảng lý thuyết, không phải kiến trúc hiện thực của dự án.
- Tài liệu trực tuyến/chuẩn công nghệ: NestJS docs, Next.js docs, Prisma docs, Microsoft SQL Server 2022 docs, Tailwind CSS docs, Zod docs, Socket.IO docs, @vladmandic/human docs, Node.js docs; bổ sung Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (bắt buộc vì có FaceEmbedding).
Mỗi mục có comment ngắn "Tài liệu tham chiếu cho mục ..." như mẫu. Không bịa link sai; nếu không nhớ chính tả URL thì ghi tên tài liệu + "truy cập qua trang chủ chính thức".

3) "Bảng thuật ngữ" 20–25 từ viết tắt: API, ORM, JWT, RBAC, DTO, ERD, UML, REST, SPA/SSR, SWR/React Query, WebSocket, CORS, UUID, ACID, CSV BOM, POS, CASSO, QR VietQR, PT, FACE_ID, consent, quota, audit log, PWA, 2FA. Cột: Viết tắt | Tên đầy đủ | Giải nghĩa tiếng Việt.

Cuối cùng thêm 1 dòng hướng dẫn biên tập: "Sau khi sinh nội dung, dán vào Word, cập nhật số trang trong Mục lục + Danh mục hình/bảng và chèn ảnh chụp màn hình thực tế vào các chỗ [Hình 4.x]".
Độ dài không giới hạn. Áp dụng prompt chung.
```

---

## Kiểm tra nhanh sau khi NotebookLM trả kết quả

- [ ] Không còn từ `EventRequests`, `Quotations`, `Contracts`, `TypeORM`, `SQL Server 2019`, `Clean Architecture 4 lớp` trong bất kỳ mục nào.
- [ ] Mọi tên model khớp `backend/prisma/schema.prisma`; mọi route khớp `@Controller(...)` trong `backend/src/modules`.
- [ ] Các chỗ `[CẦN BỔ SUNG: ...]` đã được điền hoặc chấp nhận để trống có chủ đích.
- [ ] Số liệu kiểm thử có nguồn; không tự nâng lên con số đẹp hơn.
- [ ] Mục 5.3 nói thẳng web KHÔNG có thanh toán MoMo/VNPay (chỉ enum/stub/demo); mục 5.4 chỉ nêu như định hướng chưa làm, không viết như đã tích hợp.
- [ ] Đồng bộ số trang giữa Mục lục, Danh mục hình, Danh mục bảng sau khi render Word.
