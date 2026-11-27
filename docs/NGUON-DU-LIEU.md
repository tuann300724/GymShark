# NGUỒN TỔNG HỢP — ĐỒ ÁN GYMSHARK / GYMMaster PRO (dành cho NotebookLM)

> File này được tạo bằng cách gộp các file nguồn trong repository. Dùng làm tài liệu tham khảo khi viết báo cáo đồ án theo bộ prompt trong `docs/prompts-bao-cao-gymshark.md`.

> **Không chứa dữ liệu thật.** `seed.ts` chỉ là dữ liệu demo. Không upload file database (.mdf/.bak) vì chứa dữ liệu nhạy cảm theo NĐ 13/2023/NĐ-CP.


## Quy tắc đọc nguồn này

1. Ưu tiên mã nguồn (schema, enum, seed, script SQL, cấu hình) khi mâu thuẫn với văn bản (README, module.md, Architechture.md, DESIGN_SYSTEM.md).

2. Điểm mâu thuẫn đã biết:

   - README ghi `dark-only` / `chưa tích hợp email`, nhưng `DESIGN_SYSTEM.md` mô tả 2 theme và code đã có `nodemailer` + model `EmailVerification`.

   - README ghi 35 model, nhưng `schema.prisma` có 36 model (kể cả `BeverageLocation` có `@@ignore`).

   - AGENTS.md còn nhắc gỡ thiết bị, nhưng `Equipment` / `EquipmentMaintenance` vẫn nằm trong schema.

   - Architechture.md vừa nhắc Clean Architecture vừa nói rõ mô hình thực tế là module-based monolith → dùng mô hình thực tế.

3. PDF mẫu (`Gym master.pdf`) là đề tài EMS; chỉ dùng KHUNG HÌNH THỨC, không sao chép TypeORM / SQL Server 2019 / 4 lớp Clean Architecture / EventRequests / Quotations.

4. ⚠️ PHẠM VI BÁO CÁO (đã đối chiếu với README.md và module.md): chỉ mô tả **4 vai trò ADMIN / STAFF / TRAINER / MEMBER**; thanh toán có **tiền mặt (CASH)** và **chuyển khoản (BANK_TRANSFER)**, trong đó chuyển khoản đối soát qua **CASSO** (Google Sheet/Apps Script), tiền mặt xác nhận tại quầy. STAFF/ADMIN xác nhận thủ công khi cần. Các đoạn code/seed trong file này vẫn có dấu vết legacy (enum `MANAGER`, enum `MOMO`/`VNPAY`, stub, seed demo) — KHÔNG đưa vào báo cáo, kể cả ở phần định hướng tương lai. Nguồn mô tả nghiệp vụ chuẩn là README.md + module.md đã sửa.


## Mục lục nguồn

- 1. Schema Prisma (36 model) — nguồn chuẩn cho từ điển dữ liệu, ERD, chuẩn hóa, ràng buộc — `backend/prisma/schema.prisma`
- 2. Const enum & vai trò — các giá trị trạng thái thực tế — `backend/src/common/constants/db-enums.ts`
- 2b. Role enum — `backend/src/common/enums/role.enum.ts`
- 3. Seed dữ liệu mẫu — số liệu demo và ví dụ giá trị — `backend/prisma/seed.ts`
- 4. Migration: giữ nguyên DB legacy gym_db — `backend/prisma/sqlserver-gymdb-preserve-migration.sql`
- 5. Migration: bỏ quản lý chi nhánh, gộp về một địa điểm — `backend/prisma/sqlserver-remove-branch-management.sql`
- 6. Migration: chốt quỹ ca làm — `backend/prisma/sqlserver-add-staff-shift-settlement.sql`
- 7. Migration: mẫu ca theo tuần & chấm công — `backend/prisma/sqlserver-add-weekly-staff-shifts.sql`
- 8. Cấu hình khởi động backend (main.ts) — `backend/src/main.ts`
- 9. AppModule — danh sách module được import — `backend/src/app.module.ts`
- 10. package.json backend — phiên bản công nghệ — `backend/package.json`
- 11. package.json frontend — phiên bản công nghệ — `frontend/package.json`
- 12. README.md — nghiệp vụ, RBAC, bảo mật, kết quả kiểm thử — `README.md`
- 13. module.md — danh sách chức năng theo module — `module.md`
- 14. Architechture.md — công nghệ & kiến trúc — `Architechture.md`
- 15. DESIGN_SYSTEM.md — chuẩn giao diện — `DESIGN_SYSTEM.md`
- 16. CI workflow — `.github/workflows/ci.yml`

---


## 1. Schema Prisma (36 model) — nguồn chuẩn cho từ điển dữ liệu, ERD, chuẩn hóa, ràng buộc

> Nguồn: `backend/prisma/schema.prisma`
> Đây là nguồn số 1. Mọi tên model/field/khoá/index phải lấy ở đây. Lưu ý: không có khai báo `enum` trong Prisma; giá trị trạng thái nằm ở mục 2.


````prisma

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// MODELS
// -------------------------------------------------------------

model BeverageLocation {
  id        String   @id @default(uuid()) @db.NVarChar(100)
  name      String   @unique @db.NVarChar(400)
  address   String?  @db.NVarChar(Max)
  phone     String?  @db.NVarChar(400)
  status    String   @default("ACTIVE") @db.NVarChar(400)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("Branch")
  @@ignore
}

model Room {
  id          String   @id @default(uuid()) @db.NVarChar(100)
  code        String?  @unique @db.NVarChar(400) // mã phòng duy nhất toàn hệ thống, VD: R-01
  name        String   @db.NVarChar(400)
  type        String   @default("GYM_AREA") @db.NVarChar(400)
  capacity    Int      @default(20)
  floor       String?  @db.NVarChar(400)
  description String?  @db.NVarChar(Max)
  status      String   @default("AVAILABLE") @db.NVarChar(400)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  schedules TrainingSchedule[]

  @@index([status])
  @@index([type])
}

model User {
  id           String   @id @default(uuid()) @db.NVarChar(100)
  email        String   @unique @db.NVarChar(400)
  passwordHash String   @db.NVarChar(400)
  fullName     String   @db.NVarChar(400)
  /// Số điện thoại là định danh liên hệ của hội viên — 1 số chỉ 1 tài khoản.
  /// NULL vẫn cho phép nhiều tài khoản (nhân viên không bắt buộc khai số).
  phone        String?  @unique @db.NVarChar(400)
  role         String   @default("MEMBER") @db.NVarChar(400)
  status       String   @default("ACTIVE") @db.NVarChar(400)
  avatarUrl    String?  @db.NVarChar(400)
  /// Kênh đăng nhập: LOCAL (email + mật khẩu) hoặc GOOGLE (OAuth 2.0).
  /// Tài khoản Google lần đầu được tạo với mật khẩu ngẫu nhiên (không dùng tới).
  provider     String   @default("LOCAL") @db.NVarChar(400)
  /// Google `sub` — mã định danh bên Google, chỉ có với tài khoản OAuth.
  providerId   String?  @unique @db.NVarChar(100)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  trainer                     Trainer?
  member                      Member?
  notifications               Notification[]
  confirmedPayments           Payment[]                 @relation("PaymentConfirmedBy")
  auditLogs                   AuditLog[]
  messages                    Message[]                 @relation("MessageSender")
  reviewedMembershipRequests  MembershipChangeRequest[] @relation("MembershipChangeReviewedBy")
  approvedMembershipRequests  MembershipChangeRequest[] @relation("MembershipChangeApprovedBy")
  completedMembershipRequests MembershipChangeRequest[] @relation("MembershipChangeCompletedBy")

  @@index([email])
  @@index([role])
}

model Trainer {
  id              String    @id @default(uuid()) @db.NVarChar(100)
  userId          String    @unique @db.NVarChar(100)
  user            User      @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  specialization  String    @db.NVarChar(400)
  certification   String?   @db.NVarChar(400)
  experienceYears Int       @default(1)
  bio             String?   @db.NVarChar(Max)
  gender          String?   @db.NVarChar(400)
  dateOfBirth     DateTime?
  rating          Float     @default(5.0)
  hourlyRate      Decimal?  @db.Decimal(10, 2)
  status          String    @default("ACTIVE") @db.NVarChar(400)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  schedules      TrainingSchedule[]
  trainerMembers TrainerMember[]
  progressNotes  TrainingProgress[]
  conversations  Conversation[]
  mealPlans      MealPlan[]
  programs       Program[]

  @@index([userId])
  @@index([status])
  @@index([specialization])
}

model Member {
  id                       String                    @id @default(uuid()) @db.NVarChar(100)
  code                     String                    @unique @db.NVarChar(400)
  userId                   String?                   @unique @db.NVarChar(100)
  user                     User?                     @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  fullName                 String                    @db.NVarChar(400)
  email                    String?                   @db.NVarChar(400)
  phone                    String                    @db.NVarChar(400)
  gender                   String                    @default("MALE") @db.NVarChar(400)
  dateOfBirth              DateTime?
  address                  String?                   @db.NVarChar(Max)
  avatarUrl                String?                   @db.NVarChar(400)
  status                   String                    @default("ACTIVE") @db.NVarChar(400)
  notes                    String?                   @db.NVarChar(Max)
  emergencyContact         String?                   @db.NVarChar(Max)
  joinedAt                 DateTime                  @default(now())
  referralCode             String?                   @unique @db.NVarChar(400) // Mã giới thiệu cá nhân
  referredById             String?                   @db.NVarChar(100) // Hội viên đã giới thiệu người này
  referredBy               Member?                   @relation("Referral", fields: [referredById], references: [id], onDelete: NoAction, onUpdate: NoAction)
  referrals                Member[]                  @relation("Referral")
  membershipChangeRequests MembershipChangeRequest[] @relation("MembershipChangeRequester")
  referralRewardedAt       DateTime? // Chưa thưởng / đã thưởng khi người được giới thiệu kích hoạt gói đầu tiên
  createdAt                DateTime                  @default(now())
  updatedAt                DateTime                  @updatedAt

  memberships    Membership[]
  payments       Payment[]
  checkIns       CheckIn[]
  schedules      TrainingSchedule[]
  notifications  Notification[]
  trainerMembers TrainerMember[]
  progressNotes  TrainingProgress[]
  invoices       Invoice[]
  faceEmbeddings FaceEmbedding[]
  conversations  Conversation[]
  mealPlans      MealPlan[]
  programs       Program[]
  classBookings  ClassBooking[]
  bodyMetrics    BodyMetric[]

  @@index([code])
  @@index([phone])
  @@index([status])
}

/// ĐĂNG KÝ HỘI VIÊN CHỜ XÁC MINH EMAIL — dữ liệu form đăng ký + mã 6 số đã gửi
/// qua email. Tài khoản User/Member CHƯA được tạo cho tới khi hội viên nhập đúng mã,
/// nên email vẫn có thể đăng ký lại khi mã hết hạn và không tạo rác trong bảng User.
/// `codeHash` là bcrypt hash của mã (không lưu mã dạng rõ) và `passwordHash` là
/// bcrypt hash của mật khẩu — dòng này bị lộ cũng không lộ bí mật gốc.
model EmailVerification {
  id               String    @id @default(uuid()) @db.NVarChar(100)
  email            String    @db.NVarChar(400)
  fullName         String    @db.NVarChar(400)
  phone            String    @db.NVarChar(400)
  passwordHash     String    @db.NVarChar(400)
  codeHash         String    @db.NVarChar(400)
  gender           String    @default("MALE") @db.NVarChar(400)
  dateOfBirth      DateTime?
  address          String?   @db.NVarChar(Max)
  emergencyContact String?   @db.NVarChar(Max)
  /// Số lần nhập sai — chạm ngưỡng thì xoá dòng, buộc người dùng xin mã mới
  attempts         Int       @default(0)
  /// Mốc hết hạn của mã (đếm ngược ở UI đăng ký)
  expiresAt        DateTime
  /// Lần gửi mã gần nhất — chặn spam bằng @Throttle + khoảng nghỉ tối thiểu
  lastSentAt       DateTime  @default(now())
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([email])
  @@index([expiresAt])
  @@index([lastSentAt])
}

model MembershipPackage {
  id             String   @id @default(uuid()) @db.NVarChar(100)
  code           String   @unique @db.NVarChar(400)
  name           String   @db.NVarChar(400)
  description    String?  @db.NVarChar(Max)
  features       String?  @db.NVarChar(Max)
  durationDays   Int
  price          Decimal  @db.Decimal(12, 2)
  sessions       Int?
  ptSessionValue Decimal? @db.Decimal(12, 2)
  type           String   @default("FIXED_TERM") @db.NVarChar(400)
  status         String   @default("ACTIVE") @db.NVarChar(400)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  memberships Membership[]

  @@index([code])
  @@index([status])
}

model Membership {
  id                  String            @id @default(uuid()) @db.NVarChar(100)
  memberId            String            @db.NVarChar(100)
  member              Member            @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  packageId           String            @db.NVarChar(100)
  package             MembershipPackage @relation(fields: [packageId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  startDate           DateTime
  endDate             DateTime
  price               Decimal           @db.Decimal(12, 2)
  discountAmount      Decimal?          @db.Decimal(12, 2)
  finalAmount         Decimal?          @db.Decimal(12, 2)
  remainingSessions   Int?
  ptSessionsIncluded  Int?
  ptSessionsUsed      Int               @default(0)
  ptSessionValue      Decimal?          @db.Decimal(12, 2)
  freezeStartedAt     DateTime?
  freezeEndsAt        DateTime?
  status              String            @default("ACTIVE") @db.NVarChar(400)
  // Hội viên tự gửi yêu cầu hủy gói — chờ admin duyệt (null = không có yêu cầu)
  cancelRequestedAt   DateTime?
  cancelRequestReason String?           @db.NVarChar(Max)
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  payments          Payment[]
  invoices          Invoice[]
  changeRequests    MembershipChangeRequest[] @relation("MembershipChangeSource")
  trainingSchedules TrainingSchedule[]

  @@index([memberId])
  @@index([packageId])
  @@index([status])
  @@index([endDate])
}

model MembershipChangeRequest {
  id                   String     @id @default(uuid()) @db.UniqueIdentifier
  membershipId         String     @db.UniqueIdentifier
  membership           Membership @relation("MembershipChangeSource", fields: [membershipId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_MembershipChangeRequest_Membership")
  memberId             String     @db.UniqueIdentifier
  member               Member     @relation("MembershipChangeRequester", fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_MembershipChangeRequest_Member")
  type                 String     @db.NVarChar(40)
  status               String     @default("REQUESTED") @db.NVarChar(50)
  reason               String?    @db.NVarChar(Max)
  reviewNote           String?    @db.NVarChar(Max)
  freezeDays           Int?
  freezeStartsAt       DateTime?
  freezeEndsAt         DateTime?
  ptSessionsUsed       Int?
  proposedRefundAmount Decimal?   @db.Decimal(12, 2)
  proposedRefundReason String?    @db.NVarChar(Max)
  refundAmount         Decimal?   @db.Decimal(12, 2)
  refundMethod         String?    @db.NVarChar(40)
  refundReference      String?    @db.NVarChar(400)
  memberConfirmedAt    DateTime?
  reviewedAt           DateTime?
  reviewedById         String?    @db.UniqueIdentifier
  reviewedBy           User?      @relation("MembershipChangeReviewedBy", fields: [reviewedById], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_MembershipChangeRequest_ReviewedBy")
  approvedAt           DateTime?
  approvedById         String?    @db.UniqueIdentifier
  approvedBy           User?      @relation("MembershipChangeApprovedBy", fields: [approvedById], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_MembershipChangeRequest_ApprovedBy")
  completedAt          DateTime?
  completedById        String?    @db.UniqueIdentifier
  completedBy          User?      @relation("MembershipChangeCompletedBy", fields: [completedById], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_MembershipChangeRequest_CompletedBy")
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  @@index([membershipId, type, status], map: "IX_MembershipChangeRequest_membershipId_type_status")
  @@index([memberId, status], map: "IX_MembershipChangeRequest_memberId_status")
}

model Payment {
  id             String      @id @default(uuid()) @db.NVarChar(100)
  code           String      @unique @db.NVarChar(400)
  memberId       String      @db.NVarChar(100)
  member         Member      @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  membershipId   String?     @db.NVarChar(100)
  membership     Membership? @relation(fields: [membershipId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  amount         Decimal     @db.Decimal(12, 2)
  // Tiền giảm thực tế tại thời điểm thanh toán (giữ nguyên lịch sử, không tính lại)
  discountAmount Decimal?    @db.Decimal(12, 2)
  currency       String      @default("VND") @db.NVarChar(400)
  method         String      @default("CASH") @db.NVarChar(400)
  status         String      @default("PENDING") @db.NVarChar(400)
  // Mã giao dịch ngoài (chuyển khoản / cổng thanh toán) — unique nếu có giá trị
  transactionRef String?     @unique @db.NVarChar(400)
  notes          String?     @db.NVarChar(Max)
  // Xác nhận / hoàn tiền: ai đã duyệt, vào lúc nào
  confirmedById  String?     @db.NVarChar(100)
  confirmedBy    User?       @relation("PaymentConfirmedBy", fields: [confirmedById], references: [id], onDelete: SetNull, onUpdate: NoAction)
  confirmedAt    DateTime?
  staffShiftId   String?     @db.UniqueIdentifier
  staffShift     StaffShift? @relation(fields: [staffShiftId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_Payment_StaffShift")
  paidAt         DateTime?
  // Hoàn tiền: số tiền hoàn thực tế (có thể < amount) + phương thức trả lại tiền
  refundAmount   Decimal?    @db.Decimal(12, 2)
  refundMethod   String?     @db.NVarChar(400)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  invoice Invoice?

  @@index([code])
  @@index([memberId])
  @@index([membershipId])
  @@index([status])
  @@index([staffShiftId, status, paidAt], map: "IX_Payment_StaffShift_Status_PaidAt")
  @@index([createdAt])
  @@index([paidAt])
}

model StaffShift {
  id             String    @id @default(dbgenerated("newsequentialid()")) @db.UniqueIdentifier
  /// Database FK to dbo.User; kept scalar because User.id is mapped as NVARCHAR elsewhere in this schema.
  staffId        String    @db.UniqueIdentifier
  title          String    @db.NVarChar(255)
  startTime      DateTime
  endTime        DateTime
  status         String    @default("SCHEDULED") @db.NVarChar(20)
  notes          String?   @db.NVarChar(Max)
  cashExpected   Decimal?  @db.Decimal(12, 2)
  cashCounted    Decimal?  @db.Decimal(12, 2)
  cashDifference Decimal?  @db.Decimal(12, 2)
  closedById     String?   @db.UniqueIdentifier
  closedAt       DateTime?
  closeNotes     String?   @db.NVarChar(1000)
  startedAt      DateTime?
  endedAt        DateTime?
  createdAt      DateTime  @default(dbgenerated("sysdatetime()"))
  updatedAt      DateTime  @default(dbgenerated("sysdatetime()"))
  payments       Payment[]

  @@index([staffId, startTime], map: "IX_StaffShift_Staff_StartTime")
}

model StaffShiftTemplate {
  id          String   @id @default(dbgenerated("newsequentialid()")) @db.UniqueIdentifier
  staffId     String   @db.UniqueIdentifier
  title       String   @db.NVarChar(255)
  weekday     Int      @db.TinyInt
  startMinute Int      @db.SmallInt
  endMinute   Int      @db.SmallInt
  notes       String?  @db.NVarChar(Max)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(dbgenerated("sysutcdatetime()"))
  updatedAt   DateTime @default(dbgenerated("sysutcdatetime()"))

  @@index([staffId, weekday, isActive], map: "IX_StaffShiftTemplate_Staff_Weekday")
}

// Hóa đơn (Invoice) — tài liệu thanh toán, 1-1 với Payment trong flow đăng ký gói
model Invoice {
  id            String      @id @default(uuid()) @db.NVarChar(100)
  invoiceNumber String      @unique @db.NVarChar(400)
  memberId      String      @db.NVarChar(100)
  member        Member      @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  membershipId  String?     @db.NVarChar(100)
  membership    Membership? @relation(fields: [membershipId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  paymentId     String?     @unique @db.NVarChar(100)
  payment       Payment?    @relation(fields: [paymentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  subtotal      Decimal     @db.Decimal(12, 2)
  discount      Decimal     @default("0") @db.Decimal(12, 2)
  total         Decimal     @db.Decimal(12, 2)
  status        String      @default("ISSUED") @db.NVarChar(400)
  issuedAt      DateTime    @default(now())
  dueDate       DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([invoiceNumber])
  @@index([memberId])
  @@index([membershipId])
  @@index([status])
  @@index([createdAt])
}

model CheckIn {
  id           String     @id @default(uuid()) @db.NVarChar(100)
  memberId     String     @db.NVarChar(100)
  equipmentId  String?    @db.NVarChar(100)
  equipment    Equipment? @relation("EquipmentCheckIns", fields: [equipmentId], references: [id], onDelete: SetNull, onUpdate: Cascade)
  member       Member     @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  checkInTime  DateTime   @default(now())
  checkOutTime DateTime?
  status       String     @default("CHECKED_IN") @db.NVarChar(400)
  method       String     @default("MANUAL") @db.NVarChar(400)
  notes        String?    @db.NVarChar(Max)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([memberId])
  @@index([equipmentId])
  @@index([status])
  @@index([checkInTime])
}

/// DỮ LIỆU SINH TRẮC HỌC — vector embedding + ảnh tham chiếu chụp lúc đăng ký.
/// Là dữ liệu cá nhân nhạy cảm theo Nghị định 13/2023/NĐ-CP: chỉ lưu khi hội viên
/// đồng ý tường minh (consentAt), và xoá toàn bộ dòng = rút lui đồng ý.
/// Một hội viên có nhiều mẫu (mỗi góc mặt 1 dòng). Ảnh chỉ gắn ở MẪU ĐẦU TIÊN
/// (imageData != null) để không nhân bản cùng một ảnh ra 5 dòng.
model FaceEmbedding {
  id        String   @id @default(uuid()) @db.NVarChar(100)
  memberId  String   @db.NVarChar(100)
  member    Member   @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  embedding String?  @db.NVarChar(Max)
  /// Ảnh khuôn mặt tham chiếu (data URL JPEG base64) — chỉ có ở mẫu đầu tiên
  imageData String?  @db.NVarChar(Max)
  consentAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([memberId])
}

model TrainingSchedule {
  id               String      @id @default(uuid()) @db.NVarChar(100)
  title            String      @db.NVarChar(400)
  trainerId        String      @db.NVarChar(100)
  trainer          Trainer     @relation(fields: [trainerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId         String?     @db.NVarChar(100)
  member           Member?     @relation(fields: [memberId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  membershipId     String?     @db.UniqueIdentifier
  membership       Membership? @relation(fields: [membershipId], references: [id], onDelete: SetNull, onUpdate: NoAction, map: "FK_TrainingSchedule_Membership")
  roomId           String?     @db.NVarChar(100)
  room             Room?       @relation(fields: [roomId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  type             String      @default("PERSONAL_TRAINING") @db.NVarChar(400)
  startTime        DateTime
  endTime          DateTime
  status           String      @default("SCHEDULED") @db.NVarChar(400)
  description      String?     @db.NVarChar(Max)
  notes            String?     @db.NVarChar(Max)
  cancellationNote String?     @db.NVarChar(Max)
  completedAt      DateTime?
  capacity         Int? // Sức chứa ca nhóm (null = buổi 1:1 PT, hội viên không cần đăng ký)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  progressNotes TrainingProgress[]
  bookings      ClassBooking[]

  @@index([trainerId])
  @@index([memberId])
  @@index([membershipId], map: "IX_TrainingSchedule_membershipId")
  @@index([roomId])
  @@index([startTime])
  @@index([endTime])
  @@index([status])
  @@index([type])
}

// Đăng ký ca nhóm: hội viên tự book chỗ trong buổi GROUP_CLASS có sức chứa
model ClassBooking {
  id         String           @id @default(uuid()) @db.NVarChar(100)
  scheduleId String           @db.NVarChar(100)
  schedule   TrainingSchedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  memberId   String           @db.NVarChar(100)
  member     Member           @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  createdAt  DateTime         @default(now())

  @@unique([scheduleId, memberId])
  @@index([memberId])
}

// Số đo cơ thể hội viên tự theo dõi (cân nặng, % mỡ, vòng eo...) — biểu đồ tiến trình
model BodyMetric {
  id             String   @id @default(uuid()) @db.NVarChar(100)
  memberId       String   @db.NVarChar(100)
  member         Member   @relation(fields: [memberId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  recordedAt     DateTime @default(now())
  weightKg       Float?
  bodyFatPercent Float?
  waistCm        Float?
  chestCm        Float?
  armCm          Float?
  thighCm        Float?
  note           String?  @db.NVarChar(Max)
  createdAt      DateTime @default(now())

  @@index([memberId])
  @@index([recordedAt])
}

// Phân công HLV ↔ Hội viên (giữ lịch sử: chỉ 1 phân công ACTIVE cho mỗi member)
model TrainerMember {
  id        String    @id @default(uuid()) @db.NVarChar(100)
  trainerId String    @db.NVarChar(100)
  trainer   Trainer   @relation(fields: [trainerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId  String    @db.NVarChar(100)
  member    Member    @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  startDate DateTime  @default(now())
  endDate   DateTime?
  status    String    @default("ACTIVE") @db.NVarChar(400)
  note      String?   @db.NVarChar(400)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([trainerId])
  @@index([memberId])
  @@index([status])
  @@index([trainerId, memberId])
}

// Ghi chú tiến trình buổi tập do HLV đánh giá sau buổi
model Program {
  id               String            @id @default(uuid()) @db.NVarChar(100)
  slug             String            @unique @db.NVarChar(400)
  name             String            @db.NVarChar(400)
  group            String?           @db.NVarChar(400)
  duration         Int?
  summary          String?           @db.NVarChar(Max)
  img              String?           @db.NVarChar(400)
  alt              String?           @db.NVarChar(400)
  trainerId        String?           @db.NVarChar(100)
  trainer          Trainer?          @relation(fields: [trainerId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  memberId         String?           @db.NVarChar(100)
  member           Member?           @relation(fields: [memberId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  status           String            @default("DRAFT") @db.NVarChar(400)
  isTemplate       Boolean           @default(false)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  programExercises ProgramExercise[]

  @@index([slug])
  @@index([trainerId])
  @@index([memberId])
  @@index([status])
}

model Exercise {
  id          String   @id @default(uuid()) @db.NVarChar(100)
  name        String   @db.NVarChar(400)
  enName      String?  @db.NVarChar(400)
  group       String   @db.NVarChar(400)
  equipment   String?  @db.NVarChar(400)
  description String?  @db.NVarChar(Max)
  imageUrl    String?  @db.NVarChar(400)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  programExercises ProgramExercise[]

  @@index([name])
  @@index([group])
}

model ProgramExercise {
  id         String   @id @default(uuid()) @db.NVarChar(100)
  programId  String   @db.NVarChar(100)
  exerciseId String   @db.NVarChar(100)
  exercise   Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  program    Program  @relation(fields: [programId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  sets       Int      @default(3)
  reps       String   @db.NVarChar(100)
  rest       String?  @db.NVarChar(400)
  orderIndex Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([programId, orderIndex])
  @@index([programId])
  @@index([exerciseId])
}

model TrainingProgress {
  id             String           @id @default(uuid()) @db.NVarChar(100)
  sessionId      String           @db.NVarChar(100)
  session        TrainingSchedule @relation(fields: [sessionId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId       String           @db.NVarChar(100)
  member         Member           @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  trainerId      String           @db.NVarChar(100)
  trainer        Trainer          @relation(fields: [trainerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  note           String           @db.NVarChar(400)
  performance    String?          @db.NVarChar(Max)
  recommendation String?          @db.NVarChar(Max)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([sessionId])
  @@index([memberId])
  @@index([trainerId])
}

// Nhật ký hoạt động (AuditLog) — ghi lại các hành động quan trọng trong hệ thống
// Không bao giờ lưu password/token vào bảng này.
model AuditLog {
  id        String   @id @default(uuid()) @db.NVarChar(100)
  userId    String?  @db.NVarChar(100)
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  action    String   @db.NVarChar(400) // VD: AUTH_LOGIN, MEMBER_CREATE, PAYMENT_CONFIRM, CHECK_IN...
  entity    String   @db.NVarChar(400) // Tên entity: Member, Payment, Schedule...
  entityId  String?  @db.NVarChar(100)
  metadata  String?  @db.NVarChar(Max)
  ip        String?  @db.NVarChar(400)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([entityId])
  @@index([createdAt])
}

model Notification {
  id            String    @id @default(uuid()) @db.NVarChar(100)
  userId        String?   @db.NVarChar(100)
  user          User?     @relation(fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId      String?   @db.NVarChar(100)
  member        Member?   @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  title         String    @db.NVarChar(400)
  content       String    @db.NVarChar(Max)
  type          String    @default("SYSTEM") @db.NVarChar(400)
  isRead        Boolean   @default(false)
  readAt        DateTime? // STEP 8 — mốc thời gian đọc thực tế
  link          String?   @db.NVarChar(400)
  // STEP 8 — chống trùng lặp / truy vết nguồn sự kiện sinh ra thông báo
  referenceType String?   @db.NVarChar(400)
  referenceId   String?   @db.NVarChar(100)
  data          String?   @db.NVarChar(Max) // STEP 8 — payload mở rộng (giá trị động, meta điều hướng)
  createdAt     DateTime  @default(now())

  @@index([userId])
  @@index([memberId])
  @@index([isRead])
  @@index([referenceType, referenceId])
  @@index([memberId, isRead])
  @@index([userId, isRead])
  @@index([memberId, createdAt])
  @@index([userId, createdAt])
}

/// MÃ ĐẶT LẠI MẬT KHẨU — yêu cầu quên mật khẩu qua email (luồng 2 bước).
/// Chỉ lưu bcrypt hash của mã 6 số, không lưu mã dạng rõ. Hết hạn hoặc dùng
/// xong thì xoá để bảng không phình. Không liên kết User để tránh lộ userId.
model PasswordReset {
  id         String   @id @default(uuid()) @db.NVarChar(100)
  email      String   @db.NVarChar(400)
  codeHash   String   @db.NVarChar(400)
  attempts   Int      @default(0)
  expiresAt  DateTime
  lastSentAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([email])
  @@index([expiresAt])
}

// -------------------------------------------------------------
// CHAT REALTIME (HLV ↔ Hội viên) + THỰC ĐƠN DINH DƯỠNG
// -------------------------------------------------------------

/// Cuộc trò chuyện 1-1 giữa HLV và hội viên được phân công (TrainerMember ACTIVE).
/// Quyền truy cập KHÔNG đọc từ bảng này mà suy ra từ phân công TrainerMember đang ACTIVE.
model Conversation {
  id        String  @id @default(uuid()) @db.NVarChar(100)
  trainerId String  @db.NVarChar(100)
  trainer   Trainer @relation(fields: [trainerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId  String  @db.NVarChar(100)
  member    Member  @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  status    String  @default("ACTIVE") @db.NVarChar(400)

  // Bản sao để hiển thị danh sách hội thoại không cần join/aggregate tin nhắn
  lastMessageAt      DateTime?
  lastMessagePreview String?   @db.NVarChar(Max)
  lastSenderRole     String?   @db.NVarChar(400)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages Message[]

  @@unique([trainerId, memberId])
  @@index([trainerId])
  @@index([memberId])
  @@index([lastMessageAt])
  @@index([status])
}

model Message {
  id             String       @id @default(uuid()) @db.NVarChar(100)
  conversationId String       @db.NVarChar(100)
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  senderId       String       @db.NVarChar(100)
  sender         User         @relation("MessageSender", fields: [senderId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  type           String       @default("TEXT") @db.NVarChar(400)
  content        String?      @db.NVarChar(Max)
  /// Tin nhắn thực đơn phải trỏ tới bản ghi MealPlan thật (không lưu text suông)
  mealPlanId     String?      @db.NVarChar(100)
  mealPlan       MealPlan?    @relation(fields: [mealPlanId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  isRead         Boolean      @default(false)
  readAt         DateTime?
  /// Đã tới thiết bị người nhận (double check xám)
  deliveredAt    DateTime?
  editedAt       DateTime?
  /// Thu hồi tin nhắn: khi có giá trị, nội dung/ảnh đã bị xoá vĩnh viễn
  recalledAt     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  attachments MessageAttachment[]

  @@index([conversationId])
  @@index([senderId])
  @@index([conversationId, createdAt])
  @@index([conversationId, isRead])
  @@index([mealPlanId])
}

/// Ảnh/tệp đính kèm của tin nhắn. Ảnh lưu dạng data URL base64 trong DB —
/// cùng kiến trúc với ảnh khuôn mặt (dự án không có dịch vụ lưu trữ tập tin).
model MessageAttachment {
  id        String   @id @default(uuid()) @db.NVarChar(100)
  messageId String   @db.NVarChar(100)
  message   Message  @relation(fields: [messageId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  kind      String   @default("IMAGE") @db.NVarChar(400) // IMAGE | FILE
  fileName  String?  @db.NVarChar(400)
  mimeType  String?  @db.NVarChar(400)
  sizeBytes Int?
  dataUrl   String   @db.NVarChar(Max)
  width     Int?
  height    Int?
  createdAt DateTime @default(now())

  @@index([messageId])
}

/// Thư viện thực phẩm dùng chung. Dinh dưỡng quy chuẩn trên 100g để quy đổi theo khối lượng.
model Food {
  id              String   @id @default(uuid()) @db.NVarChar(100)
  name            String   @db.NVarChar(400)
  category        String   @default("PROTEIN") @db.NVarChar(400)
  imageUrl        String?  @db.NVarChar(400)
  description     String?  @db.NVarChar(Max)
  servingSize     Float    @default(100)
  servingUnit     String   @default("g") @db.NVarChar(400)
  caloriesPer100g Float    @default(0)
  proteinPer100g  Float    @default(0)
  carbsPer100g    Float    @default(0)
  fatPer100g      Float    @default(0)
  isActive        Boolean  @default(true)
  createdById     String?  @db.NVarChar(100)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  items MealItem[]

  @@index([category])
  @@index([name])
  @@index([isActive])
}

/// Thực đơn HLV tạo: theo ngày hoặc theo tuần, gồm nhiều bữa.
/// `isTemplate` = lưu mẫu để tái sử dụng (memberId null).
model MealPlan {
  id            String    @id @default(uuid()) @db.NVarChar(100)
  trainerId     String    @db.NVarChar(100)
  trainer       Trainer   @relation(fields: [trainerId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  memberId      String?   @db.NVarChar(100)
  member        Member?   @relation(fields: [memberId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  title         String    @db.NVarChar(400)
  description   String?   @db.NVarChar(Max)
  scope         String    @default("DAY") @db.NVarChar(400)
  startDate     DateTime?
  status        String    @default("SENT") @db.NVarChar(400)
  isTemplate    Boolean   @default(false)
  templateName  String?   @db.NVarChar(400)
  imageData     String?   @db.NVarChar(Max)
  totalCalories Float     @default(0)
  totalProtein  Float     @default(0)
  totalCarbs    Float     @default(0)
  totalFat      Float     @default(0)
  version       Int       @default(1)
  confirmedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  meals    Meal[]
  messages Message[]

  @@index([trainerId])
  @@index([memberId])
  @@index([isTemplate])
  @@index([status])
}

model Meal {
  id            String   @id @default(uuid()) @db.NVarChar(100)
  mealPlanId    String   @db.NVarChar(100)
  mealPlan      MealPlan @relation(fields: [mealPlanId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  type          String   @db.NVarChar(400)
  /// Thực đơn tuần: 0 = Thứ 2 … 6 = Chủ nhật (null nếu theo ngày)
  dayIndex      Int?
  time          String?  @db.NVarChar(400)
  note          String?  @db.NVarChar(400)
  imageData     String?  @db.NVarChar(Max)
  totalCalories Float    @default(0)
  totalProtein  Float    @default(0)
  totalCarbs    Float    @default(0)
  totalFat      Float    @default(0)
  orderIndex    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  items MealItem[]

  @@index([mealPlanId])
}

/// Món trong bữa. Lưu snapshot tên/hình/dinh dưỡng tại thời điểm gửi để
/// thực đơn đã gửi không đổi khi thư viện thực phẩm bị chỉnh sửa/xoá.
model MealItem {
  id         String   @id @default(uuid()) @db.NVarChar(100)
  mealId     String   @db.NVarChar(100)
  meal       Meal     @relation(fields: [mealId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  foodId     String?  @db.NVarChar(100)
  food       Food?    @relation(fields: [foodId], references: [id], onDelete: SetNull, onUpdate: NoAction)
  name       String   @db.NVarChar(400)
  imageUrl   String?  @db.NVarChar(400)
  quantity   Float    @default(100)
  unit       String   @default("g") @db.NVarChar(400)
  calories   Float    @default(0)
  protein    Float    @default(0)
  carbs      Float    @default(0)
  fat        Float    @default(0)
  orderIndex Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([mealId])
  @@index([foodId])
}

// ==================== EQUIPMENT ====================
model Equipment {
  id        String   @id @default(uuid()) @db.NVarChar(100)
  name      String   @db.NVarChar(400)
  code      String   @unique @db.NVarChar(400) // mã duy nhất toàn hệ thống, VD: R-01, TREADMILL-01
  type      String   @default("CARDIO") @db.NVarChar(400) // CARDIO, WEIGHT, FREESTYLE, GROUP_CLASS
  status    String   @default("AVAILABLE") @db.NVarChar(400) // AVAILABLE, INACTIVE, MAINTENANCE, BROKEN
  capacity  Int? // chỉ dùng cho GROUP_CLASS
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  maintenance EquipmentMaintenance[] @relation("EquipmentMaintenance")
  checkIns    CheckIn[]              @relation("EquipmentCheckIns")
}

// ==================== EQUIPMENT MAINTENANCE ====================
model EquipmentMaintenance {
  id          String    @id @default(uuid()) @db.NVarChar(100)
  equipmentId String    @db.NVarChar(100)
  equipment   Equipment @relation("EquipmentMaintenance", fields: [equipmentId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  status      String    @default("PENDING") @db.NVarChar(400) // PENDING, IN_PROGRESS, COMPLETE, CANCELLED
  startDate   DateTime
  endDate     DateTime?
  description String?   @db.NVarChar(Max)
  notes       String?   @db.NVarChar(Max)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([equipmentId])
  @@index([status])
}

````


## 2. Const enum & vai trò — các giá trị trạng thái thực tế

> Nguồn: `backend/src/common/constants/db-enums.ts`
> Prisma schema KHÔNG dùng `enum`; các giá trị được định nghĩa bằng object const tại đây. Đọc cả role.enum.ts nếu cần.


````ts

export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  TRAINER: "TRAINER",
  MEMBER: "MEMBER",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const MemberStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const TrainerStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ON_LEAVE: "ON_LEAVE",
} as const;
export type TrainerStatus = (typeof TrainerStatus)[keyof typeof TrainerStatus];

export const PackageType = {
  FIXED_TERM: "FIXED_TERM",
  SESSION_BASED: "SESSION_BASED",
} as const;
export type PackageType = (typeof PackageType)[keyof typeof PackageType];

export const MembershipStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  SUSPENDED: "SUSPENDED",
} as const;
export type MembershipStatus =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const MembershipChangeType = {
  CANCEL_REFUND: "CANCEL_REFUND",
  FREEZE: "FREEZE",
} as const;
export type MembershipChangeType =
  (typeof MembershipChangeType)[keyof typeof MembershipChangeType];

export const MembershipChangeStatus = {
  REQUESTED: "REQUESTED",
  PENDING_MANAGER_PROPOSAL: "PENDING_MANAGER_PROPOSAL",
  AWAITING_MEMBER_CONFIRMATION: "AWAITING_MEMBER_CONFIRMATION",
  PENDING_MANAGER_APPROVAL: "PENDING_MANAGER_APPROVAL",
  PENDING_PAYOUT: "PENDING_PAYOUT",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;
export type MembershipChangeStatus =
  (typeof MembershipChangeStatus)[keyof typeof MembershipChangeStatus];

export const PaymentMethod = {
  CASH: "CASH",
  CREDIT_CARD: "CREDIT_CARD",
  BANK_TRANSFER: "BANK_TRANSFER",
  MOMO: "MOMO",
  VNPAY: "VNPAY",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const InvoiceStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const CheckInStatus = {
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
} as const;
export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];

export const CheckInMethod = {
  MANUAL: "MANUAL",
  STAFF: "STAFF",
  FACE_ID: "FACE_ID",
} as const;
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];

export const ScheduleStatus = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;
export type ScheduleStatus =
  (typeof ScheduleStatus)[keyof typeof ScheduleStatus];

export const SessionType = {
  PERSONAL_TRAINING: "PERSONAL_TRAINING",
  GROUP_CLASS: "GROUP_CLASS",
  FREE_TRAINING: "FREE_TRAINING",
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const TrainerMemberStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type TrainerMemberStatus =
  (typeof TrainerMemberStatus)[keyof typeof TrainerMemberStatus];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const RoomType = {
  GYM_AREA: "GYM_AREA",
  CARDIO: "CARDIO",
  WEIGHT_AREA: "WEIGHT_AREA",
  GROUP_CLASS: "GROUP_CLASS",
  PERSONAL_TRAINING: "PERSONAL_TRAINING",
  YOGA: "YOGA",
  OTHER: "OTHER",
} as const;
export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const ConversationStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type ConversationStatus =
  (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  MEAL_PLAN: "MEAL_PLAN",
  SYSTEM: "SYSTEM",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const FoodCategory = {
  PROTEIN: "PROTEIN",
  CARBOHYDRATE: "CARBOHYDRATE",
  VEGETABLE: "VEGETABLE",
  FRUIT: "FRUIT",
  DAIRY: "DAIRY",
  FAT: "FAT",
  DRINK: "DRINK",
  SNACK: "SNACK",
  OTHER: "OTHER",
} as const;
export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];

export const MealPlanScope = {
  DAY: "DAY",
  WEEK: "WEEK",
} as const;
export type MealPlanScope = (typeof MealPlanScope)[keyof typeof MealPlanScope];

export const MealPlanStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  CONFIRMED: "CONFIRMED",
} as const;
export type MealPlanStatus =
  (typeof MealPlanStatus)[keyof typeof MealPlanStatus];

export const MealType = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "SNACK",
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];

````


## 2b. Role enum

> Nguồn: `backend/src/common/enums/role.enum.ts`
> Bổ sung cho mục 2.


````ts

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  TRAINER = 'TRAINER',
  MEMBER = 'MEMBER',
}

````


## 3. Seed dữ liệu mẫu — số liệu demo và ví dụ giá trị

> Nguồn: `backend/prisma/seed.ts`
> Đây là DỮ LIỆU MẪU (demo), không phải dữ liệu thật. Chỉ dùng để biết số lượng bản ghi, trạng thái mẫu, mã hoá đơn... Không trích xuất thông tin cá nhân thật.


````ts

import { PrismaClient } from '@prisma/client';
import { UserRole, Gender, MemberStatus, PackageType, PaymentMethod, PaymentStatus, SessionType, InvoiceStatus } from '../src/common/constants/db-enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 2. Rooms — phòng tập độc lập, `code` unique toàn hệ thống
  const cardioRoom = await prisma.room.upsert({
    where: { id: 'room-cardio-01' },
    update: {},
    create: {
      id: 'room-cardio-01',
      code: 'R-CARDIO-01',
      name: 'Phòng Cardio & Máy Chạy',
      type: 'CARDIO',
      capacity: 30,
      floor: '1',
      description: 'Khu máy chạy bộ, xe đạp và máy tập cardio đa năng.',
      status: 'AVAILABLE',
    },
  });

  const weightRoom = await prisma.room.upsert({
    where: { id: 'room-weight-01' },
    update: {},
    create: {
      id: 'room-weight-01',
      code: 'R-WEIGHT-01',
      name: 'Phòng Tạ Tự Do (Free Weight)',
      type: 'WEIGHT_AREA',
      capacity: 40,
      floor: '2',
      description: 'Khu tạ đơn, tạ đòn và khu vực bench press chuyên dụng.',
      status: 'AVAILABLE',
    },
  });

  const tdClassRoom = await prisma.room.upsert({
    where: { id: 'room-td-class-01' },
    update: {},
    create: {
      id: 'room-td-class-01',
      code: 'R-TD-CLASS-01',
      name: 'Studio Group Class',
      type: 'GROUP_CLASS',
      capacity: 25,
      floor: '1',
      description: 'Phòng tập lớp nhóm: HIIT, Zumba, Body Combat.',
      status: 'AVAILABLE',
    },
  });

  const tdYogaRoom = await prisma.room.upsert({
    where: { id: 'room-td-yoga-01' },
    update: {},
    create: {
      id: 'room-td-yoga-01',
      code: 'R-TD-YOGA-01',
      name: 'Phòng Yoga & Pilates',
      type: 'YOGA',
      capacity: 18,
      floor: '2',
      description: 'Không gian yên tĩnh, thảm tập và dụng cụ hỗ trợ yoga.',
      status: 'AVAILABLE',
    },
  });

  const q1PtRoom = await prisma.room.upsert({
    where: { id: 'room-q1-pt-01' },
    update: {},
    create: {
      id: 'room-q1-pt-01',
      code: 'R-Q1-PT-01',
      name: 'PT Studio',
      type: 'PERSONAL_TRAINING',
      capacity: 6,
      floor: '1',
      description: 'Studio huấn luyện cá nhân 1-1 với HLV.',
      status: 'AVAILABLE',
    },
  });

  // 3. Users (RBAC: ADMIN, MANAGER, STAFF, TRAINER)
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', salt);
  const managerPassword = await bcrypt.hash('Manager@123456', salt);
  const staffPassword = await bcrypt.hash('Staff@123456', salt);
  const trainerPassword = await bcrypt.hash('Trainer@123456', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: {
      email: 'admin@gym.com',
      passwordHash: adminPassword,
      fullName: 'Tổng Quản Trị Hệ Thống',
      phone: '0901234567',
      role: UserRole.ADMIN,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@gym.com' },
    update: { role: UserRole.MANAGER, fullName: 'Quản Lý Vận Hành' },
    create: {
      email: 'manager@gym.com',
      passwordHash: managerPassword,
      fullName: 'Quản Lý Vận Hành',
      phone: '0902345678',
      role: UserRole.MANAGER,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@gym.com' },
    update: { role: UserRole.STAFF, fullName: 'Nhân Viên Lễ Tân' },
    create: {
      email: 'staff@gym.com',
      passwordHash: staffPassword,
      fullName: 'Nhân Viên Lễ Tân',
      phone: '0903456789',
      role: UserRole.STAFF,
    },
  });

  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@gym.com' },
    update: {},
    create: {
      email: 'trainer@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Nguyễn Văn Thể',
      phone: '0904567890',
      role: UserRole.TRAINER,
    },
  });

  // Thêm 2 HLV nữa để trang public trainers phong phú
  const trainerUser2 = await prisma.user.upsert({
    where: { email: 'trainer2@gym.com' },
    update: {},
    create: {
      email: 'trainer2@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Trần Thị Mai',
      phone: '0905567890',
      role: UserRole.TRAINER,
    },
  });

  const trainerUser3 = await prisma.user.upsert({
    where: { email: 'trainer3@gym.com' },
    update: {},
    create: {
      email: 'trainer3@gym.com',
      passwordHash: trainerPassword,
      fullName: 'HLV Lê Minh Hoàng',
      phone: '0906567890',
      role: UserRole.TRAINER,
    },
  });

  // 4. Trainer Profile
  await prisma.trainer.upsert({
    where: { userId: trainerUser.id },
    update: { certification: 'ISSA Certified Personal Trainer, WFF-Asia' },
    create: {
      userId: trainerUser.id,
      specialization: 'Tăng cơ giảm mỡ, Thể hình chuyên nghiệp (Bodybuilding)',
      certification: 'ISSA Certified Personal Trainer, WFF-Asia',
      experienceYears: 5,
      bio: 'Chứng chỉ HLV Thể hình Quốc tế, cựu vận động viên thể hình Đông Nam Á. Chuyên gia thiết kế giáo án tăng cơ, giảm mỡ cho hơn 500 học viên.',
      rating: 4.9,
      hourlyRate: 350000,
    },
  });

  await prisma.trainer.upsert({
    where: { userId: trainerUser2.id },
    update: {},
    create: {
      userId: trainerUser2.id,
      specialization: 'Yoga, Pilates & Giãn cơ phục hồi',
      certification: 'RYT-500 Yoga Alliance, ACE Group Fitness',
      experienceYears: 4,
      bio: 'HLV Yoga & Pilates chứng nhận quốc tế. Chuyên cải thiện sự linh hoạt, tư thế và phục hồi sau chấn thương cho học viên mọi lứa tuổi.',
      rating: 4.8,
      hourlyRate: 300000,
    },
  });

  await prisma.trainer.upsert({
    where: { userId: trainerUser3.id },
    update: {},
    create: {
      userId: trainerUser3.id,
      specialization: 'HIIT, CrossFit & Rèn luyện sức bền',
      certification: 'CrossFit L2 Trainer, NSCA-CPT',
      experienceYears: 6,
      bio: 'Cựu vận động viên điền kinh quốc gia. Chuyên các lớp HIIT, CrossFit, rèn thể lực tổng hợp và tinh thần thép.',
      rating: 4.7,
      hourlyRate: 320000,
    },
  });
  console.log('✅ Created users and trainer profiles');

  // 5. Membership Packages
  await prisma.membershipPackage.updateMany({
    where: { type: PackageType.SESSION_BASED, status: 'ACTIVE' },
    data: { status: 'INACTIVE' },
  });

  const pkg1M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-1M' },
    update: {
    features: JSON.stringify({
        title: 'Gói Cơ Bản 1 Tháng (Basic)',
        items: ['Tập luyện không giới hạn thời gian', 'Phòng Gym + Cardio', 'Tủ đồ cá nhân', 'Hướng dẫn sử dụng máy cơ bản'],
    }),
    },
    create: {
      code: 'PKG-1M',
      name: 'Gói Cơ Bản 1 Tháng (Basic)',
      description: 'Tập luyện không giới hạn thời gian tại phòng tập',
      features: JSON.stringify({
        title: 'Gói Cơ Bản 1 Tháng (Basic)',
        items: ['Tập luyện không giới hạn thời gian', 'Phòng Gym + Cardio', 'Tủ đồ cá nhân', 'Hướng dẫn sử dụng máy cơ bản'],
      }),
      durationDays: 30,
      price: 450000,
      type: PackageType.FIXED_TERM,
    },
  });

  const pkg6M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-6M-VIP' },
    update: {
      sessions: 3,
      features: JSON.stringify({
        title: 'Gói VIP 6 Tháng',
        items: ['Toàn quyền sử dụng dịch vụ gym', 'Khu xông hơi & massage', 'Tặng 3 buổi tập cùng HLV', 'Ưu đãi 10% dịch vụ bổ sung'],
      }),
    },
    create: {
      code: 'PKG-6M-VIP',
      name: 'Gói VIP 6 Tháng',
      description: 'Toàn quyền sử dụng dịch vụ gym, xông hơi và tặng 3 buổi cùng HLV',
      features: JSON.stringify({
        title: 'Gói VIP 6 Tháng',
        items: ['Toàn quyền sử dụng dịch vụ gym', 'Khu xông hơi & massage', 'Tặng 3 buổi tập cùng HLV', 'Ưu đãi 10% dịch vụ bổ sung'],
      }),
      durationDays: 180,
      price: 2400000,
      sessions: 3,
      type: PackageType.FIXED_TERM,
    },
  });

  const pkg12M = await prisma.membershipPackage.upsert({
    where: { code: 'PKG-12M-DIAMOND' },
    update: {
      sessions: 6,
      features: JSON.stringify({
        title: 'Gói Kim Cương 12 Tháng',
        items: ['Trọn gói cao cấp', 'Tặng khăn tập & tủ đồ VIP', 'Tặng 6 buổi PT trị giá 2.100.000đ', 'Ưu tiên đặt phòng & lớp học'],
      }),
    },
    create: {
      code: 'PKG-12M-DIAMOND',
      name: 'Gói Kim Cương 12 Tháng',
      description: 'Trọn gói cao cấp, tặng khăn tập và tủ đồ VIP',
      features: JSON.stringify({
        title: 'Gói Kim Cương 12 Tháng',
        items: ['Trọn gói cao cấp', 'Tặng khăn tập & tủ đồ VIP', 'Tặng 6 buổi PT trị giá 2.100.000đ', 'Ưu tiên đặt phòng & lớp học'],
      }),
      durationDays: 365,
      price: 4200000,
      sessions: 6,
      type: PackageType.FIXED_TERM,
    },
  });
  console.log('✅ Created membership packages');

  // 6. Sample Member (+ tài khoản đăng nhập MEMBER để test member portal)
  // CỜ DỮ LIỆU MẪU: đặt lại `true` nếu muốn seed khôi phục hội viên mẫu
  // member*@gym.com (MEM-0001 + MEM-0004…0011). Mặc định `false` — các block
  // dữ liệu mẫu phụ thuộc (7/8/11–14, 16.x) sẽ tự bỏ qua khi cờ tắt.
  const DEMO_MEMBERS = false;
  const memberPassword = await bcrypt.hash('Member@123456', salt);
  const memberUser = DEMO_MEMBERS
    ? await prisma.user.upsert({
        where: { email: 'member@gym.com' },
        update: {},
        create: {
          email: 'member@gym.com',
          passwordHash: memberPassword,
          fullName: 'Trần Minh Quân',
          phone: '0987654321',
          role: UserRole.MEMBER,
        },
      })
    : await prisma.user.findUnique({ where: { email: 'member@gym.com' } });

  const member = DEMO_MEMBERS
    ? await prisma.member.upsert({
        where: { code: 'MEM-0001' },
        update: {},
        create: {
          code: 'MEM-0001',
          userId: memberUser!.id,
          fullName: 'Trần Minh Quân',
          email: 'member@gym.com',
          phone: '0987654321',
          gender: Gender.MALE,
          dateOfBirth: new Date('1998-05-15'),
          address: 'Phường Tân Tiến, TP. Biên Hòa, Đồng Nai',
          emergencyContact: 'Nguyễn Văn Ba - 0911222333',
          status: MemberStatus.ACTIVE,
        },
      })
    : await prisma.member.findUnique({ where: { code: 'MEM-0001' } });

  // 7. Active Membership (chỉ tạo nếu chưa có để tránh trùng lặp khi seed lại)
  const existingMembershipCount = member
    ? await prisma.membership.count({ where: { memberId: member.id } })
    : 1;

  let membership: any = null;
  if (existingMembershipCount === 0) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 180);

    membership = await prisma.membership.create({
      data: {
        memberId: member.id,
        packageId: pkg6M.id,
        startDate: startDate,
        endDate: endDate,
        price: pkg6M.price,
        finalAmount: pkg6M.price,
        status: 'ACTIVE',
      },
    });
  } else if (member) {
    membership = await prisma.membership.findFirst({
      where: { memberId: member.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // 8. Payment (chỉ tạo nếu chưa có) + Invoice đi kèm (1-1)
  const existingPayment = await prisma.payment.findUnique({
    where: { code: 'INV-2026-0001' },
  });
  if (member && !existingPayment) {
    await prisma.payment.create({
      data: {
        code: 'INV-2026-0001',
        memberId: member.id,
        membershipId: membership.id,
        amount: pkg6M.price,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        transactionRef: 'VCB-987123984',
        paidAt: new Date(),
        notes: 'Thanh toán chuyển khoản qua ngân hàng Vietcombank',
      },
    });
  }

  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: 'INV-2026-0001' },
  });
  if (member && !existingInvoice) {
    const seedPayment = await prisma.payment.findUnique({
      where: { code: 'INV-2026-0001' },
    });
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0001',
        memberId: member.id,
        membershipId: membership.id,
        paymentId: seedPayment?.id,
        subtotal: pkg6M.price,
        discount: 0,
        total: pkg6M.price,
        status: InvoiceStatus.PAID,
        issuedAt: new Date(),
      },
    });
  }

  // 11. Lịch tập mẫu (cho member + lớp học công khai)
  const scheduleCount = await prisma.trainingSchedule.count();
  if (scheduleCount === 0) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const trainer1 = await prisma.trainer.findUnique({
      where: { userId: trainerUser.id },
    });

    // Buổi PT riêng cho member (bỏ qua khi không có hồ sơ MEM-0001)
    if (member) {
      await prisma.trainingSchedule.create({
        data: {
          title: 'PT - Tăng cơ toàn thân',
          trainerId: trainer1.id,
          memberId: member.id,
          roomId: weightRoom.id,
          startTime: new Date(now.getTime() + 1 * dayMs),
          endTime: new Date(now.getTime() + 1 * dayMs + 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });

      await prisma.trainingSchedule.create({
        data: {
          title: 'PT - Cardio & Đốt mỡ',
          trainerId: trainer1.id,
          memberId: member.id,
          roomId: cardioRoom.id,
          startTime: new Date(now.getTime() + 3 * dayMs),
          endTime: new Date(now.getTime() + 3 * dayMs + 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
    }

    // Lớp học công khai (không gắn member)
    const trainer2 = await prisma.trainer.findUnique({
      where: { userId: trainerUser2.id },
    });
    const trainer3 = await prisma.trainer.findUnique({
      where: { userId: trainerUser3.id },
    });

    await prisma.trainingSchedule.createMany({
      data: [
        {
          title: 'Yoga Thư Giãn & Giãn Cơ',
          trainerId: trainer2.id,
          memberId: null,
          roomId: cardioRoom.id,
          startTime: new Date(now.getTime() + 1 * dayMs + 2 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 1 * dayMs + 3 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'HIIT Burn - Đốt mỡ toàn thân',
          trainerId: trainer3.id,
          memberId: null,
          roomId: weightRoom.id,
          startTime: new Date(now.getTime() + 2 * dayMs + 7 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 2 * dayMs + 8 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'CrossFit Functional Training',
          trainerId: trainer3.id,
          memberId: null,
          roomId: weightRoom.id,
          startTime: new Date(now.getTime() + 4 * dayMs + 7 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 4 * dayMs + 8 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
        {
          title: 'Pilates Core & Posture',
          trainerId: trainer2.id,
          memberId: null,
          roomId: cardioRoom.id,
          startTime: new Date(now.getTime() + 5 * dayMs + 2 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 5 * dayMs + 3 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      ],
    });

    console.log('✅ Created schedules (member PT + public classes)');
  }

  // 12. Check-in lịch sử cho member (chỉ tạo lần đầu)
  const memberCheckInCount = member
    ? await prisma.checkIn.count({ where: { memberId: member.id } })
    : 1;
  if (memberCheckInCount === 0) {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const atTime = (d: Date, hour: number, minute = 0) => {
      const copy = new Date(d);
      copy.setHours(hour, minute, 0, 0);
      return copy;
    };
    const today = new Date();
    await prisma.checkIn.createMany({
      data: [
        {
          memberId: member.id,
          checkInTime: atTime(today, 8, 15),
          checkOutTime: atTime(today, 9, 55),
          status: 'CHECKED_OUT',
          method: 'MANUAL',
          notes: 'Tập gym buổi sáng',
        },
        {
          memberId: member.id,
          checkInTime: daysAgo(1),
          checkOutTime: new Date(daysAgo(1).getTime() + 90 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'MANUAL',
          notes: 'Tập gym cá nhân',
        },
        {
          memberId: member.id,
          checkInTime: daysAgo(3),
          checkOutTime: new Date(daysAgo(3).getTime() + 75 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'STAFF',
          notes: 'Lớp Yoga',
        },
        {
          memberId: member.id,
          checkInTime: daysAgo(5),
          checkOutTime: new Date(daysAgo(5).getTime() + 120 * 60 * 1000),
          status: 'CHECKED_OUT',
          method: 'MANUAL',
          notes: 'Buổi tập với PT',
        },
      ],
    });
    console.log('✅ Created check-in history for member');
  }

  // 13. Thông báo mẫu cho member
  const memberNotifCount = member
    ? await prisma.notification.count({ where: { memberId: member.id } })
    : 1;
  if (memberNotifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          memberId: member.id,
          title: 'Thanh toán thành công 💳',
          content: 'Hóa đơn INV-2026-0001 (gói VIP 6 Tháng) đã được thanh toán thành công qua chuyển khoản ngân hàng.',
          type: 'PAYMENT',
          link: '/member/payments',
          isRead: true,
          readAt: new Date(),
          referenceType: 'PAYMENT_CONFIRMED',
          referenceId: 'seed-inv-0001',
        },
        {
          memberId: member.id,
          title: 'Nhắc lịch tập 📅',
          content: 'Bạn có buổi tập PT "Tăng cơ toàn thân" vào ngày mai. Đừng quên đến đúng giờ nhé!',
          type: 'SCHEDULE',
          link: '/member/schedule',
          isRead: false,
        },
        {
          memberId: member.id,
          title: 'Chào mừng đến với GymMaster Pro 💪',
          content: 'Cảm ơn bạn đã đăng ký làm hội viên. Chúc bạn có những buổi tập hiệu quả!',
          type: 'SYSTEM',
          link: '/member/dashboard',
          isRead: false,
        },
      ],
    });
    console.log('✅ Created notifications for member');
  }

  // 14. Phân công HLV ↔ hội viên + lịch sử buổi PT (chỉ tạo lần đầu)
  const assignmentCount = member
    ? await prisma.trainerMember.count({ where: { memberId: member.id } })
    : 1;
  if (assignmentCount === 0) {
    const trainer1 = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });
    await prisma.trainerMember.create({
      data: {
        trainerId: trainer1.id,
        memberId: member.id,
        status: 'ACTIVE',
        note: 'Phân công mặc định khi seed dữ liệu mẫu',
      },
    });
    console.log('✅ Created trainer-member assignment');
  }

  // Cập nhật loại buổi tập cho lịch mẫu (không xóa dữ liệu)
  await prisma.trainingSchedule.updateMany({
    where: { memberId: { not: null } },
    data: { type: SessionType.PERSONAL_TRAINING },
  });
  await prisma.trainingSchedule.updateMany({
    where: { memberId: null },
    data: { type: SessionType.GROUP_CLASS },
  });

  // Lịch sử buổi tập đã hoàn thành + ghi chú tiến trình (chỉ tạo lần đầu)
  const completedCount = member
    ? await prisma.trainingSchedule.count({ where: { memberId: member.id, status: 'COMPLETED' } })
    : 1;
  if (completedCount === 0) {
    const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const atTime = (d: Date, hour: number, minute = 0) => {
      const copy = new Date(d);
      copy.setHours(hour, minute, 0, 0);
      return copy;
    };
    const trainer1 = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });

    const past1 = await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Kỹ thuật Squat & Deadlift',
        trainerId: trainer1.id,
        memberId: member.id,
        roomId: weightRoom.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: atTime(daysAgo(4), 17),
        endTime: atTime(daysAgo(4), 18),
        status: 'COMPLETED',
        completedAt: atTime(daysAgo(4), 18),
        description: 'Tập trung kỹ thuật squat sâu và deadlift an toàn.',
      },
    });

    await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Cardio cường độ trung bình',
        trainerId: trainer1.id,
        memberId: member.id,
        roomId: cardioRoom.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: atTime(daysAgo(7), 18),
        endTime: atTime(daysAgo(7), 19),
        status: 'COMPLETED',
        completedAt: atTime(daysAgo(7), 19),
        description: 'Rèn luyện sức bền tim mạch, giữ nhịp 130-140 bpm.',
      },
    });

    await prisma.trainingProgress.create({
      data: {
        sessionId: past1.id,
        memberId: member.id,
        trainerId: trainer1.id,
        note: 'Buổi tập trọng tâm: kỹ thuật squat & deadlift.',
        performance:
          'Member hoàn thành tốt bài tập chân. Squat 4 hiệp × 8 reps với 80% sức tối đa, kỹ thuật giữ lưng thẳng tốt.',
        recommendation:
          'Cần tăng dần mức tạ 5kg trong các buổi tiếp theo và giãn cơ đùi sau 10 phút sau buổi tập.',
      },
    });
    console.log('✅ Created completed PT history + training progress');
  }

  // 15. Backfill STEP 7 (idempotent, KHÔNG xóa dữ liệu cũ)
  // - Gán code cho phòng chưa có code — unique toàn hệ thống
  const roomsWithoutCode = await prisma.room.findMany({
    where: { OR: [{ code: null }, { code: '' }] },
    orderBy: { createdAt: 'asc' },
  });
  let roomCodeIdx = 1;
  for (const r of roomsWithoutCode) {
    const newCode = `R-${String(roomCodeIdx).padStart(3, '0')}`;
    const exists = await prisma.room.findUnique({ where: { code: newCode } });
    if (!exists) {
      await prisma.room.update({
        where: { id: r.id },
        data: { code: newCode },
      });
    }
    roomCodeIdx += 1;
  }
  console.log('✅ Backfill STEP 7 (room codes)');

  // -------------------------------------------------------------
  // 16. STEP 9 — Làm phong phú dữ liệu demo (graduation demo)
  //     Thêm ~10 hội viên + membership đa trạng thái + payment/invoice
  //     + check-in + lịch tập + phân công HLV + mã KM hết hạn.
  //     Idempotent: upsert / đếm trước khi create, KHÔNG xóa dữ liệu cũ.
  // -------------------------------------------------------------
  const dayMs = 24 * 60 * 60 * 1000;
  // Marker cho dữ liệu do block STEP 9 sinh ra. Đặt ở field KHÔNG hiển thị ra
  // giao diện (notes/description) để seed idempotent mà tiêu đề/URL demo vẫn sạch.
  const SEED9_MARKER = 'seed-step9';
  const daysAgo9 = (n: number) => new Date(Date.now() - n * dayMs);
  const daysFromNow9 = (n: number) => new Date(Date.now() + n * dayMs);
  const atHour9 = (d: Date, hour: number, minute = 0) => {
    const c = new Date(d);
    c.setHours(hour, minute, 0, 0);
    return c;
  };

  // -------------------------------------------------------------
  // 16.0b THƯ VIỆN THỰC PHẨM — 26 món ăn Việt Nam phổ biến
  //      (nguyên liệu cho HLV soạn thực đơn). Idempotent: findFirst
  //      rồi update/create; KHÔNG đụng isActive nếu món đã bị ẩn.
  // -------------------------------------------------------------
  const foodSeeds = [
    // --- Đạm ---
    { name: 'Ức gà luộc', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, description: 'Ức gà bỏ da luộc chín — nguồn đạm nạc chủ lực, ít béo.' },
    { name: 'Trứng gà luộc', category: 'PROTEIN', servingSize: 50, servingUnit: 'quả', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, description: 'Trứng gà luộc chín (1 quả ~50 g) — đạm hoàn chỉnh, tiện lợi.' },
    { name: 'Thịt bò áp chảo', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, description: 'Thịt bò thăn áp chảo ít dầu — giàu đạm và sắt.' },
    { name: 'Cá hồi áp chảo', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, description: 'Cá hồi phi lê áp chảo — đạm cao, giàu omega-3.' },
    { name: 'Tôm luộc', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, description: 'Tôm sú luộc chín — đạm cao, rất ít béo.' },
    { name: 'Đậu hũ trắng', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, description: 'Đậu hũ (tàu hũ) hấp — đạm thực vật, phù hợp chay.' },
    { name: 'Thịt lợn nạc áp chảo', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 143, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 6.2, description: 'Thịt lợn thăn áp chảo ít dầu.' },
    { name: 'Đùi gà nướng không da', category: 'PROTEIN', servingSize: 100, servingUnit: 'g', caloriesPer100g: 178, proteinPer100g: 19, carbsPer100g: 0, fatPer100g: 11, description: 'Đùi gà bỏ da ướp nướng — mềm, dễ ăn.' },
    // --- Tinh bột ---
    { name: 'Cơm trắng', category: 'CARBOHYDRATE', servingSize: 180, servingUnit: 'chén', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, description: 'Cơm gạo tám trắng nấu chín (1 chén ~180 g).' },
    { name: 'Khoai lang hấp', category: 'CARBOHYDRATE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, description: 'Khoai lang hấp chín — tinh bột tốt, nhiều chất xơ.' },
    { name: 'Yến mạch nấu', category: 'CARBOHYDRATE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 71, proteinPer100g: 2.5, carbsPer100g: 12, fatPer100g: 1.5, description: 'Yến mạch nguyên hạt nấu chín với nước.' },
    { name: 'Bánh mì nguyên cám', category: 'CARBOHYDRATE', servingSize: 40, servingUnit: 'lát', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, description: 'Bánh mì nguyên cám (1 lát ~40 g).' },
    { name: 'Mì ống nấu chín', category: 'CARBOHYDRATE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9, description: 'Pasta mì ống nấu chín, không sốt.' },
    { name: 'Ngô luộc', category: 'CARBOHYDRATE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 96, proteinPer100g: 3.4, carbsPer100g: 21, fatPer100g: 1.5, description: 'Bắp ngọt luộc chín.' },
    // --- Rau củ ---
    { name: 'Rau cải xanh luộc', category: 'VEGETABLE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 35, proteinPer100g: 2.6, carbsPer100g: 4, fatPer100g: 0.5, description: 'Cải thìa luộc chín, ít dầu.' },
    { name: 'Bông cải xanh hấp', category: 'VEGETABLE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, description: 'Bông cải (súp lơ xanh) hấp chín.' },
    { name: 'Cà rốt hấp', category: 'VEGETABLE', servingSize: 100, servingUnit: 'g', caloriesPer100g: 35, proteinPer100g: 1.3, carbsPer100g: 8, fatPer100g: 0.2, description: 'Cà rốt hấp chín, giàu beta-carotene.' },
    // --- Trái cây ---
    { name: 'Chuối chín', category: 'FRUIT', servingSize: 120, servingUnit: 'quả', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, description: 'Chuối sứ chín (1 quả ~120 g) — bổ sung năng lượng nhanh trước tập.' },
    { name: 'Táo xanh', category: 'FRUIT', servingSize: 180, servingUnit: 'quả', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, description: 'Táo xanh tươi (1 quả ~180 g).' },
    // --- Sữa & sản phẩm từ sữa ---
    { name: 'Sữa tươi không đường', category: 'DAIRY', servingSize: 240, servingUnit: 'ly', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, description: 'Sữa bò tươi không đường (1 ly ~240 ml).' },
    { name: 'Sữa chua Hy Lạp', category: 'DAIRY', servingSize: 170, servingUnit: 'hũ', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, description: 'Sữa chua Hy Lạp ít béo (1 hũ ~170 g) — đạm cao, tốt cho tiêu hoá.' },
    // --- Chất béo ---
    { name: 'Bơ đậu phộng', category: 'FAT', servingSize: 16, servingUnit: 'muỗng canh', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, description: 'Bơ đậu phộng nguyên chất, không đường (1 muỗng canh ~16 g).' },
    { name: 'Dầu ô liu', category: 'FAT', servingSize: 14, servingUnit: 'muỗng canh', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, description: 'Dầu ô liu extra virgin để trộn salad, ướp món (1 muỗng canh ~14 g).' },
    // --- Đồ uống ---
    { name: 'Nước ép cam vắt', category: 'DRINK', servingSize: 240, servingUnit: 'ly', caloriesPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10, fatPer100g: 0.2, description: 'Nước ép cam vắt nguyên chất, không thêm đường (1 ly ~240 ml).' },
    // --- Đồ ăn vặt ---
    { name: 'Hạnh nhân rang', category: 'SNACK', servingSize: 30, servingUnit: 'nắm', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, description: 'Hạnh nhân rang không muối (1 nắm ~30 g) — snack giàu đạm và chất béo tốt.' },
    { name: 'Granola yến mạch', category: 'SNACK', servingSize: 40, servingUnit: 'gói', caloriesPer100g: 471, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 20, description: 'Granola yến mạch ăn liền (1 gói ~40 g).' },
  ] as const;
  let foodCreated = 0;
  let foodUpdated = 0;
  for (const f of foodSeeds) {
    const existingFood = await prisma.food.findFirst({ where: { name: f.name } });
    if (existingFood) {
      await prisma.food.update({ where: { id: existingFood.id }, data: { ...f } });
      foodUpdated += 1;
    } else {
      await prisma.food.create({ data: { ...f, createdById: adminUser.id } });
      foodCreated += 1;
    }
  }
  console.log(`. Foods library: +${foodCreated} moi, ${foodUpdated} cap nhat (${foodSeeds.length} mon)`);

  const pkg9_1m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-1M' } });
  const pkg9_6m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-6M-VIP' } });
  const pkg9_12m = await prisma.membershipPackage.findUnique({ where: { code: 'PKG-12M-DIAMOND' } });

  // 16.1 Hội viên demo
  const demoMembers = [
    { code: 'MEM-0002', name: 'Lê Hoàng Anh', email: 'member2@gym.com', phone: '0912000002', gender: Gender.MALE, dob: '1996-03-12' },
    { code: 'MEM-0003', name: 'Phạm Thị Ngọc', email: 'member3@gym.com', phone: '0912000003', gender: Gender.FEMALE, dob: '1999-07-25' },
    { code: 'MEM-0004', name: 'Võ Đức Thịnh', email: 'member4@gym.com', phone: '0912000004', gender: Gender.MALE, dob: '1994-11-02' },
    { code: 'MEM-0005', name: 'Đặng Quốc Huy', email: 'member5@gym.com', phone: '0912000005', gender: Gender.MALE, dob: '1997-01-19' },
    { code: 'MEM-0006', name: 'Bùi Thanh Tâm', email: 'member6@gym.com', phone: '0912000006', gender: Gender.FEMALE, dob: '2000-09-08' },
    { code: 'MEM-0007', name: 'Hoàng Văn Dũng', email: 'member7@gym.com', phone: '0912000007', gender: Gender.MALE, dob: '1992-05-30' },
    { code: 'MEM-0008', name: 'Trương Thị Hồng', email: 'member8@gym.com', phone: '0912000008', gender: Gender.FEMALE, dob: '1998-12-14' },
    { code: 'MEM-0009', name: 'Nguyễn Phương Linh', email: 'member9@gym.com', phone: '0912000009', gender: Gender.FEMALE, dob: '2001-02-23' },
    { code: 'MEM-0010', name: 'Đỗ Minh Khôi', email: 'member10@gym.com', phone: '0912000010', gender: Gender.MALE, dob: '1995-08-17' },
    { code: 'MEM-0011', name: 'Hà Thị Bích', email: 'member11@gym.com', phone: '0912000011', gender: Gender.FEMALE, dob: '1993-04-05' },
  ];

  const memberRecords9: Record<string, any> = {};
  for (const dm of DEMO_MEMBERS ? demoMembers : []) {
    const u = await prisma.user.upsert({
      where: { email: dm.email },
      update: {},
      create: {
        email: dm.email,
        passwordHash: memberPassword,
        fullName: dm.name,
        phone: dm.phone,
        role: UserRole.MEMBER,
      },
    });
    const mRec = await prisma.member.upsert({
      where: { code: dm.code },
      update: {},
      create: {
        code: dm.code,
        userId: u.id,
        fullName: dm.name,
        email: dm.email,
        phone: dm.phone,
        gender: dm.gender,
        dateOfBirth: new Date(dm.dob),
        status: MemberStatus.ACTIVE,
      },
    });
    memberRecords9[dm.code] = mRec;
  }
  console.log(
    DEMO_MEMBERS
      ? `✅ Created demo members (STEP 9): ${demoMembers.length}`
      : '⏭️  Skipped demo members (DEMO_MEMBERS = false)',
  );

  // 16.2 Membership đa trạng thái + Payment + Invoice
  // Mã hoá đơn sinh tự động ở DẢI 1xxx (INV-2026-1001…1010) — cố tình KHÔNG dùng
  // INV-2026-0001…0006 vì block gốc (mục 8) đã chiếm dải đó cho MEM-0001; nếu dùng
  // trùng, `findUnique` sẽ thấy payment có sẵn và âm thầm bỏ qua (thiếu dữ liệu).
  const membershipSeeds = [
    { code: 'MEM-0002', pkg: pkg9_12m, status: 'ACTIVE', startOffset: -90, payStatus: PaymentStatus.PAID, method: PaymentMethod.BANK_TRANSFER, ref: 'VCB-8812002', paidOffset: -88 },
    { code: 'MEM-0003', pkg: pkg9_6m, status: 'ACTIVE', startOffset: -45, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -45 },
    { code: 'MEM-0004', pkg: pkg9_1m, status: 'ACTIVE', startOffset: -12, payStatus: PaymentStatus.PAID, method: PaymentMethod.MOMO, ref: 'MOMO-55210', paidOffset: -12 },
    { code: 'MEM-0005', pkg: pkg9_1m, status: 'EXPIRED', startOffset: -50, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -50 },
    { code: 'MEM-0006', pkg: pkg9_6m, status: 'PENDING', startOffset: 0, payStatus: PaymentStatus.PENDING, method: PaymentMethod.BANK_TRANSFER, ref: null, paidOffset: 0 },
    { code: 'MEM-0007', pkg: pkg9_12m, status: 'ACTIVE', startOffset: -120, payStatus: PaymentStatus.PAID, method: PaymentMethod.VNPAY, ref: 'VNP-77112', paidOffset: -118 },
    { code: 'MEM-0008', pkg: pkg9_6m, status: 'EXPIRED', startOffset: -200, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -200 },
    { code: 'MEM-0009', pkg: pkg9_1m, status: 'CANCELLED', startOffset: -60, payStatus: PaymentStatus.REFUNDED, method: PaymentMethod.CASH, ref: null, paidOffset: -58 },
    { code: 'MEM-0010', pkg: pkg9_6m, status: 'ACTIVE', startOffset: -30, payStatus: PaymentStatus.PAID, method: PaymentMethod.BANK_TRANSFER, ref: 'VCB-99331', paidOffset: -30 },
    { code: 'MEM-0011', pkg: pkg9_1m, status: 'ACTIVE', startOffset: -5, payStatus: PaymentStatus.PAID, method: PaymentMethod.CASH, ref: null, paidOffset: -5 },
  ];

  for (const [i, s] of (DEMO_MEMBERS ? membershipSeeds : []).entries()) {
    if (!s.pkg) continue;
    const memberRec = memberRecords9[s.code];
    const start = daysFromNow9(s.startOffset);
    const end = daysFromNow9(s.startOffset + s.pkg.durationDays);

    // Membership chỉ tạo nếu member chưa có
    const msCount = await prisma.membership.count({ where: { memberId: memberRec.id } });
    let msId: string | null = null;
    if (msCount === 0) {
      const ms = await prisma.membership.create({
        data: {
          memberId: memberRec.id,
          packageId: s.pkg.id,
          startDate: start,
          endDate: end,
          price: s.pkg.price,
          finalAmount: s.pkg.price,
          status: s.status as any,
        },
      });
      msId = ms.id;
    } else {
      const ms = await prisma.membership.findFirst({
        where: { memberId: memberRec.id },
        orderBy: { createdAt: 'asc' },
      });
      msId = ms?.id ?? null;
    }

    // Payment — số tiền lấy từ THẺ THỰC TẾ đang gắn (không phải `s.pkg.price`),
    // vì khi tái chạy seed thẻ cũ có thể thuộc gói khác → nếu hardcode sẽ lệch với hoá đơn.
    // Quy tắc: 1 thẻ = 1 đơn thanh toán (nếu thẻ đã có payment thì không tạo thêm).
    const payCode = `INV-2026-1${String(i + 1).padStart(3, '0')}`;
    const linked = msId
      ? await prisma.membership.findUnique({
          where: { id: msId },
          select: { finalAmount: true, price: true },
        })
      : null;
    const amount = linked?.finalAmount ?? linked?.price ?? s.pkg?.price ?? 0;

    let payment = await prisma.payment.findFirst({
      where: msId ? { membershipId: msId } : { code: payCode },
      orderBy: { createdAt: 'asc' },
    });
    if (!payment && msId) {
      const paidAt = s.payStatus === PaymentStatus.PAID ? daysFromNow9(s.paidOffset) : null;
      payment = await prisma.payment.create({
        data: {
          code: payCode,
          memberId: memberRec.id,
          membershipId: msId,
          amount,
          method: s.method,
          status: s.payStatus,
          transactionRef: s.ref ?? null,
          notes: 'Thanh toán gói tập (dữ liệu mẫu)',
          paidAt,
          confirmedById: s.payStatus === PaymentStatus.PAID ? adminUser.id : null,
          confirmedAt: paidAt,
        },
      });
    }

    // Invoice tương ứng (quan hệ 1-1 với Payment)
    const existingInv = await prisma.invoice.findFirst({
      where: payment ? { paymentId: payment.id } : { invoiceNumber: payCode },
    });
    if (!existingInv && payment) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: payCode,
          memberId: memberRec.id,
          membershipId: msId,
          paymentId: payment.id,
          subtotal: amount,
          discount: 0,
          total: amount,
          status:
            s.payStatus === PaymentStatus.PAID
              ? InvoiceStatus.PAID
              : s.payStatus === PaymentStatus.PENDING
                ? InvoiceStatus.ISSUED
                : InvoiceStatus.CANCELLED,
          issuedAt: daysFromNow9(s.paidOffset),
          dueDate: daysFromNow9(s.paidOffset + 7),
        },
      });
    }
  }

  // Giao dịch thất bại (demo status FAILED — không kèm membership)
  const failedPay = await prisma.payment.findUnique({ where: { code: 'INV-2026-0099' } });
  if (DEMO_MEMBERS && !failedPay) {
    await prisma.payment.create({
      data: {
        code: 'INV-2026-0099',
        memberId: memberRecords9['MEM-0006'].id,
        amount: pkg9_6m?.price ?? 0,
        method: PaymentMethod.VNPAY,
        status: PaymentStatus.FAILED,
        transactionRef: 'VNP-FAIL-01',
        notes: 'Giao dịch thất bại (người dùng hủy thanh toán cổng VNPAY) - demo STEP 9',
      },
    });
  }
  console.log(
    DEMO_MEMBERS
      ? '✅ Created demo memberships + payments + invoices (STEP 9)'
      : '⏭️  Skipped demo memberships + payments + invoices (DEMO_MEMBERS = false)',
  );

  // 16.3 Check-in lịch sử cho các hội viên ACTIVE
  const checkinMembers = ['MEM-0002', 'MEM-0003', 'MEM-0004', 'MEM-0007', 'MEM-0010', 'MEM-0011'];
  const dayPattern = [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13];
  const hourPattern = [7, 8, 17, 18, 19];
  for (const code of DEMO_MEMBERS ? checkinMembers : []) {
    const memberRec = memberRecords9[code];
    const cnt = await prisma.checkIn.count({ where: { memberId: memberRec.id } });
    if (cnt > 0) continue;
    const rows: any[] = [];
    dayPattern.forEach((day, i) => {
      const hour = hourPattern[i % hourPattern.length];
      rows.push({
        memberId: memberRec.id,
        checkInTime: atHour9(daysAgo9(day), hour, 10),
        checkOutTime: atHour9(daysAgo9(day), hour + 1 + (i % 2), 25),
        status: 'CHECKED_OUT',
        method: i % 2 === 0 ? 'MANUAL' : 'STAFF',
        notes: 'Buổi tập demo STEP 9',
      });
    });
    await prisma.checkIn.createMany({ data: rows });
  }
  console.log(
    DEMO_MEMBERS
      ? '✅ Created check-in history for demo members (STEP 9)'
      : '⏭️  Skipped demo check-in history (DEMO_MEMBERS = false)',
  );

  // 16.4 Phân công HLV + lịch tập (upcoming/completed) + tiến trình
  const trainer1Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser.id } });
  const trainer2Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser2.id } });
  const trainer3Rec = await prisma.trainer.findUnique({ where: { userId: trainerUser3.id } });

  const assignSeeds = [
    { trainer: trainer1Rec, memberCode: 'MEM-0002', note: 'Chương trình tăng cơ - demo STEP 9' },
    { trainer: trainer3Rec, memberCode: 'MEM-0003', note: 'Chương trình giảm mỡ cấp thân' },
    { trainer: trainer2Rec, memberCode: 'MEM-0010', note: 'Yoga & linh hoạt' },
  ];
  for (const a of DEMO_MEMBERS ? assignSeeds : []) {
    if (!a.trainer) continue;
    const memberRec = memberRecords9[a.memberCode];
    const ex = await prisma.trainerMember.findFirst({
      where: { trainerId: a.trainer.id, memberId: memberRec.id },
    });
    if (!ex) {
      await prisma.trainerMember.create({
        data: { trainerId: a.trainer.id, memberId: memberRec.id, status: 'ACTIVE', note: a.note },
      });
    }
  }

  // Idempotent: marker đặt ở `notes` (KHÔNG nhúng vào title) để dữ liệu demo
  // hiển thị sạch cho khách/giảng viên, nhưng vẫn không tạo trùng khi chạy lại seed.
  const sched9Count = await prisma.trainingSchedule.count({
    where: { notes: SEED9_MARKER },
  });
  if (DEMO_MEMBERS && sched9Count === 0 && trainer1Rec && trainer2Rec && trainer3Rec) {
    const m2 = memberRecords9['MEM-0002'];
    const m3 = memberRecords9['MEM-0003'];
    const weight = await prisma.room.findUnique({ where: { id: 'room-weight-01' } });
    const cardio = await prisma.room.findUnique({ where: { id: 'room-cardio-01' } });
    const tdClass = await prisma.room.findUnique({ where: { id: 'room-td-class-01' } });

    await prisma.trainingSchedule.createMany({
      data: [
        {
          title: 'PT - Tăng cơ toàn thân',
          trainerId: trainer1Rec.id,
          memberId: m2.id,
          roomId: weight?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(1),
          endTime: new Date(daysFromNow9(1).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'PT - Kỹ thuật Deadlift',
          trainerId: trainer1Rec.id,
          memberId: m2.id,
          roomId: weight?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(4),
          endTime: new Date(daysFromNow9(4).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'PT - Giảm mỡ toàn thân',
          trainerId: trainer3Rec.id,
          memberId: m3.id,
          roomId: cardio?.id,
          type: SessionType.PERSONAL_TRAINING,
          startTime: daysFromNow9(2),
          endTime: new Date(daysFromNow9(2).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
        {
          title: 'Yoga Năng Lượng Buổi Sáng',
          trainerId: trainer2Rec.id,
          roomId: tdClass?.id,
          type: SessionType.GROUP_CLASS,
          startTime: daysFromNow9(3),
          endTime: new Date(daysFromNow9(3).getTime() + 3600000),
          status: 'SCHEDULED',
          notes: SEED9_MARKER,
        },
      ],
    });

    const pastDemo = await prisma.trainingSchedule.create({
      data: {
        title: 'PT - Buổi đánh giá thể lực',
        trainerId: trainer1Rec.id,
        memberId: m2.id,
        roomId: weight?.id,
        type: SessionType.PERSONAL_TRAINING,
        startTime: daysAgo9(5),
        endTime: new Date(daysAgo9(5).getTime() + 3600000),
        status: 'COMPLETED',
        completedAt: new Date(daysAgo9(5).getTime() + 3600000),
        notes: SEED9_MARKER,
      },
    });

    await prisma.trainingProgress.create({
      data: {
        sessionId: pastDemo.id,
        memberId: m2.id,
        trainerId: trainer1Rec.id,
        note: 'Đánh giá thể lực đầu khóa.',
        performance: 'Sức bền tốt, kỹ thuật bench press cần chỉnh tư thế vai.',
        recommendation: 'Tập trung các bài vai sau và tăng dần khối lượng theo giáo án.',
      },
    });
    console.log('✅ Created trainer assignments + schedules (STEP 9)');
  }

  // 16.7 Thông báo mẫu cho hội viên demo (chỉ tạo khi DEMO_MEMBERS = true)
  const notifSeeds = DEMO_MEMBERS
    ? [
    {
      memberId: memberRecords9['MEM-0002'].id,
      title: 'Thanh toán thành công 💳',
      content: 'Hóa đơn INV-2026-0002 (Gói Kim Cương 12 Tháng) đã được thanh toán thành công qua chuyển khoản.',
      type: 'PAYMENT',
      link: '/member/payments',
      isRead: true,
      readAt: new Date(),
      referenceType: 'PAYMENT_CONFIRMED',
      referenceId: 'seed-inv-0002',
    },
    {
      memberId: memberRecords9['MEM-0002'].id,
      title: 'Buổi PT sắp diễn ra 📅',
      content: 'Bạn có buổi "PT - Tăng cơ toàn thân" vào ngày mai. Đừng quên đến đúng giờ nhé!',
      type: 'SCHEDULE',
      link: '/member/schedule',
      isRead: false,
      referenceType: 'SCHEDULE_REMINDER',
      referenceId: 'seed-sched-1',
    },
    {
      memberId: memberRecords9['MEM-0003'].id,
      title: 'Chào mừng hội viên mới 💪',
      content: 'Chào mừng Phạm Thị Ngọc đến với GymMaster Pro! Hãy bắt đầu hành trình fitness nào.',
      type: 'SYSTEM',
      link: '/member/dashboard',
      isRead: false,
      },
      ]
    : [];
  for (const n of notifSeeds) {
    const ex = await prisma.notification.findFirst({
      where: { memberId: n.memberId as string, title: n.title as string },
    });
    if (!ex) {
      const { memberId, title, ...rest } = n;
      await prisma.notification.create({ data: { memberId: memberId as string, title: title as string, ...rest } });
    }
  }
  console.log(
    DEMO_MEMBERS
      ? '✅ Created demo notifications (STEP 9)'
      : '✅ Bỏ qua thông báo hội viên mẫu (DEMO_MEMBERS = false)',
  );

  // 16.8 Nhật ký hệ thống (AuditLog) — để trang /admin/audit-logs có dữ liệu demo ngay sau khi seed.
  // Idempotent: chỉ tạo khi bảng còn trống.
  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    type AuditSeed = {
      userId: string | null;
      action: string;
      entity: string;
      entityId?: string | null;
      metadata?: Record<string, unknown>;
      ip: string;
      at: Date;
    };

    const auditSeeds: AuditSeed[] = [
      // --- Đăng nhập (đầu/cuối ngày) ---
      { userId: adminUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: managerUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(1) },
      { userId: staffUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },
      { userId: trainerUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },

      // --- Tài khoản ---
      { userId: adminUser.id, action: 'USER_CREATE', entity: 'User', metadata: { email: 'staff@gym.com', role: 'STAFF' }, ip: '127.0.0.1', at: daysAgo9(120) },

      // --- HLV & lịch tập ---
      { userId: adminUser.id, action: 'TRAINER_CREATE', entity: 'Trainer', entityId: trainer1Rec?.id, metadata: { fullName: trainerUser.fullName, specialization: trainer1Rec?.specialization }, ip: '127.0.0.1', at: daysAgo9(150) },
      { userId: adminUser.id, action: 'TRAINER_UPDATE', entity: 'Trainer', entityId: trainer2Rec?.id, metadata: { fields: ['experienceYears'] }, ip: '127.0.0.1', at: daysAgo9(20) },
      { userId: adminUser.id, action: 'TRAINER_REMOVE', entity: 'Trainer', entityId: trainer3Rec?.id, metadata: { fullName: trainerUser3.fullName, reason: 'Nghỉ việc (chuyển công ty)' }, ip: '127.0.0.1', at: daysAgo9(15) },

    ];

    // --- Dữ liệu audit gắn với hội viên mẫu (member*@gym.com, MEM-0002/0003 demo) ---
    // Chỉ tạo khi DEMO_MEMBERS = true; cờ tắt thì memberUser/m2… không tồn tại.
    if (DEMO_MEMBERS && memberUser) {
      const m2 = memberRecords9['MEM-0002'];
      const m3 = memberRecords9['MEM-0003'];
      const m6 = memberRecords9['MEM-0006'];
      const pay2 = await prisma.payment.findFirst({ where: { memberId: m2.id, status: 'PAID' }, orderBy: { createdAt: 'asc' } });
      const pay6 = await prisma.payment.findFirst({ where: { memberId: m6.id }, orderBy: { createdAt: 'asc' } });
      const payFail = await prisma.payment.findUnique({ where: { code: 'INV-2026-0099' } });
      const ms2 = await prisma.membership.findFirst({ where: { memberId: m2.id }, orderBy: { createdAt: 'asc' } });
      const sched1 = await prisma.trainingSchedule.findFirst({ where: { memberId: m2.id } });

      auditSeeds.push(
        { userId: memberUser.id, action: 'AUTH_LOGIN', entity: 'Auth', metadata: { method: 'password' }, ip: '127.0.0.1', at: daysAgo9(0) },
        { userId: memberUser.id, action: 'PASSWORD_CHANGE', entity: 'User', metadata: { method: 'self-service' }, ip: '127.0.0.1', at: daysAgo9(70) },
        { userId: staffUser.id, action: 'MEMBER_REGISTER', entity: 'Member', entityId: m2.id, metadata: { code: 'MEM-0002', fullName: 'Lê Hoàng Anh' }, ip: '127.0.0.1', at: daysAgo9(88) },
        { userId: staffUser.id, action: 'MEMBER_REGISTER', entity: 'Member', entityId: m3.id, metadata: { code: 'MEM-0003', fullName: 'Phạm Thị Ngọc' }, ip: '127.0.0.1', at: daysAgo9(45) },
        { userId: m3.userId, action: 'MEMBER_PROFILE_UPDATE', entity: 'Member', entityId: m3.id, metadata: { fields: ['phone', 'address'] }, ip: '127.0.0.1', at: daysAgo9(30) },
        { userId: managerUser.id, action: 'MEMBER_UPDATE', entity: 'Member', entityId: m2.id, metadata: { fields: ['emergencyContact'] }, ip: '127.0.0.1', at: daysAgo9(12) },
        { userId: m2.userId, action: 'MEMBERSHIP_REGISTER', entity: 'Membership', entityId: ms2?.id, metadata: { packageName: pkg9_12m?.name, amount: Number(pkg9_12m?.price ?? 0) }, ip: '127.0.0.1', at: daysAgo9(90) },
        { userId: adminUser.id, action: 'PAYMENT_CONFIRM', entity: 'Payment', entityId: pay2?.id, metadata: { code: 'INV-2026-0002', method: 'BANK_TRANSFER', transactionRef: 'VCB-8812002' }, ip: '127.0.0.1', at: daysAgo9(88) },
        { userId: m2.userId, action: 'MEMBERSHIP_RENEW', entity: 'Membership', entityId: ms2?.id, metadata: { packageName: pkg9_6m?.name, extraDays: 180 }, ip: '127.0.0.1', at: daysAgo9(0) },
        { userId: m6.userId, action: 'MEMBERSHIP_REGISTER', entity: 'Membership', entityId: null, metadata: { packageName: pkg9_6m?.name, amount: Number(pkg9_6m?.price ?? 0) }, ip: '127.0.0.1', at: daysAgo9(0) },
        { userId: adminUser.id, action: 'PAYMENT_REJECT', entity: 'Payment', entityId: payFail?.id, metadata: { code: 'INV-2026-0099', reason: 'Giao dịch thất bại từ cổng VNPAY' }, ip: '127.0.0.1', at: daysAgo9(0) },
        { userId: adminUser.id, action: 'MEMBERSHIP_STATUS_CHANGE', entity: 'Membership', entityId: ms2?.id, metadata: { from: 'PENDING', to: 'ACTIVE' }, ip: '127.0.0.1', at: daysAgo9(88) },
        { userId: managerUser.id, action: 'MEMBERSHIP_EXTEND', entity: 'Membership', entityId: ms2?.id, metadata: { extraDays: 7, reason: 'Bù buổi tập theo yêu cầu hội viên' }, ip: '127.0.0.1', at: daysAgo9(6) },
        { userId: adminUser.id, action: 'PAYMENT_REFUND', entity: 'Payment', entityId: pay6?.id, metadata: { code: 'INV-2026-0006', reason: 'Hội viên hủy trong 7 ngày' }, ip: '127.0.0.1', at: daysAgo9(58) },
        { userId: memberUser.id, action: 'CHECK_IN', entity: 'CheckIn', entityId: null, metadata: { method: 'MANUAL' }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 7, 12) },
        { userId: memberUser.id, action: 'CHECK_OUT', entity: 'CheckIn', entityId: null, metadata: { durationMinutes: 65 }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 8, 17) },
        { userId: staffUser.id, action: 'CHECK_IN', entity: 'CheckIn', entityId: null, metadata: { method: 'MANUAL', memberCode: 'MEM-0002' }, ip: '127.0.0.1', at: atHour9(daysAgo9(0), 18, 5) },
        { userId: managerUser.id, action: 'SCHEDULE_CREATE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { title: sched1?.title, type: sched1?.type }, ip: '127.0.0.1', at: daysAgo9(7) },
        { userId: managerUser.id, action: 'SCHEDULE_UPDATE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { fields: ['startTime', 'roomId'] }, ip: '127.0.0.1', at: daysAgo9(5) },
        { userId: managerUser.id, action: 'SCHEDULE_CANCEL', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { reason: 'HLV bận việc đột xuất' }, ip: '127.0.0.1', at: daysAgo9(2) },
        { userId: trainerUser.id, action: 'SCHEDULE_COMPLETE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { attendance: 1 }, ip: '127.0.0.1', at: daysAgo9(1) },
        { userId: managerUser.id, action: 'SCHEDULE_DELETE', entity: 'TrainingSchedule', entityId: sched1?.id, metadata: { reason: 'Xoá lịch trùng do nhập liệu sai' }, ip: '127.0.0.1', at: daysAgo9(4) },
      );
    }

    await prisma.auditLog.createMany({
      data: auditSeeds.map((a) => ({
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId ?? null,
        metadata: a.metadata as any,
        ip: a.ip,
        createdAt: a.at,
      })),
    });
    console.log(`✅ Created ${auditSeeds.length} demo audit logs (STEP 9)`);
  } else {
    console.log(`⏭️  Skipped audit logs — bảng đã có ${auditCount} bản ghi (idempotent)`);
  }

  console.log('🚀 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

````


## 4. Migration: giữ nguyên DB legacy gym_db

> Nguồn: `backend/prisma/sqlserver-gymdb-preserve-migration.sql`
> Giải thích vì sao dự án không dùng prisma/migrate và cách backfill dữ liệu cũ an toàn.


````sql

-- Additive migration for the legacy gym_db schema.
-- Test on a restored copy first; this script intentionally retains legacy tables and columns.
-- Run the complete file in SSMS/sqlcmd. If it stops before COMMIT, ROLLBACK in that same session.
SET NOCOUNT ON;
SET XACT_ABORT ON;

  BEGIN TRANSACTION;
  GO

    IF DB_NAME() IN (N'master', N'model', N'msdb', N'tempdb')
    THROW 51000, 'Refusing to migrate a SQL Server system database.', 1;

  IF OBJECT_ID(N'dbo.Membership', N'U') IS NULL
     OR OBJECT_ID(N'dbo.MembershipPackage', N'U') IS NULL
     OR OBJECT_ID(N'dbo.Payment', N'U') IS NULL
     OR OBJECT_ID(N'dbo.Invoice', N'U') IS NULL
     OR OBJECT_ID(N'dbo.Member', N'U') IS NULL
    THROW 51001, 'The expected legacy GymShark tables were not found.', 1;

  IF COL_LENGTH(N'dbo.MembershipPackage', N'code') IS NULL
    ALTER TABLE dbo.MembershipPackage ADD [code] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.MembershipPackage', N'features') IS NULL
    ALTER TABLE dbo.MembershipPackage ADD [features] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.MembershipPackage', N'sessions') IS NULL
    ALTER TABLE dbo.MembershipPackage ADD [sessions] INT NULL;
  IF COL_LENGTH(N'dbo.MembershipPackage', N'type') IS NULL
    ALTER TABLE dbo.MembershipPackage ADD [type] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.MembershipPackage', N'status') IS NULL
    ALTER TABLE dbo.MembershipPackage ADD [status] NVARCHAR(400) NULL;

  IF COL_LENGTH(N'dbo.Membership', N'packageId') IS NULL
    ALTER TABLE dbo.Membership ADD [packageId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Membership', N'discountAmount') IS NULL
    ALTER TABLE dbo.Membership ADD [discountAmount] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Membership', N'finalAmount') IS NULL
    ALTER TABLE dbo.Membership ADD [finalAmount] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Membership', N'remainingSessions') IS NULL
    ALTER TABLE dbo.Membership ADD [remainingSessions] INT NULL;

  IF COL_LENGTH(N'dbo.Payment', N'code') IS NULL
    ALTER TABLE dbo.Payment ADD [code] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.Payment', N'membershipId') IS NULL
    ALTER TABLE dbo.Payment ADD [membershipId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Payment', N'promotionId') IS NULL
    ALTER TABLE dbo.Payment ADD [promotionId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Payment', N'discountAmount') IS NULL
    ALTER TABLE dbo.Payment ADD [discountAmount] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Payment', N'notes') IS NULL
    ALTER TABLE dbo.Payment ADD [notes] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.Payment', N'confirmedAt') IS NULL
    ALTER TABLE dbo.Payment ADD [confirmedAt] DATETIME2 NULL;

  IF COL_LENGTH(N'dbo.Invoice', N'invoiceNumber') IS NULL
    ALTER TABLE dbo.Invoice ADD [invoiceNumber] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'membershipId') IS NULL
    ALTER TABLE dbo.Invoice ADD [membershipId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'paymentId') IS NULL
    ALTER TABLE dbo.Invoice ADD [paymentId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'subtotal') IS NULL
    ALTER TABLE dbo.Invoice ADD [subtotal] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'discount') IS NULL
    ALTER TABLE dbo.Invoice ADD [discount] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'total') IS NULL
    ALTER TABLE dbo.Invoice ADD [total] DECIMAL(12,2) NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'issuedAt') IS NULL
    ALTER TABLE dbo.Invoice ADD [issuedAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Invoice', N'dueDate') IS NULL
    ALTER TABLE dbo.Invoice ADD [dueDate] DATETIME2 NULL;

  IF COL_LENGTH(N'dbo.Member', N'joinedAt') IS NULL
    ALTER TABLE dbo.Member ADD [joinedAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Member', N'avatarUrl') IS NULL
    ALTER TABLE dbo.Member ADD [avatarUrl] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.Member', N'emergencyContact') IS NULL
    ALTER TABLE dbo.Member ADD [emergencyContact] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.CheckIn', N'notes') IS NULL
    ALTER TABLE dbo.CheckIn ADD [notes] NVARCHAR(MAX) NULL;

  IF COL_LENGTH(N'dbo.TrainingSchedule', N'memberId') IS NULL
    ALTER TABLE dbo.TrainingSchedule ADD [memberId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.TrainingSchedule', N'type') IS NULL
    ALTER TABLE dbo.TrainingSchedule ADD [type] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.TrainingSchedule', N'notes') IS NULL
    ALTER TABLE dbo.TrainingSchedule ADD [notes] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.TrainingSchedule', N'cancellationNote') IS NULL
    ALTER TABLE dbo.TrainingSchedule ADD [cancellationNote] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.TrainingSchedule', N'completedAt') IS NULL
    ALTER TABLE dbo.TrainingSchedule ADD [completedAt] DATETIME2 NULL;

  IF COL_LENGTH(N'dbo.TrainerMember', N'startDate') IS NULL
    ALTER TABLE dbo.TrainerMember ADD [startDate] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.TrainerMember', N'endDate') IS NULL
    ALTER TABLE dbo.TrainerMember ADD [endDate] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.TrainerMember', N'note') IS NULL
    ALTER TABLE dbo.TrainerMember ADD [note] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.TrainerMember', N'createdAt') IS NULL
    ALTER TABLE dbo.TrainerMember ADD [createdAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.TrainerMember', N'updatedAt') IS NULL
    ALTER TABLE dbo.TrainerMember ADD [updatedAt] DATETIME2 NULL;

  IF COL_LENGTH(N'dbo.TrainingProgress', N'sessionId') IS NULL
    ALTER TABLE dbo.TrainingProgress ADD [sessionId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.TrainingProgress', N'note') IS NULL
    ALTER TABLE dbo.TrainingProgress ADD [note] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.TrainingProgress', N'performance') IS NULL
    ALTER TABLE dbo.TrainingProgress ADD [performance] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.TrainingProgress', N'recommendation') IS NULL
    ALTER TABLE dbo.TrainingProgress ADD [recommendation] NVARCHAR(MAX) NULL;

  IF COL_LENGTH(N'dbo.Promotion', N'usedCount') IS NULL
    ALTER TABLE dbo.Promotion ADD [usedCount] INT NULL;
  IF COL_LENGTH(N'dbo.Promotion', N'status') IS NULL
    ALTER TABLE dbo.Promotion ADD [status] NVARCHAR(400) NULL;
  IF COL_LENGTH(N'dbo.AuditLog', N'ip') IS NULL
    ALTER TABLE dbo.AuditLog ADD [ip] NVARCHAR(400) NULL;

  IF COL_LENGTH(N'dbo.Notification', N'userId') IS NULL
    ALTER TABLE dbo.Notification ADD [userId] UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH(N'dbo.Notification', N'readAt') IS NULL
    ALTER TABLE dbo.Notification ADD [readAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Notification', N'data') IS NULL
    ALTER TABLE dbo.Notification ADD [data] NVARCHAR(MAX) NULL;

  IF OBJECT_ID(N'dbo.PasswordReset', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.PasswordReset (
      [id] NVARCHAR(100) NOT NULL,
      [email] NVARCHAR(400) NOT NULL,
      [codeHash] NVARCHAR(400) NOT NULL,
      [attempts] INT NOT NULL CONSTRAINT [PasswordReset_attempts_df] DEFAULT 0,
      [expiresAt] DATETIME2 NOT NULL,
      [lastSentAt] DATETIME2 NOT NULL CONSTRAINT [PasswordReset_lastSentAt_df] DEFAULT CURRENT_TIMESTAMP,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordReset_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [PasswordReset_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [PasswordReset_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF COL_LENGTH(N'dbo.Conversation', N'lastMessageAt') IS NULL
    ALTER TABLE dbo.Conversation ADD [lastMessageAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Conversation', N'lastMessagePreview') IS NULL
    ALTER TABLE dbo.Conversation ADD [lastMessagePreview] NVARCHAR(MAX) NULL;
  IF COL_LENGTH(N'dbo.Conversation', N'lastSenderRole') IS NULL
    ALTER TABLE dbo.Conversation ADD [lastSenderRole] NVARCHAR(400) NULL;

  IF COL_LENGTH(N'dbo.Message', N'type') IS NULL
    ALTER TABLE dbo.Message ADD [type] NVARCHAR(400) NOT NULL CONSTRAINT [Message_type_df] DEFAULT N'TEXT';
  IF COL_LENGTH(N'dbo.Message', N'mealPlanId') IS NULL
    ALTER TABLE dbo.Message ADD [mealPlanId] NVARCHAR(100) NULL;
  IF COL_LENGTH(N'dbo.Message', N'readAt') IS NULL
    ALTER TABLE dbo.Message ADD [readAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Message', N'editedAt') IS NULL
    ALTER TABLE dbo.Message ADD [editedAt] DATETIME2 NULL;
  IF COL_LENGTH(N'dbo.Message', N'updatedAt') IS NULL
    ALTER TABLE dbo.Message ADD [updatedAt] DATETIME2 NULL;

  IF OBJECT_ID(N'dbo.MessageAttachment', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.MessageAttachment (
      [id] NVARCHAR(100) NOT NULL,
      [messageId] UNIQUEIDENTIFIER NOT NULL,
      [kind] NVARCHAR(400) NOT NULL CONSTRAINT [MessageAttachment_kind_df] DEFAULT N'IMAGE',
      [fileName] NVARCHAR(400) NULL,
      [mimeType] NVARCHAR(400) NULL,
      [sizeBytes] INT NULL,
      [dataUrl] NVARCHAR(MAX) NOT NULL,
      [width] INT NULL,
      [height] INT NULL,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [MessageAttachment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [MessageAttachment_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF OBJECT_ID(N'dbo.EmailVerification', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.EmailVerification (
      [id] NVARCHAR(100) NOT NULL,
      [email] NVARCHAR(400) NOT NULL,
      [fullName] NVARCHAR(400) NOT NULL,
      [phone] NVARCHAR(400) NOT NULL,
      [passwordHash] NVARCHAR(400) NOT NULL,
      [codeHash] NVARCHAR(400) NOT NULL,
      [gender] NVARCHAR(400) NOT NULL CONSTRAINT [EmailVerification_gender_df] DEFAULT N'MALE',
      [dateOfBirth] DATETIME2 NULL,
      [address] NVARCHAR(MAX) NULL,
      [emergencyContact] NVARCHAR(MAX) NULL,
      [attempts] INT NOT NULL CONSTRAINT [EmailVerification_attempts_df] DEFAULT 0,
      [expiresAt] DATETIME2 NOT NULL,
      [lastSentAt] DATETIME2 NOT NULL CONSTRAINT [EmailVerification_lastSentAt_df] DEFAULT CURRENT_TIMESTAMP,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [EmailVerification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [EmailVerification_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [EmailVerification_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF OBJECT_ID(N'dbo.Food', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.Food (
      [id] NVARCHAR(100) NOT NULL,
      [name] NVARCHAR(400) NOT NULL,
      [category] NVARCHAR(400) NOT NULL CONSTRAINT [Food_category_df] DEFAULT N'PROTEIN',
      [imageUrl] NVARCHAR(400) NULL,
      [description] NVARCHAR(MAX) NULL,
      [servingSize] FLOAT(53) NOT NULL CONSTRAINT [Food_servingSize_df] DEFAULT 100,
      [servingUnit] NVARCHAR(400) NOT NULL CONSTRAINT [Food_servingUnit_df] DEFAULT N'g',
      [caloriesPer100g] FLOAT(53) NOT NULL CONSTRAINT [Food_caloriesPer100g_df] DEFAULT 0,
      [proteinPer100g] FLOAT(53) NOT NULL CONSTRAINT [Food_proteinPer100g_df] DEFAULT 0,
      [carbsPer100g] FLOAT(53) NOT NULL CONSTRAINT [Food_carbsPer100g_df] DEFAULT 0,
      [fatPer100g] FLOAT(53) NOT NULL CONSTRAINT [Food_fatPer100g_df] DEFAULT 0,
      [isActive] BIT NOT NULL CONSTRAINT [Food_isActive_df] DEFAULT 1,
      [createdById] NVARCHAR(100) NULL,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [Food_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [Food_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [Food_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF OBJECT_ID(N'dbo.MealPlan', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.MealPlan (
      [id] NVARCHAR(100) NOT NULL,
      [trainerId] UNIQUEIDENTIFIER NOT NULL,
      [memberId] UNIQUEIDENTIFIER NULL,
      [title] NVARCHAR(400) NOT NULL,
      [description] NVARCHAR(MAX) NULL,
      [scope] NVARCHAR(400) NOT NULL CONSTRAINT [MealPlan_scope_df] DEFAULT N'DAY',
      [startDate] DATETIME2 NULL,
      [status] NVARCHAR(400) NOT NULL CONSTRAINT [MealPlan_status_df] DEFAULT N'SENT',
      [isTemplate] BIT NOT NULL CONSTRAINT [MealPlan_isTemplate_df] DEFAULT 0,
      [templateName] NVARCHAR(400) NULL,
      [imageData] NVARCHAR(MAX) NULL,
      [totalCalories] FLOAT(53) NOT NULL CONSTRAINT [MealPlan_totalCalories_df] DEFAULT 0,
      [totalProtein] FLOAT(53) NOT NULL CONSTRAINT [MealPlan_totalProtein_df] DEFAULT 0,
      [totalCarbs] FLOAT(53) NOT NULL CONSTRAINT [MealPlan_totalCarbs_df] DEFAULT 0,
      [totalFat] FLOAT(53) NOT NULL CONSTRAINT [MealPlan_totalFat_df] DEFAULT 0,
      [version] INT NOT NULL CONSTRAINT [MealPlan_version_df] DEFAULT 1,
      [confirmedAt] DATETIME2 NULL,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [MealPlan_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [MealPlan_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [MealPlan_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF OBJECT_ID(N'dbo.Meal', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.Meal (
      [id] NVARCHAR(100) NOT NULL,
      [mealPlanId] NVARCHAR(100) NOT NULL,
      [type] NVARCHAR(400) NOT NULL,
      [dayIndex] INT NULL,
      [time] NVARCHAR(400) NULL,
      [note] NVARCHAR(400) NULL,
      [imageData] NVARCHAR(MAX) NULL,
      [totalCalories] FLOAT(53) NOT NULL CONSTRAINT [Meal_totalCalories_df] DEFAULT 0,
      [totalProtein] FLOAT(53) NOT NULL CONSTRAINT [Meal_totalProtein_df] DEFAULT 0,
      [totalCarbs] FLOAT(53) NOT NULL CONSTRAINT [Meal_totalCarbs_df] DEFAULT 0,
      [totalFat] FLOAT(53) NOT NULL CONSTRAINT [Meal_totalFat_df] DEFAULT 0,
      [orderIndex] INT NOT NULL CONSTRAINT [Meal_orderIndex_df] DEFAULT 0,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [Meal_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [Meal_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [Meal_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF OBJECT_ID(N'dbo.MealItem', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.MealItem (
      [id] NVARCHAR(100) NOT NULL,
      [mealId] NVARCHAR(100) NOT NULL,
      [foodId] NVARCHAR(100) NULL,
      [name] NVARCHAR(400) NOT NULL,
      [imageUrl] NVARCHAR(400) NULL,
      [quantity] FLOAT(53) NOT NULL CONSTRAINT [MealItem_quantity_df] DEFAULT 100,
      [unit] NVARCHAR(400) NOT NULL CONSTRAINT [MealItem_unit_df] DEFAULT N'g',
      [calories] FLOAT(53) NOT NULL CONSTRAINT [MealItem_calories_df] DEFAULT 0,
      [protein] FLOAT(53) NOT NULL CONSTRAINT [MealItem_protein_df] DEFAULT 0,
      [carbs] FLOAT(53) NOT NULL CONSTRAINT [MealItem_carbs_df] DEFAULT 0,
      [fat] FLOAT(53) NOT NULL CONSTRAINT [MealItem_fat_df] DEFAULT 0,
      [orderIndex] INT NOT NULL CONSTRAINT [MealItem_orderIndex_df] DEFAULT 0,
      [createdAt] DATETIME2 NOT NULL CONSTRAINT [MealItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
      [updatedAt] DATETIME2 NOT NULL CONSTRAINT [MealItem_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT [MealItem_pkey] PRIMARY KEY CLUSTERED ([id])
    );
  END;

GO

  IF OBJECT_ID(N'dbo.TrainingSchedule', N'U') IS NULL
     OR OBJECT_ID(N'dbo.TrainingProgress', N'U') IS NULL
     OR OBJECT_ID(N'dbo.Trainer', N'U') IS NULL
    THROW 51002, 'A required legacy training table was not found.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.Membership AS m
    OUTER APPLY (
      SELECT COUNT_BIG(*) AS [matches]
      FROM dbo.MembershipPackage AS p
      WHERE p.price = m.price
    ) AS mapping
    WHERE mapping.[matches] <> 1
  )
    THROW 51003, 'Membership-to-package price mapping is missing or ambiguous; no data was changed.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.Invoice AS i
    OUTER APPLY (
      SELECT COUNT_BIG(*) AS [matches]
      FROM dbo.Payment AS p
      WHERE p.memberId = i.memberId AND p.amount = i.amount
    ) AS mapping
    WHERE mapping.[matches] <> 1
  )
    THROW 51004, 'Invoice-to-payment mapping is missing or ambiguous; no data was changed.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.TrainingProgress AS p
    LEFT JOIN dbo.Member AS m ON m.id = p.memberId
    LEFT JOIN dbo.Trainer AS t ON t.id = p.trainerId
    WHERE m.id IS NULL OR t.id IS NULL
  )
    THROW 51005, 'A legacy training progress row has no matching member or trainer.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.TrainingProgress AS p
    JOIN dbo.TrainingSchedule AS s ON s.id = p.id
    WHERE p.sessionId IS NULL
  )
    THROW 51006, 'A generated legacy training-session ID would collide with an existing schedule.', 1;

  UPDATE dbo.Member
  SET joinedAt = COALESCE(joinedAt, createdAt, SYSUTCDATETIME())
  WHERE joinedAt IS NULL;

  UPDATE p
  SET
    [code] = COALESCE(NULLIF(p.[code], N''), CONCAT(N'PKG-', CONVERT(NVARCHAR(36), p.id))),
    [sessions] = COALESCE(p.[sessions], p.sessionCount),
    [type] = COALESCE(
      p.[type],
      CASE WHEN p.sessionCount IS NULL THEN N'FIXED_TERM' ELSE N'SESSION_BASED' END
    ),
    [status] = COALESCE(
      p.[status],
      CASE WHEN COALESCE(p.isActive, 1) = 1 THEN N'ACTIVE' ELSE N'INACTIVE' END
    )
  FROM dbo.MembershipPackage AS p;

  UPDATE m
  SET
    packageId = p.id,
    startDate = COALESCE(m.startDate, CAST(m.createdAt AS DATETIME2), SYSUTCDATETIME()),
    endDate = COALESCE(
      CAST(m.endDate AS DATETIME2),
      DATEADD(
        DAY,
        p.durationDays,
        COALESCE(CAST(m.startDate AS DATETIME2), CAST(m.createdAt AS DATETIME2), SYSUTCDATETIME())
      )
    ),
    finalAmount = COALESCE(m.finalAmount, m.price)
  FROM dbo.Membership AS m
  JOIN dbo.MembershipPackage AS p ON p.price = m.price;

  UPDATE p
  SET membershipId = mapping.membershipId
  FROM dbo.Payment AS p
  OUTER APPLY (
    SELECT MIN(m.id) AS membershipId
    FROM dbo.Membership AS m
    WHERE m.memberId = p.memberId
      AND COALESCE(m.finalAmount, m.price) = p.amount
    HAVING COUNT_BIG(*) = 1
  ) AS mapping
  WHERE p.membershipId IS NULL;

  UPDATE p
  SET
    [code] = COALESCE(NULLIF(p.[code], N''), CONCAT(N'PAY-', CONVERT(NVARCHAR(36), p.id))),
    notes = COALESCE(p.notes, p.note),
    confirmedAt = CASE
      WHEN p.status = N'PAID' THEN COALESCE(p.confirmedAt, p.paidAt, p.updatedAt, p.createdAt)
      ELSE p.confirmedAt
    END
  FROM dbo.Payment AS p;

  UPDATE i
  SET
    invoiceNumber = COALESCE(NULLIF(i.invoiceNumber, N''), NULLIF(i.code, N''), CONCAT(N'INV-', CONVERT(NVARCHAR(36), i.id))),
    subtotal = COALESCE(i.subtotal, i.amount),
    discount = COALESCE(i.discount, 0),
    total = COALESCE(i.total, i.amount),
    issuedAt = COALESCE(i.issuedAt, i.createdAt, SYSUTCDATETIME()),
    paymentId = COALESCE(i.paymentId, p.id),
    membershipId = COALESCE(i.membershipId, p.membershipId)
  FROM dbo.Invoice AS i
  JOIN dbo.Payment AS p ON p.memberId = i.memberId AND p.amount = i.amount;

  UPDATE dbo.TrainingSchedule
  SET [type] = COALESCE(
    [type],
    CASE WHEN sessionType IN (N'PERSONAL_TRAINING', N'GROUP_CLASS', N'FREE_TRAINING')
      THEN sessionType ELSE N'PERSONAL_TRAINING' END
  );

  INSERT INTO dbo.TrainingSchedule (
    id, title, trainerId, memberId, [type], startTime, endTime, [status],
    description, completedAt, createdAt, updatedAt
  )
  SELECT
    p.id,
    CONCAT(N'Buổi tập đã ghi nhận - ', CONVERT(NVARCHAR(10), COALESCE(p.[date], CAST(p.createdAt AS DATE)), 23)),
    p.trainerId,
    p.memberId,
    CASE WHEN p.sessionType IN (N'PERSONAL_TRAINING', N'GROUP_CLASS', N'FREE_TRAINING')
      THEN p.sessionType ELSE N'PERSONAL_TRAINING' END,
    CAST(COALESCE(p.[date], CAST(p.createdAt AS DATE), CAST(SYSUTCDATETIME() AS DATE)) AS DATETIME2),
    DATEADD(
      MINUTE,
      CASE WHEN p.durationMinutes > 0 THEN p.durationMinutes ELSE 60 END,
      CAST(COALESCE(p.[date], CAST(p.createdAt AS DATE), CAST(SYSUTCDATETIME() AS DATE)) AS DATETIME2)
    ),
    N'COMPLETED',
    CONCAT(N'Imported from legacy TrainingProgress. Original type: ', COALESCE(p.sessionType, N'unknown')),
    COALESCE(CAST(p.[date] AS DATETIME2), p.createdAt, SYSUTCDATETIME()),
    COALESCE(p.createdAt, SYSUTCDATETIME()),
    COALESCE(p.updatedAt, p.createdAt, SYSUTCDATETIME())
  FROM dbo.TrainingProgress AS p
  WHERE NOT EXISTS (SELECT 1 FROM dbo.TrainingSchedule AS s WHERE s.id = p.id);

  UPDATE p
  SET
    sessionId = COALESCE(p.sessionId, p.id),
    note = COALESCE(
      p.note,
      LEFT(COALESCE(NULLIF(p.notes, N''), N'Ghi chú được chuyển từ dữ liệu tiến trình tập cũ.'), 400)
    ),
    performance = COALESCE(
      p.performance,
      CONCAT(
        N'Legacy durationMinutes=', COALESCE(CONVERT(NVARCHAR(20), p.durationMinutes), N'unknown'),
        N'; caloriesBurned=', COALESCE(CONVERT(NVARCHAR(20), p.caloriesBurned), N'unknown'),
        N'; originalSessionType=', COALESCE(p.sessionType, N'unknown')
      )
    )
  FROM dbo.TrainingProgress AS p;

  UPDATE tm
  SET
    startDate = COALESCE(tm.startDate, tm.assignedAt, tm.createdAt, SYSUTCDATETIME()),
    createdAt = COALESCE(tm.createdAt, tm.assignedAt, SYSUTCDATETIME()),
    updatedAt = COALESCE(tm.updatedAt, tm.assignedAt, tm.createdAt, SYSUTCDATETIME())
  FROM dbo.TrainerMember AS tm;

  UPDATE p
  SET
    usedCount = COALESCE(p.usedCount, p.usageCount, 0),
    [status] = COALESCE(
      p.[status],
      CASE
        WHEN COALESCE(p.isActive, 1) = 0 THEN N'INACTIVE'
        WHEN p.endDate IS NOT NULL AND p.endDate < SYSUTCDATETIME() THEN N'EXPIRED'
        ELSE N'ACTIVE'
      END
    )
  FROM dbo.Promotion AS p;

  UPDATE n
  SET
    userId = COALESCE(n.userId, m.userId),
    readAt = CASE WHEN COALESCE(n.isRead, 0) = 1
      THEN COALESCE(n.readAt, n.createdAt) ELSE n.readAt END
  FROM dbo.Notification AS n
  LEFT JOIN dbo.Member AS m ON m.id = n.memberId;

  UPDATE dbo.Message
  SET
    [type] = COALESCE([type], N'TEXT'),
    readAt = CASE WHEN COALESCE(isRead, 0) = 1 THEN COALESCE(readAt, createdAt) ELSE readAt END,
    updatedAt = COALESCE(updatedAt, createdAt, SYSUTCDATETIME());

  UPDATE dbo.Conversation
  SET status = COALESCE(status, N'ACTIVE');

  DECLARE @InvoiceCodeIndex sysname;
  DECLARE @InvoiceCodeIsConstraint bit;
  DECLARE @InvoiceCodeSql nvarchar(max);
  SELECT TOP (1)
    @InvoiceCodeIndex = i.name,
    @InvoiceCodeIsConstraint = i.is_unique_constraint
  FROM sys.indexes AS i
  JOIN sys.index_columns AS ic
    ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal = 1
  JOIN sys.columns AS c
    ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID(N'dbo.Invoice')
    AND i.is_unique = 1
    AND i.is_primary_key = 0
    AND c.name = N'code';

  IF @InvoiceCodeIndex IS NOT NULL
  BEGIN
    IF @InvoiceCodeIsConstraint = 1
      SET @InvoiceCodeSql = N'ALTER TABLE dbo.Invoice DROP CONSTRAINT ' + QUOTENAME(@InvoiceCodeIndex);
    ELSE
      SET @InvoiceCodeSql = N'DROP INDEX ' + QUOTENAME(@InvoiceCodeIndex) + N' ON dbo.Invoice';
    EXEC sys.sp_executesql @InvoiceCodeSql;
  END;

  IF COL_LENGTH(N'dbo.Membership', N'packageId') IS NOT NULL
    ALTER TABLE dbo.Membership ALTER COLUMN [packageId] UNIQUEIDENTIFIER NOT NULL;
  IF COL_LENGTH(N'dbo.Membership', N'startDate') IS NOT NULL
    ALTER TABLE dbo.Membership ALTER COLUMN [startDate] DATETIME2 NOT NULL;
  IF COL_LENGTH(N'dbo.Membership', N'endDate') IS NOT NULL
    ALTER TABLE dbo.Membership ALTER COLUMN [endDate] DATETIME2 NOT NULL;
  ALTER TABLE dbo.MembershipPackage ALTER COLUMN [code] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.MembershipPackage ALTER COLUMN [type] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.MembershipPackage ALTER COLUMN [status] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.Payment ALTER COLUMN [code] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.Invoice ALTER COLUMN [invoiceNumber] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.Invoice ALTER COLUMN [subtotal] DECIMAL(12,2) NOT NULL;
  ALTER TABLE dbo.Invoice ALTER COLUMN [discount] DECIMAL(12,2) NOT NULL;
  ALTER TABLE dbo.Invoice ALTER COLUMN [total] DECIMAL(12,2) NOT NULL;
  ALTER TABLE dbo.Invoice ALTER COLUMN [issuedAt] DATETIME2 NOT NULL;
  ALTER TABLE dbo.Member ALTER COLUMN [joinedAt] DATETIME2 NOT NULL;
  ALTER TABLE dbo.TrainingSchedule ALTER COLUMN [type] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.TrainerMember ALTER COLUMN [startDate] DATETIME2 NOT NULL;
  ALTER TABLE dbo.TrainerMember ALTER COLUMN [createdAt] DATETIME2 NOT NULL;
  ALTER TABLE dbo.TrainerMember ALTER COLUMN [updatedAt] DATETIME2 NOT NULL;
  ALTER TABLE dbo.TrainingProgress ALTER COLUMN [sessionId] UNIQUEIDENTIFIER NOT NULL;
  ALTER TABLE dbo.TrainingProgress ALTER COLUMN [note] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.Promotion ALTER COLUMN [usedCount] INT NOT NULL;
  ALTER TABLE dbo.Promotion ALTER COLUMN [status] NVARCHAR(400) NOT NULL;
  ALTER TABLE dbo.Message ALTER COLUMN [updatedAt] DATETIME2 NOT NULL;

  IF COL_LENGTH(N'dbo.Invoice', N'code') IS NOT NULL
    ALTER TABLE dbo.Invoice ALTER COLUMN [code] NVARCHAR(50) NULL;
  IF COL_LENGTH(N'dbo.Message', N'receiverId') IS NOT NULL
    ALTER TABLE dbo.Message ALTER COLUMN [receiverId] UNIQUEIDENTIFIER NULL;
  ALTER TABLE dbo.Message ALTER COLUMN [content] NVARCHAR(MAX) NULL;
  ALTER TABLE dbo.Notification ALTER COLUMN [memberId] UNIQUEIDENTIFIER NULL;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MembershipPackage') AND name = N'MembershipPackage_code_key')
    CREATE UNIQUE NONCLUSTERED INDEX [MembershipPackage_code_key] ON dbo.MembershipPackage([code]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Payment') AND name = N'Payment_code_key')
    CREATE UNIQUE NONCLUSTERED INDEX [Payment_code_key] ON dbo.Payment([code]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Invoice') AND name = N'Invoice_invoiceNumber_key')
    CREATE UNIQUE NONCLUSTERED INDEX [Invoice_invoiceNumber_key] ON dbo.Invoice([invoiceNumber]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Invoice') AND name = N'Invoice_legacy_code_not_null')
    CREATE UNIQUE NONCLUSTERED INDEX [Invoice_legacy_code_not_null] ON dbo.Invoice([code]) WHERE [code] IS NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Invoice') AND name = N'Invoice_paymentId_key')
    CREATE UNIQUE NONCLUSTERED INDEX [Invoice_paymentId_key] ON dbo.Invoice([paymentId]) WHERE [paymentId] IS NOT NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Conversation') AND name = N'Conversation_trainerId_memberId_key')
    CREATE UNIQUE NONCLUSTERED INDEX [Conversation_trainerId_memberId_key] ON dbo.Conversation([trainerId], [memberId]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MessageAttachment') AND name = N'MessageAttachment_messageId_idx')
    CREATE NONCLUSTERED INDEX [MessageAttachment_messageId_idx] ON dbo.MessageAttachment([messageId]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.EmailVerification') AND name = N'EmailVerification_email_idx')
    CREATE NONCLUSTERED INDEX [EmailVerification_email_idx] ON dbo.EmailVerification([email]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.EmailVerification') AND name = N'EmailVerification_expiresAt_idx')
    CREATE NONCLUSTERED INDEX [EmailVerification_expiresAt_idx] ON dbo.EmailVerification([expiresAt]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.EmailVerification') AND name = N'EmailVerification_lastSentAt_idx')
    CREATE NONCLUSTERED INDEX [EmailVerification_lastSentAt_idx] ON dbo.EmailVerification([lastSentAt]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PasswordReset') AND name = N'PasswordReset_email_idx')
    CREATE NONCLUSTERED INDEX [PasswordReset_email_idx] ON dbo.PasswordReset([email]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PasswordReset') AND name = N'PasswordReset_expiresAt_idx')
    CREATE NONCLUSTERED INDEX [PasswordReset_expiresAt_idx] ON dbo.PasswordReset([expiresAt]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Food') AND name = N'Food_category_idx')
    CREATE NONCLUSTERED INDEX [Food_category_idx] ON dbo.Food([category]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Food') AND name = N'Food_name_idx')
    CREATE NONCLUSTERED INDEX [Food_name_idx] ON dbo.Food([name]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Food') AND name = N'Food_isActive_idx')
    CREATE NONCLUSTERED INDEX [Food_isActive_idx] ON dbo.Food([isActive]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealPlan') AND name = N'MealPlan_trainerId_idx')
    CREATE NONCLUSTERED INDEX [MealPlan_trainerId_idx] ON dbo.MealPlan([trainerId]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealPlan') AND name = N'MealPlan_memberId_idx')
    CREATE NONCLUSTERED INDEX [MealPlan_memberId_idx] ON dbo.MealPlan([memberId]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealPlan') AND name = N'MealPlan_isTemplate_idx')
    CREATE NONCLUSTERED INDEX [MealPlan_isTemplate_idx] ON dbo.MealPlan([isTemplate]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealPlan') AND name = N'MealPlan_status_idx')
    CREATE NONCLUSTERED INDEX [MealPlan_status_idx] ON dbo.MealPlan([status]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Meal') AND name = N'Meal_mealPlanId_idx')
    CREATE NONCLUSTERED INDEX [Meal_mealPlanId_idx] ON dbo.Meal([mealPlanId]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealItem') AND name = N'MealItem_mealId_idx')
    CREATE NONCLUSTERED INDEX [MealItem_mealId_idx] ON dbo.MealItem([mealId]);
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.MealItem') AND name = N'MealItem_foodId_idx')
    CREATE NONCLUSTERED INDEX [MealItem_foodId_idx] ON dbo.MealItem([foodId]);

  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Membership_packageId_fkey')
    ALTER TABLE dbo.Membership ADD CONSTRAINT [Membership_packageId_fkey]
      FOREIGN KEY ([packageId]) REFERENCES dbo.MembershipPackage([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Payment_membershipId_fkey')
    ALTER TABLE dbo.Payment ADD CONSTRAINT [Payment_membershipId_fkey]
      FOREIGN KEY ([membershipId]) REFERENCES dbo.Membership([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Payment_promotionId_fkey')
    ALTER TABLE dbo.Payment ADD CONSTRAINT [Payment_promotionId_fkey]
      FOREIGN KEY ([promotionId]) REFERENCES dbo.Promotion([id]) ON DELETE SET NULL ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Invoice_paymentId_fkey')
    ALTER TABLE dbo.Invoice ADD CONSTRAINT [Invoice_paymentId_fkey]
      FOREIGN KEY ([paymentId]) REFERENCES dbo.Payment([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Invoice_membershipId_fkey')
    ALTER TABLE dbo.Invoice ADD CONSTRAINT [Invoice_membershipId_fkey]
      FOREIGN KEY ([membershipId]) REFERENCES dbo.Membership([id]) ON DELETE SET NULL ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'TrainingProgress_sessionId_fkey')
    ALTER TABLE dbo.TrainingProgress ADD CONSTRAINT [TrainingProgress_sessionId_fkey]
      FOREIGN KEY ([sessionId]) REFERENCES dbo.TrainingSchedule([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Notification_userId_fkey')
    ALTER TABLE dbo.Notification ADD CONSTRAINT [Notification_userId_fkey]
      FOREIGN KEY ([userId]) REFERENCES dbo.[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'MealPlan_trainerId_fkey')
    ALTER TABLE dbo.MealPlan ADD CONSTRAINT [MealPlan_trainerId_fkey]
      FOREIGN KEY ([trainerId]) REFERENCES dbo.Trainer([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'MealPlan_memberId_fkey')
    ALTER TABLE dbo.MealPlan ADD CONSTRAINT [MealPlan_memberId_fkey]
      FOREIGN KEY ([memberId]) REFERENCES dbo.Member([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Meal_mealPlanId_fkey')
    ALTER TABLE dbo.Meal ADD CONSTRAINT [Meal_mealPlanId_fkey]
      FOREIGN KEY ([mealPlanId]) REFERENCES dbo.MealPlan([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'MealItem_mealId_fkey')
    ALTER TABLE dbo.MealItem ADD CONSTRAINT [MealItem_mealId_fkey]
      FOREIGN KEY ([mealId]) REFERENCES dbo.Meal([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'MealItem_foodId_fkey')
    ALTER TABLE dbo.MealItem ADD CONSTRAINT [MealItem_foodId_fkey]
      FOREIGN KEY ([foodId]) REFERENCES dbo.Food([id]) ON DELETE SET NULL ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'Message_mealPlanId_fkey')
    ALTER TABLE dbo.Message ADD CONSTRAINT [Message_mealPlanId_fkey]
      FOREIGN KEY ([mealPlanId]) REFERENCES dbo.MealPlan([id]) ON DELETE SET NULL ON UPDATE NO ACTION;
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'MessageAttachment_messageId_fkey')
    ALTER TABLE dbo.MessageAttachment ADD CONSTRAINT [MessageAttachment_messageId_fkey]
      FOREIGN KEY ([messageId]) REFERENCES dbo.Message([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT TRANSACTION;
GO

````


## 5. Migration: bỏ quản lý chi nhánh, gộp về một địa điểm

> Nguồn: `backend/prisma/sqlserver-remove-branch-management.sql`
> Giải thích việc gộp tồn kho kho nước uống về một địa điểm và bảng BeverageLocation (@@ignore, @@map Branch).


````sql

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Branch', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Branch (
            id NVARCHAR(100) NOT NULL CONSTRAINT PK_Branch PRIMARY KEY,
            name NVARCHAR(400) NOT NULL,
            address NVARCHAR(MAX) NULL,
            phone NVARCHAR(400) NULL,
            status NVARCHAR(400) NOT NULL CONSTRAINT DF_Branch_status DEFAULT N'ACTIVE',
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_Branch_createdAt DEFAULT SYSUTCDATETIME(),
            updatedAt DATETIME2 NOT NULL CONSTRAINT DF_Branch_updatedAt DEFAULT SYSUTCDATETIME(),
            CONSTRAINT UQ_Branch_name UNIQUE (name)
        );
    END;

    DECLARE @locationId NVARCHAR(100);

    SELECT TOP (1) @locationId = id
    FROM dbo.Branch
    WHERE UPPER(status) = N'ACTIVE'
    ORDER BY createdAt, id;

    IF @locationId IS NULL
    BEGIN
        SELECT TOP (1) @locationId = id
        FROM dbo.Branch
        ORDER BY createdAt, id;
    END;

    IF @locationId IS NULL
    BEGIN
        SET @locationId = CONVERT(NVARCHAR(100), NEWID());
        INSERT INTO dbo.Branch (id, name, address, phone, status, createdAt, updatedAt)
        VALUES (@locationId, N'Cơ sở chính', NULL, NULL, N'ACTIVE', SYSUTCDATETIME(), SYSUTCDATETIME());
    END;

    IF OBJECT_ID(N'dbo.BeverageStockMovement', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageStockMovement', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageStockMovement SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;
    IF OBJECT_ID(N'dbo.BeverageImport', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageImport', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageImport SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;
    IF OBJECT_ID(N'dbo.BeverageSale', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageSale', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageSale SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;

    UPDATE dbo.Branch
    SET status = CASE WHEN id = @locationId THEN N'ACTIVE' ELSE N'INACTIVE' END
    WHERE UPPER(status) <> CASE WHEN id = @locationId THEN N'ACTIVE' ELSE N'INACTIVE' END;

    DECLARE @tableName SYSNAME;
    DECLARE @constraintName SYSNAME;
    DECLARE @sql NVARCHAR(MAX);

    DECLARE branchForeignKeys CURSOR LOCAL FAST_FORWARD FOR
        SELECT OBJECT_NAME(fk.parent_object_id), fk.name
        FROM sys.foreign_keys AS fk
        WHERE fk.referenced_object_id = OBJECT_ID(N'dbo.Branch')
          AND fk.parent_object_id IN (OBJECT_ID(N'dbo.Member'), OBJECT_ID(N'dbo.StaffShift'));

    OPEN branchForeignKeys;
    FETCH NEXT FROM branchForeignKeys INTO @tableName, @constraintName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@tableName)
            + N' DROP CONSTRAINT ' + QUOTENAME(@constraintName) + N';';
        EXEC sys.sp_executesql @sql;
        FETCH NEXT FROM branchForeignKeys INTO @tableName, @constraintName;
    END;
    CLOSE branchForeignKeys;
    DEALLOCATE branchForeignKeys;

    DECLARE @indexTable SYSNAME;
    DECLARE @indexName SYSNAME;
    DECLARE branchIndexes CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT OBJECT_NAME(i.object_id), i.name
        FROM sys.indexes AS i
        INNER JOIN sys.index_columns AS ic
            ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        INNER JOIN sys.columns AS c
            ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id IN (OBJECT_ID(N'dbo.Member'), OBJECT_ID(N'dbo.StaffShift'))
          AND c.name = N'branchId'
          AND i.name IS NOT NULL
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

    OPEN branchIndexes;
    FETCH NEXT FROM branchIndexes INTO @indexTable, @indexName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = N'DROP INDEX ' + QUOTENAME(@indexName) + N' ON dbo.'
            + QUOTENAME(@indexTable) + N';';
        EXEC sys.sp_executesql @sql;
        FETCH NEXT FROM branchIndexes INTO @indexTable, @indexName;
    END;
    CLOSE branchIndexes;
    DEALLOCATE branchIndexes;

    IF COL_LENGTH(N'dbo.Member', N'branchId') IS NOT NULL
    BEGIN
        IF OBJECT_ID(N'dbo.BranchMemberAssignmentArchive', N'U') IS NULL
            CREATE TABLE dbo.BranchMemberAssignmentArchive (
                entityId NVARCHAR(100) NOT NULL CONSTRAINT PK_BranchMemberAssignmentArchive PRIMARY KEY,
                branchId NVARCHAR(100) NULL,
                archivedAt DATETIME2 NOT NULL CONSTRAINT DF_BranchMemberAssignmentArchive_archivedAt DEFAULT SYSUTCDATETIME()
            );

        EXEC sys.sp_executesql N'
            INSERT INTO dbo.BranchMemberAssignmentArchive (entityId, branchId)
            SELECT CONVERT(NVARCHAR(100), id), branchId
            FROM dbo.Member
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BranchMemberAssignmentArchive AS archived
                WHERE archived.entityId = CONVERT(NVARCHAR(100), dbo.Member.id)
            );';
    END;

    IF COL_LENGTH(N'dbo.StaffShift', N'branchId') IS NOT NULL
    BEGIN
        IF OBJECT_ID(N'dbo.BranchStaffShiftAssignmentArchive', N'U') IS NULL
            CREATE TABLE dbo.BranchStaffShiftAssignmentArchive (
                entityId NVARCHAR(100) NOT NULL CONSTRAINT PK_BranchStaffShiftAssignmentArchive PRIMARY KEY,
                branchId NVARCHAR(100) NULL,
                archivedAt DATETIME2 NOT NULL CONSTRAINT DF_BranchStaffShiftAssignmentArchive_archivedAt DEFAULT SYSUTCDATETIME()
            );

        EXEC sys.sp_executesql N'
            INSERT INTO dbo.BranchStaffShiftAssignmentArchive (entityId, branchId)
            SELECT CONVERT(NVARCHAR(100), id), branchId
            FROM dbo.StaffShift
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BranchStaffShiftAssignmentArchive AS archived
                WHERE archived.entityId = CONVERT(NVARCHAR(100), dbo.StaffShift.id)
            );';
    END;

    IF COL_LENGTH(N'dbo.Member', N'branchId') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.Member DROP COLUMN branchId;';
    IF COL_LENGTH(N'dbo.StaffShift', N'branchId') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.StaffShift DROP COLUMN branchId;';

    EXEC sys.sp_executesql N'
        CREATE OR ALTER VIEW dbo.vw_StaffShiftRevenue
        AS
        SELECT
            ss.id AS staffShiftId,
            ss.title AS shiftTitle,
            ss.staffId,
            u.fullName AS staffName,
            CAST(NULL AS NVARCHAR(100)) AS branchId,
            CAST(NULL AS NVARCHAR(400)) AS branchName,
            ss.startTime,
            ss.endTime,
            ss.status AS shiftStatus,
            COUNT(p.id) AS paidPaymentCount,
            COUNT(DISTINCT p.memberId) AS memberCount,
            COALESCE(SUM(p.amount), 0) AS totalRevenue
        FROM dbo.StaffShift AS ss
        INNER JOIN dbo.[User] AS u
            ON u.id = ss.staffId
        LEFT JOIN dbo.Payment AS p
            ON p.staffShiftId = ss.id
           AND UPPER(p.status) = N''PAID''
        GROUP BY
            ss.id, ss.title, ss.staffId, u.fullName,
            ss.startTime, ss.endTime, ss.status;';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

````


## 6. Migration: chốt quỹ ca làm

> Nguồn: `backend/prisma/sqlserver-add-staff-shift-settlement.sql`
> Cột cashExpected/cashCounted/cashDifference.


````sql

-- Add cash reconciliation fields to the existing StaffShift table.
-- Safe to run repeatedly; existing shift records remain unchanged.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.StaffShift', N'cashExpected') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashExpected DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'cashCounted') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashCounted DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'cashDifference') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashDifference DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closedById') IS NULL
  ALTER TABLE dbo.StaffShift ADD closedById UNIQUEIDENTIFIER NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD closedAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closeNotes') IS NULL
  ALTER TABLE dbo.StaffShift ADD closeNotes NVARCHAR(1000) NULL;

COMMIT TRANSACTION;

````


## 7. Migration: mẫu ca theo tuần & chấm công

> Nguồn: `backend/prisma/sqlserver-add-weekly-staff-shifts.sql`
> Bảng StaffShiftTemplate và startedAt/endedAt.


````sql

-- Add clock-in/out timestamps and recurring weekly staff shift templates.
-- Safe to run repeatedly; does not modify existing shift assignments.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.StaffShift', N'startedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD startedAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'endedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD endedAt DATETIME2 NULL;

IF OBJECT_ID(N'dbo.StaffShiftTemplate', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.StaffShiftTemplate (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_StaffShiftTemplate_Id DEFAULT NEWSEQUENTIALID(),
    staffId UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    weekday TINYINT NOT NULL,
    startMinute SMALLINT NOT NULL,
    endMinute SMALLINT NOT NULL,
    notes NVARCHAR(MAX) NULL,
    isActive BIT NOT NULL CONSTRAINT DF_StaffShiftTemplate_IsActive DEFAULT 1,
    createdAt DATETIME2 NOT NULL CONSTRAINT DF_StaffShiftTemplate_CreatedAt DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 NOT NULL CONSTRAINT DF_StaffShiftTemplate_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StaffShiftTemplate PRIMARY KEY (id),
    CONSTRAINT CK_StaffShiftTemplate_Weekday CHECK (weekday BETWEEN 1 AND 7),
    CONSTRAINT CK_StaffShiftTemplate_StartMinute CHECK (startMinute BETWEEN 0 AND 1439),
    CONSTRAINT CK_StaffShiftTemplate_EndMinute CHECK (endMinute BETWEEN 0 AND 1439),
    CONSTRAINT CK_StaffShiftTemplate_TimeRange CHECK (endMinute <> startMinute)
  );
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.StaffShiftTemplate')
    AND name = N'IX_StaffShiftTemplate_Staff_Weekday'
)
  CREATE INDEX IX_StaffShiftTemplate_Staff_Weekday
    ON dbo.StaffShiftTemplate (staffId, weekday, isActive);

COMMIT TRANSACTION;

````


## 8. Cấu hình khởi động backend (main.ts)

> Nguồn: `backend/src/main.ts`
> Global prefix /api, helmet, ValidationPipe, CORS, Swagger, body parser 4mb (payload vector khuôn mặt).


````ts

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  // 0. Security headers (Helmet) — trước mọi middleware khác
  app.use(helmet());

  // 0b. Body parser — payload vector khuôn mặt (tối đa 5 mẫu × 1024 số) và ảnh
  // chat/thực phẩm dạng data URL base64 đều có thể vượt giới hạn 100kb mặc định.
  app.useBodyParser('json', { limit: '4mb' });

  // 1. Enable Global Prefix
  app.setGlobalPrefix('api');

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. CORS Configuration
  app.enableCors({
    origin: [
      configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 4. Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gym Management & Operations API')
    .setDescription(
      'Hệ thống REST API quản lý hội viên và vận hành chuỗi phòng gym (Full-Stack Gym Management System). ' +
      'Bao gồm quản lý hội viên, huấn luyện viên (PT), gói tập, check-in, hoá đơn, thiết bị và báo cáo.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Nhập access token nhận được từ endpoint /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Kiểm tra trạng thái máy chủ')
    .addTag('Authentication', 'Đăng nhập, đăng ký và xác thực JWT')
    .addTag('Email Verification', 'Gửi & xác minh mã đăng ký hội viên qua email')
    .addTag('Users', 'Quản lý tài khoản người dùng và vai trò')
    .addTag('Members', 'Quản lý hồ sơ và thẻ hội viên phòng gym')
    .addTag('Trainers', 'Quản lý huấn luyện viên cá nhân (PT)')
    .addTag('Rooms', 'Quản lý phòng tập')
    .addTag('Membership Packages', 'Quản lý các gói tập gym')
    .addTag('Memberships', 'Quản lý các hợp đồng thẻ hội viên')
    .addTag('Check-ins', 'Quản lý lượt ra vào & quét thẻ check-in')
    .addTag('Face Recognition', 'Đăng ký & quét nhận diện khuôn mặt (sinh trắc học)')
    .addTag('Payments', 'Quản lý giao dịch thu tiền và hoá đơn')
    .addTag('Training Schedules', 'Quản lý lịch tập và lớp học PT')
    .addTag('Notifications', 'Quản lý thông báo hệ thống')
    .addTag('Reports', 'Báo cáo doanh thu & số liệu vận hành')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Gym Management API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`========================================================`);
  logger.log(`🚀 Backend REST API đang chạy tại: http://localhost:${port}/api`);
  logger.log(`📖 Swagger API Docs:               http://localhost:${port}/api/docs`);
  logger.log(`❤️  Healthcheck Endpoint:          http://localhost:${port}/api/health`);
  logger.log(`========================================================`);
}

bootstrap();

````


## 9. AppModule — danh sách module được import

> Nguồn: `backend/src/app.module.ts`
> Bằng chứng cho mô hình module-based monolith và cấu hình Throttler/Audit @Global.


````ts

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { MembersModule } from "./modules/members/members.module";
import { TrainersModule } from "./modules/trainers/trainers.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { PackagesModule } from "./modules/packages/packages.module";
import { MembershipsModule } from "./modules/memberships/memberships.module";
import { CheckinsModule } from "./modules/checkins/checkins.module";
import { FacesModule } from "./modules/faces/faces.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { SchedulesModule } from "./modules/schedules/schedules.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { PublicModule } from "./modules/public/public.module";
import { MemberModule } from "./modules/member/member.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { MailModule } from "./modules/mail/mail.module";
import { FoodsModule } from "./modules/foods/foods.module";
import { MealPlansModule } from "./modules/meal-plans/meal-plans.module";
import { ChatModule } from "./modules/chat/chat.module";
import { ExercisesModule } from "./modules/exercises/exercises.module";
import { ProgramsModule } from "./modules/programs/programs.module";
import { ClassBookingsModule } from "./modules/class-bookings/class-bookings.module";
import { BodyMetricsModule } from "./modules/body-metrics/body-metrics.module";
import { CassoModule } from "./modules/casso/casso.module";
import { EquipmentModule } from "./modules/equipment/equipment.module";
import { StaffShiftsModule } from "./modules/staff-shifts/staff-shifts.module";
import { BeveragesModule } from "./modules/beverages/beverages.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RealtimeMutationInterceptor } from "./common/interceptors/realtime-mutation.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    // Rate limiting toàn cục: mặc định 300 request / phút / IP.
    // Các endpoint nhạy cảm (login/register/validate mã) được đặt ngưỡng thấp hơn qua @Throttle.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 300,
      },
    ]),
    // EventEmitter nội bộ: gửi email nền (hóa đơn, thông báo...) không chặn API
    EventEmitterModule.forRoot(),
    PrismaModule,
    EquipmentModule,
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembersModule,
    TrainersModule,
    RoomsModule,
    PackagesModule,
    MembershipsModule,
    CheckinsModule,
    FacesModule,
    PaymentsModule,
    InvoicesModule,
    SchedulesModule,
    NotificationsModule,
    ReportsModule,
    PublicModule,
    MemberModule,
    AuditLogsModule,
    FoodsModule,
    ChatModule,
    MealPlansModule,
    CassoModule,
    ExercisesModule,
    ProgramsModule,
    ClassBookingsModule,
    BodyMetricsModule,
    StaffShiftsModule,
    BeveragesModule,
  ],
  providers: [
    // Rate limiting: áp dụng cho mọi request
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Thống nhất format lỗi, không lộ stack trace / thông tin nội bộ
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Phát một sự kiện metadata sau mỗi thao tác ghi HTTP thành công
    { provide: APP_INTERCEPTOR, useClass: RealtimeMutationInterceptor },
  ],
})
export class AppModule {}

````


## 10. package.json backend — phiên bản công nghệ

> Nguồn: `backend/package.json`
> NestJS 10, Prisma 5, Swagger, throttler, helmet, nodemailer, pdfkit, qrcode, socket.io.


````json

{
  "name": "gym-management-backend",
  "version": "1.0.0",
  "description": "Gym Management & Operations REST API built with NestJS, Prisma & SQL Server",
  "author": "LHU",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start --path tsconfig.dev.json",
    "prestart": "npm run db:sync-single-location && npm run db:sync-staff-settlement-and-templates",
    "start:dev": "nest start --watch --path tsconfig.dev.json",
    "prestart:dev": "npm run db:sync-single-location && npm run db:sync-staff-settlement-and-templates",
    "start:debug": "nest start --debug --watch --path tsconfig.dev.json",
    "prestart:debug": "npm run db:sync-single-location && npm run db:sync-staff-settlement-and-templates",
    "start:prod": "node dist/main.js",
    "prestart:prod": "npm run db:sync-single-location && npm run db:sync-staff-settlement-and-templates",
    "db:sync-single-location": "prisma db execute --file prisma/sqlserver-remove-branch-management.sql --schema prisma/schema.prisma",
    "db:sync-staff-shift-settlement": "prisma db execute --file prisma/sqlserver-add-staff-shift-settlement.sql --schema prisma/schema.prisma",
    "db:sync-weekly-shifts": "prisma db execute --file prisma/sqlserver-add-weekly-staff-shifts.sql --schema prisma/schema.prisma",
    "db:sync-staff-settlement-and-templates": "npm run db:sync-staff-shift-settlement && npm run db:sync-weekly-shifts",
    "db:remove-legacy-lookups": "prisma db execute --file prisma/sqlserver-remove-legacy-lookup-tables.sql --schema prisma/schema.prisma",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.8",
    "@nestjs/config": "^3.2.2",
    "@nestjs/core": "^10.3.8",
    "@nestjs/event-emitter": "^2.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.8",
    "@nestjs/platform-socket.io": "^10.4.22",
    "@nestjs/swagger": "^7.3.1",
    "@nestjs/throttler": "^6.7.1",
    "@nestjs/websockets": "^10.4.22",
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^3.0.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "helmet": "^8.3.0",
    "nodemailer": "^6.10.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "pdfkit": "^0.20.2",
    "qrcode": "^1.5.4",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.4",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.2",
    "@nestjs/schematics": "^10.1.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.12",
    "@types/nodemailer": "^6.4.24",
    "@types/passport-google-oauth20": "^2.0.17",
    "@types/passport-jwt": "^4.0.1",
    "@types/pdfkit": "^0.17.7",
    "prisma": "^5.14.0",
    "socket.io-client": "^4.8.4",
    "source-map-support": "^0.5.21",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.4.5"
  },
  "allowScripts": {
    "prisma@5.22.0": true,
    "@prisma/client@5.22.0": true,
    "@prisma/engines@5.22.0": true
  }
}

````


## 11. package.json frontend — phiên bản công nghệ

> Nguồn: `frontend/package.json`
> Next.js 14, React 18, TanStack Query v5, Axios, RHF+Zod, lucide, framer-motion, three, @vladmandic/human, Tailwind 3.


````json

{
  "name": "gym-management-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "knip": "knip",
    "analyze": "cross-env ANALYZE=true next build"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@tanstack/react-query": "^5.37.1",
    "@vladmandic/human": "^3.3.6",
    "axios": "^1.7.2",
    "clsx": "^2.1.1",
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.378.0",
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.51.4",
    "socket.io-client": "^4.8.4",
    "tailwind-merge": "^2.3.0",
    "three": "^0.171.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.2.3",
    "@types/node": "^20.12.12",
    "@types/react": "^18.3.2",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.171.0",
    "autoprefixer": "^10.4.19",
    "cross-env": "^7.0.3",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.3",
    "eslint-config-prettier": "^9.1.2",
    "eslint-plugin-jsx-a11y": "^6.10.2",
    "eslint-plugin-tailwindcss": "^3.18.2",
    "knip": "^6.38.0",
    "postcss": "^8.4.38",
    "postcss-load-config": "^6.0.1",
    "prettier": "^3.9.9",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}

````


## 12. README.md — nghiệp vụ, RBAC, bảo mật, kết quả kiểm thử

> Nguồn: `README.md`
> Nguồn tổng hợp. CẨN THẬN: README có chỗ ghi 'dark-only' và 'chưa tích hợp email' đang lỗi thời — đối chiếu với DESIGN_SYSTEM.md và seed.ts/code.


````md

# GymMaster Pro — Hệ thống Quản lý & Vận hành Phòng tập Gym (Full-Stack)

> Đồ án tốt nghiệp — Website + REST API quản lý chuỗi phòng tập gym: hội viên, thẻ tập,
> thanh toán & hóa đơn, check-in thời gian thực, huấn luyện viên, lịch tập,
> thiết bị, báo cáo, thông báo và **nhật ký hệ thống (audit log)**.
>
> Toàn bộ giao diện & thông báo API viết bằng **tiếng Việt**.

| | |
| :-------------------- | :---------------------------------------------------------------------------- |
| **Frontend** | Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 — http://localhost:3000 |
| **Backend** | NestJS 10 · Prisma 5 · SQL Server 2022 — http://localhost:3001/api |
| **Tài liệu API** | Swagger UI — http://localhost:3001/api/docs |
| **Kiểm tra sức khoẻ** | `GET /api/health` → `{"status":"ok","database":"connected"}` |

---

## 📑 Mục lục

1. [Tính năng](#-tính-năng)
2. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
3. [Khởi chạy nhanh (Quickstart)](#-khởi-chạy-nhanh)
4. [Tài khoản demo](#-tài-khoản-demo)
5. [Phân quyền (RBAC)](#-phân-quyền-rbac)
6. [Cấu trúc dự án](#-cấu-trúc-dự-án)
7. [Mô hình dữ liệu](#-mô-hình-dữ-liệu)
8. [Bảo mật](#-bảo-mật)
9. [Hệ thống thiết kế giao diện](#-hệ-thống-thiết-kế-giao-diện)
10. [Lệnh phát triển & kiểm thử](#-lệnh-phát-triển--kiểm-thử)
11. [Kết quả kiểm thử](#-kết-quả-kiểm-thử)
12. [Triển khai (deploy)](#-triển-khai-deploy)
13. [Hạn chế & hướng phát triển](#-hạn-chế--hướng-phát-triển)
14. [Cấu trúc commit / tài liệu nội bộ](#-cấu-trúc-commit--tài-liệu-nội-bộ)

---

## ✨ Tính năng

### Cổng công khai (không cần đăng nhập)

- Trang chủ (hero, chương trình tập, lịch tuần, tiến trình, bài viết nổi bật, CTA)
- Giới thiệu · Gói tập · Huấn luyện viên · Lịch tập · Blog · Liên hệ
- Đăng ký hội viên mới (`/register`) — **2 bước**: điền thông tin → nhận mã xác minh 6 số
  qua email (SMTP) → nhập mã mới tạo tài khoản · Đăng nhập (`/login`)
- Trang `404` và `error` riêng, không để lộ thông tin kỹ thuật

### Realtime toàn hệ thống

- Các vai trò `ADMIN`, `STAFF`, `TRAINER` và `MEMBER` dùng Socket.IO đã xác thực JWT.
- Sau mỗi thao tác ghi HTTP thành công, backend chỉ phát metadata của route; frontend làm mới các
  truy vấn React Query đang hoạt động qua REST API và quyền hiện có, không gửi dữ liệu nghiệp vụ
  trong socket event và không cần tải lại trang.
- Trình duyệt thực hiện thao tác cũng làm mới dữ liệu sau khi API thành công, kể cả khi socket tạm
  mất kết nối. Bộ đếm thông báo/tin nhắn dựa trên sự kiện realtime thay vì polling mỗi phút.

### Khu vực hội viên `/member` — vai trò `MEMBER`

- Dashboard cá nhân: gói tập hiện tại, số buổi tập tháng này, PT phụ trách, thanh toán gần nhất
- **Đăng ký / gia hạn gói tập** online (chọn **tiền mặt (CASH)** hoặc **chuyển khoản (BANK_TRANSFER)**;
  chuyển khoản được đối soát qua CASSO); thấy ngay **gói đã gia hạn sắp kích hoạt** và tự **hủy yêu
  cầu đang chờ thanh toán** nếu chưa đóng tiền/chuyển khoản
- **Check-in / Check-out** tự phục vụ hoặc lễ tân hỗ trợ
- Lịch sử check-in, lịch tập cá nhân, huấn luyện viên phụ trách
- Khi ADMIN/STAFF phân công HLV phụ trách, hội viên nhận thông báo realtime và thấy thông tin HLV tại trang Gói tập của tôi. Phân công HLV không tự tạo quota buổi PT trong gói.
- Hóa đơn: danh sách + chi tiết + **in biên lao**
- Hồ sơ cá nhân, chuỗi thông báo, cập nhật mật khẩu

### Khu vực quản trị `/admin` — vai trò `ADMIN` / `STAFF`

| Nhóm | Màn hình |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tổng quan | Dashboard KPI, biểu đồ lượt tập theo giờ |
| Hội viên & vận hành | Lượt check-in (quét thẻ), hội viên (+ chi tiết/tab lịch sử), thẻ hội viên, gói tập, HLV, lịch tập & lớp học, **tài khoản nhân viên**, **ca làm & doanh thu theo ca** |
| Tài chính | Hóa đơn & thu phí (+ xác nhận / từ chối / hoàn tiền), báo cáo doanh thu |
| Cơ sở & thiết bị | Thiết bị máy móc (+ lịch sử bảo trì), phòng tập |
| Hệ thống | Báo cáo thống kê (8 tab), thông báo, **nhật ký hệ thống**, cài đặt & phân quyền |

- Với hợp đồng cũ thiếu snapshot quota PT, ADMIN phải đối chiếu hồ sơ và lịch PT, xác nhận
  tổng quota, số buổi đã dùng và giá trị mỗi buổi; hệ thống lưu kết quả kèm ghi chú audit trước khi
  mở bước đề xuất hoàn tiền. Lịch đã gắn hợp đồng là mức đã dùng tối thiểu; lịch chưa liên kết chỉ
  hiển thị tham khảo để tránh tự động tính nhầm cho hợp đồng khác.

### Ca làm & doanh thu — `/admin/shifts`

- ADMIN tạo tài khoản STAFF và gửi email thông tin đăng nhập kèm mật khẩu tạm thời; nhân viên cần đổi mật khẩu sau lần đăng nhập đầu tiên. Có thể lưu mẫu ca theo thứ trong tuần và sinh lịch cho tối đa 31 ngày. Mẫu không tự tạo ca đến khi ADMIN chọn sinh lịch. Vẫn có thể phân công, sửa, xóa ca chưa bắt đầu hoặc hủy ca; không cho phân công trùng giờ cho cùng nhân viên.
- STAFF xem ca được phân, tự chấm công vào và chấm công ra. Khi kết thúc ca, nhập tiền mặt thực đếm để chốt quỹ. Hệ thống đối chiếu giao dịch tiền mặt (CASH) và giao dịch chuyển khoản đã xác nhận qua CASSO (gói tập và bán nước); nếu thiếu/thừa thì bắt buộc ghi lý do. Còn giao dịch tiền mặt/chuyển khoản chờ xác nhận thì chưa cho chốt. Giao dịch tạo tại quầy được gắn với đúng nhân viên và ca tại thời điểm tạo; CASSO có thể hoàn tất giao dịch chuyển khoản đến muộn vào chính ca đó, nhưng không gán sang ca mới hoặc ca đã hủy. Thanh toán hội viên tự thực hiện online không bị gán nhầm vào ca quầy.
- Khi nhân viên vào ca hoặc chốt ca, trang ca làm của nhân viên cập nhật ngay qua Socket.IO; ADMIN đang trực tuyến nhận thông báo tức thì, không cần tải lại trang.
- Báo cáo lọc theo ngày, nhân viên và trạng thái; chỉ tính Payment `PAID`, tổng hợp doanh thu, số giao dịch và hội viên duy nhất theo ca/ngày/nhân viên.
- Ca dùng các trạng thái `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Chỉ hoàn tất trạng thái `COMPLETED` sau khi lưu chốt quỹ; ca đã chốt/hủy không thể ghi nhận thanh toán mới. Backend tự chạy các script SQL idempotent trước `npm run start`, `start:dev`, `start:debug` và `start:prod`: `sqlserver-add-staff-shift-settlement.sql` bổ sung cột chốt quỹ/đóng ca; `sqlserver-add-weekly-staff-shifts.sql` bổ sung thời điểm chấm công và bảng mẫu tuần. Các script không xóa dữ liệu hiện có.

### Tài khoản nhân viên — `/admin/staff`

- ADMIN tìm kiếm tài khoản STAFF theo tên, email hoặc số điện thoại; lọc trạng thái và khóa/kích hoạt lại tài khoản đăng nhập.
- Tạo tài khoản mới tại trang này; mật khẩu tạm thời được gửi tới email nhân viên.

### Kinh doanh nước uống — `/admin/beverages`

- Dashboard doanh số, tồn kho, cảnh báo sắp hết/hết hàng, lợi nhuận gộp ước tính và sản phẩm bán chạy; quản lý sản phẩm, phiếu nhập nhiều dòng, POS tại quầy, tồn kho/điều chỉnh và báo cáo theo ngày/tuần/tháng/năm (xuất CSV mở bằng Excel).
- ADMIN quản lý sản phẩm, nhập kho, điều chỉnh và báo cáo tại một địa điểm. STAFF có thể xem sản phẩm/tồn kho kể cả trước ca, chỉ bán trong ca `IN_PROGRESS` được phân công, và chỉ xem hóa đơn do chính mình bán. Chuyển khoản POS tạo QR VietQR giống luồng đăng ký hội viên, kèm mã hội viên/mã đơn riêng; CASSO tự đối soát mỗi 5 giây và backend chỉ ghi nhận hóa đơn, trừ kho khi xác nhận đúng mã và số tiền, đồng thời ngăn dùng lại mã giao dịch. Doanh thu bán nước được cộng vào doanh thu ca, báo cáo theo nhân viên và tiền dự kiến khi chốt quỹ. MEMBER chỉ xem các hóa đơn đã thanh toán gắn với hồ sơ của mình tại `/member/beverages`.
- Dùng trực tiếp sáu bảng SQL Server `BeverageProduct`, `BeverageImport`, `BeverageImportItem`, `BeverageSale`, `BeverageSaleItem`, `BeverageStockMovement`; không thêm Prisma model/bảng. Truy vấn tồn kho và thống kê qua các view `vw_BeverageStock`, `vw_BeverageImportStatistics`, `vw_BeverageSalesStatistics`, `vw_BeverageProductSalesStatistics`.
- `BeverageLocation` là model nội bộ bị ẩn khỏi Prisma Client, ánh xạ bảng `Branch` cũ để giữ liên kết lịch sử kho. Không còn API hay giao diện quản lý/chọn chi nhánh. Backend tự chạy migration `sqlserver-remove-branch-management.sql` khi khởi động để gộp tồn kho/phiếu nhập/hóa đơn về một địa điểm, lưu liên kết chi nhánh cũ của hội viên/ca làm vào bảng archive rồi bỏ các cột đó. Có thể chạy lại thủ công bằng `cd backend && npm run db:sync-single-location` để sửa dữ liệu cũ; migration được thiết kế chạy lặp an toàn.
- Các bảng lookup cũ chỉ chứa danh sách giá trị enum (`CheckInMethod`, `Gender`, `PaymentStatusTbl`, v.v.) không được ứng dụng truy vấn; các giá trị được quản lý trong mã nguồn. Sau khi sao lưu database, có thể xóa các bảng này một lần bằng `cd backend && npm run db:remove-legacy-lookups`. Script chỉ chạy trên `gym_db`, kiểm tra schema và từ chối xóa nếu có khóa ngoại, trigger hoặc đối tượng SQL phụ thuộc; không tự chạy khi khởi động backend.
- Xác nhận nhập/bán dùng `usp_ReceiveBeverageImport` và `usp_CompleteBeverageSale`; adjustment ghi movement có người thực hiện/lý do. POS giữ giá vốn/giá bán tại thời điểm bán, kiểm tra tồn kho trong transaction, và khóa chống xử lý lặp dựa trên `requestId` (không cần cột/bảng idempotency mới).

### Khu vực huấn luyện viên `/trainer` — vai trò `TRAINER`

- Dashboard: lịch dạy hôm nay, số học viên, tổng buổi đã hoàn thành
- Lịch dạy, danh sách học viên phụ trách, ghi nhận tiến trình tập, hồ sơ cá nhân

### Nhật ký hệ thống (Audit Log) — _tính năng STEP 9_

- Ghi lại **53 loại hành động**: đăng nhập, đổi mật khẩu, tạo/cập nhật hội viên,
  đăng ký hội viên kèm mã xác minh email (gửi / gửi lại / sai mã), đổi trạng thái & gia hạn thẻ,
  hội viên tự hủy yêu cầu thanh toán, xác nhận/từ chối/hoàn tiền, check-in/out, sinh trắc học
  khuôn mặt, đối soát quota PT, thao tác HLV, tạo/sửa/hủy/hoàn thành lịch tập,
  hội thoại & kế hoạch dinh dưỡng
- **Không bao giờ** ghi mật khẩu, `passwordHash` hay token
- Trang `/admin/audit-logs`: lọc theo người dùng / hành động / entity / từ ngày / đến ngày /
  tìm kiếm nội dung, phân trang, xem metadata dạng JSON — chỉ `ADMIN`

---

## 🛠 Công nghệ sử dụng

### Frontend — `frontend/`

| Nhóm | Công nghệ |
| :------------ | :---------------------------------------------------------------------------------------------- |
| Framework | Next.js 14 (App Router) · React 18 · TypeScript |
| Styling | Tailwind CSS 3 (thiết kế riêng, xem [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)) |
| Font | `Barlow Condensed` (tiêu đề) + `Be Vietnam Pro` (nội dung) — `next/font/google` |
| Icon | `lucide-react` |
| Data fetching | `@tanstack/react-query` v5 (`staleTime` 2 phút, `retry: 1`) |
| HTTP | `axios` + interceptor tự gắn JWT & điều hướng 401 |
| Form | `react-hook-form` + `zod` |
| Tiện ích | `clsx` + `tailwind-merge` (`cn()`) |
| Kiểm tra | ESLint (`next/core-web-vitals` + `tailwindcss` + `jsx-a11y`) · Prettier · `tsc --noEmit` · Knip |

> **Không** dùng thư viện biểu đồ ngoài — biểu đồ được vẽ tay bằng SVG trong
> `src/components/charts/`.

### Backend — `backend/`

| Nhóm | Công nghệ |
| :----------- | :----------------------------------------------------------------------------------------- |
| Framework | NestJS 10 · TypeScript |
| ORM / DB | Prisma 5 + SQL Server 2022 |
| Xác thực | Passport + JWT (`@nestjs/jwt`), `bcryptjs` (10 vòng) |
| Validation | `class-validator` + `class-transformer` (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Bảo mật HTTP | `helmet` + `@nestjs/throttler` (rate limit) + CORS allowlist |
| Tài liệu | `@nestjs/swagger` (OpenAPI 3) |

---

## 🚀 Khởi chạy nhanh

### Yêu cầu

- **Node.js ≥ 20** (khuyến nghị 22/24) và **npm ≥ 10**
- **SQL Server 2022** — cài native hoặc dùng Docker Compose

### Bước 1 — Khởi động cơ sở dữ liệu

**Cách A — Docker:**

```bash
MSSQL_SA_PASSWORD=Your_Strong_Password_Here docker compose up -d
```

PowerShell:

```powershell
$env:MSSQL_SA_PASSWORD = "Your_Strong_Password_Here"
docker compose up -d
```

Container SQL Server lắng nghe tại `localhost:1433`, tài khoản `sa`. Chỉ tạo `gym_db`
nếu database chưa tồn tại. Nếu đã có dữ liệu trong database này, không drop hoặc tạo lại.

**Cách B — SQL Server cài sẵn trên máy:**

```sql
IF DB_ID(N'gym_db') IS NULL
  CREATE DATABASE gym_db;
```

Đảm bảo SQL Server bật SQL authentication và thông tin đăng nhập trong `backend/.env` hợp lệ.
Nếu `gym_db` đã có dữ liệu, giữ nguyên database đó và sao lưu trước khi thay đổi schema.

### Bước 2 — Chạy Backend (cổng 3001)

```bash
cd backend
npm install

# Tạo file .env từ mẫu
cp .env.example .env         # Windows PowerShell:  copy .env.example .env
# Sửa DATABASE_URL + JWT_SECRET trong .env; DATABASE_URL phải khớp SQL Server đang chạy.

# Sinh Prisma Client
npx prisma generate

# Chạy development server
npm run start:dev
```

**Database mới, rỗng:** chỉ trong database mới tạo và còn rỗng, đồng bộ schema bằng
`npx prisma db push`, chạy `backend/prisma/sqlserver-optional-unique-indexes.sql` trong SSMS,
rồi nạp dữ liệu mẫu bằng `npm run prisma:seed`.

**Database `gym_db` hiện có dữ liệu:** không chạy `prisma db push`, không seed lại và không
drop/recreate database. Sao lưu và khôi phục sang database thử nghiệm trước, sau đó chạy toàn bộ
`backend/prisma/sqlserver-gymdb-preserve-migration.sql` trong SSMS để thêm schema ứng dụng và
backfill dữ liệu legacy theo mapping có kiểm tra. Script giữ nguyên bảng/cột legacy, nhưng chỉ
áp dụng lên `gym_db` thật sau khi bản sao đã kiểm thử và có bản backup xác minh được.
`backend/prisma/sqlserver-membership-package-link.sql` là script cũ, không thay thế migration đầy đủ.

Kiểm tra:

- API: <http://localhost:3001/api>
- Swagger: <http://localhost:3001/api/docs>
- Health: <http://localhost:3001/api/health> → `database: "connected"`

> ⚠️ **Dự án không dùng `prisma/migrate`.** `prisma db push` chỉ dành cho database mới, rỗng.
> Không dùng lệnh này trực tiếp trên `gym_db` hiện có: schema legacy chưa khớp hoàn toàn và
> thao tác có thể xóa bảng/cột cũ. Database có dữ liệu phải được cập nhật bằng migration đã
> rà soát và sao lưu trước.

### Bước 3 — Chạy Frontend (cổng 3000)

```bash
cd frontend
npm install
cp .env.example .env.local     # Windows PowerShell:  copy .env.example .env.local
npm run dev
```

Mở trình duyệt: **<http://localhost:3000>**

---

## 🔐 Tài khoản demo

Mật khẩu được đặt trong `backend/prisma/seed.ts`. Trang `/login` có nút bấm nhanh để điền.

| Vai trò | Email | Mật khẩu | Khu vực |
| :---------- | :------------------------------------- | :--------------- | :----------------------------------------------------------------- |
| **ADMIN** | `admin@gym.com` | `Admin@123456` | `/admin` — toàn quyền, kể cả phân quyền & cài đặt |
| **STAFF** | `staff@gym.com` | `Staff@123456` | `/admin` — lễ tân: check-in, hội viên, thu phí (không xem nhật ký) |
| **TRAINER** | `trainer@gym.com` | `Trainer@123456` | `/trainer` — lịch dạy, học viên, tiến trình |
| **MEMBER** | `member@gym.com` | `Member@123456` | `/member` — hội viên chính (`MEM-0001`, thẻ `MEM-0001`) |
| MEMBER | `member2@gym.com` … `member11@gym.com` | `Member@123456` | Hội viên demo `MEM-0002` … `MEM-0011` |

**Dữ liệu demo có sẵn** (sau `npm run prisma:seed`):
5 phòng tập · 3 gói tập · 3 huấn luyện viên · 17 tài khoản · **11 hội viên** ·
11 thẻ tập đa trạng thái (`ACTIVE` / `EXPIRED` / `PENDING` / `CANCELLED`) ·
11 hóa đơn (mỗi thẻ đúng 1 đơn, tổng hoá đơn khớp số tiền thanh toán) + 1 giao dịch `FAILED` ·
**68 lượt check-in** lịch sử · 14 buổi tập (PT & lớp nhóm) & tiến trình tập ·
5 thiết bị kèm 3 lịch bảo trì · thông báo mẫu ·
**30 dòng nhật ký hệ thống** phủ **23 loại hành động** (khi `DEMO_MEMBERS = true`; đặt `false` chỉ còn 8 dòng cơ bản) để demo trang `/admin/audit-logs`
(chưa có trong seed: `FACE_ENROLL`/`FACE_DELETE`/`MEMBER_CREATE` và 3 action đăng ký qua
mã xác minh email — chỉ sinh ra khi dùng chức năng tương ứng).

> Tài khoản trên **chỉ dùng cho môi trường demo/đồ án**. Khi triển khai thật, hãy đổi
> `JWT_SECRET`, xoá tài khoản demo và dùng HTTPS.

---

## 🛡 Phân quyền (RBAC)

Phân quyền được kiểm soát **hai lớp**: `JwtAuthGuard` → `RolesGuard` ở backend (thứ tự route),
và `AdminGuard` / `MemberGuard` / `TrainerGuard` ở frontend (điều hướng + ẩn menu).

| Nhóm chức năng | ADMIN | STAFF | TRAINER | MEMBER |
| :-------------------------------------------- | :---: | :-----: | :-------: | :-----------------: |
| Dashboard tổng quan, báo cáo thống kê | ✅ | ✅ | — | — |
| Hội viên / thẻ tập / gói tập / lịch tập / HLV | ✅ | ✅ (đọc) | — | — |
| Check-in thủ công (lễ tân) | ✅ | ✅ | — | — |
| Xác nhận / từ chối / hoàn tiền | ✅ | ✅¹ | — | — |
| Phòng / thiết bị / bảo trì | ✅ | ✅ (đọc)¹ | — | — |
| Quản lý tài khoản & đổi vai trò | ✅ | — | — | — |
| **Nhật ký hệ thống** | ✅ | ❌ (403) | ❌ | ❌ |
| Giao diện huấn luyện viên | — | — | ✅ | — |
| Đăng ký/gia hạn gói, hóa đơn, lịch tập, hồ sơ | — | — | — | ✅ (của chính mình) |

¹ Thanh toán dùng **tiền mặt (CASH)** hoặc **chuyển khoản (BANK_TRANSFER, đối soát CASSO)**;
`STAFF` / `ADMIN` xác nhận thủ công, kể cả khi CASSO chưa khớp.

Dữ liệu cá nhân của hội viên **luôn** lấy từ `sub` trong JWT — không nhận `memberId` từ
request body, nên không thể đọc dữ liệu của người khác.

---

## 📁 Cấu trúc dự án

```text
Web gym/
├── docker-compose.yml            # SQL Server 2022 cho môi trường dev
├── README.md                     # Tài liệu này
├── AGENTS.md                     # Quy ước làm việc cho AI agent / developer
├── DESIGN_SYSTEM.md              # Chuẩn giao diện (bắt buộc đọc trước khi sửa UI)
├── .github/workflows/ci.yml      # CI: typecheck · lint · format · build (FE + BE)
│
├── backend/                      # ── NestJS REST API (:3001) ──
│   ├── .env.example              # Mẫu biến môi trường (KHÔNG commit .env thật)
│   ├── prisma/
│   │   ├── schema.prisma         # SQL Server data models
│   │   └── seed.ts               # Dữ liệu demo idempotent
│   └── src/
│       ├── main.ts               # Swagger · CORS · helmet · ValidationPipe · port
│       ├── app.module.ts         # ThrottlerModule + APP_GUARD
│       ├── prisma/               # PrismaModule · PrismaService
│       ├── common/
│       │   ├── decorators/       # @Roles · @CurrentUser · @Public
│       │   ├── filters/          # AllExceptionsFilter (chuẩn hoá lỗi)
│       │   └── guards/           # JwtAuthGuard · RolesGuard
│       └── modules/              # 18 module nghiệp vụ
│           ├── auth/             # Đăng nhập · đăng ký · JWT strategy
│           ├── users/            # Tài khoản & phân quyền
│           ├── audit-logs/       # Nhật ký hệ thống (@Global)
│           ├── members/          # Hồ sơ hội viên
│           ├── member/           # Cổng API riêng cho hội viên
│           ├── memberships/      # Thẻ hội viên
│           ├── packages/         # Gói tập
│           ├── payments/         # Thanh toán tiền mặt + chuyển khoản/CASSO
│           ├── invoices/         # Hóa đơn INV-YYYY-NNNNNN
│           ├── checkins/         # Check-in / check-out
│           ├── trainers/         # Huấn luyện viên
│           ├── schedules/        # Lịch tập · lớp học · tiến trình
│           ├── notifications/    # Thông báo & ticker
│           ├── reports/          # Báo cáo tổng hợp (8 nhóm)
│           ├── public/           # API công khai cho website
│           └── health/           # Healthcheck
│
└── frontend/                     # ── Next.js App Router (:3000) ──
    ├── .env.example
    └── src/
        ├── app/
        │   ├── (public)/         # / · /about · /packages · /trainers · /schedule · /blog · /contact
        │   ├── (auth)/           # /login · /register
        │   ├── (member)/         # Cổng hội viên
        │   ├── (trainer)/        # Cổng huấn luyện viên
        │   ├── (admin)/          # Khu vực quản trị
        │   ├── not-found.tsx     # 404
        │   └── error.tsx         # 500
        ├── components/
        │   ├── ui/               # Button Card Input Select Dialog Badge StatCard Tabs Toast …
        │   ├── layout/           # Header · Footer · AdminSidebar · MemberNav · TrainerNav
        │   ├── guards/           # AdminGuard · MemberGuard · TrainerGuard
        │   ├── home/             # Các khối trang chủ
        │   ├── charts/           # Biểu đồ SVG tự vẽ
        │   ├── notifications/    # Chuông thông báo + ticker
        │   └── training/         # Khối lịch tập / tiến trình
        ├── services/             # 15 service gọi REST API + toàn bộ TypeScript type
        ├── lib/                  # axios · auth · status (nhãn tiếng Việt) · utils · programs
        └── providers/            # QueryProvider (TanStack Query)
```

---

## 🗄 Mô hình dữ liệu

**35 model**, liên kết bằng khoá ngoại có chủ đích để không mất lịch sử:

```text
User ─┬─ Trainer ─┬─ TrainingSchedule
      │           └─ TrainerMember ── TrainingProgress
      └─ Member ─┬─ Membership ── Payment ── Invoice
                 ├─ CheckIn
                 ├─ TrainingSchedule
                 └─ Notification
User ── AuditLog (SetNull)      # xoá user không mất nhật ký
```

Quy ước quan hệ:

- `Cascade` — dữ liệu con **phụ thuộc sống** (Trainer của User, Membership của Member)
- `SetNull` — dữ liệu lịch sử **được giữ lại** (AuditLog.userId, Payment.confirmedById)
- `Restrict` — dữ liệu tài chính / vận hành quan trọng (Payment.memberId, Membership.packageId)

Index được đặt theo truy vấn thực tế (theo `status`, `memberId`, `createdAt`,
`code`, `email`…), không thêm index thừa.

---

## 🔒 Bảo mật

| Hạng mục | Cách thực hiện |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mật khẩu | `bcryptjs`, **10 vòng salt**; không bao giờ trả `passwordHash` ra API |
| JWT | Payload **tối thiểu**: `{ sub, email, role, iat, exp }`; `JWT_SECRET` phải ≥ 32 ký tự |
| Xác thực | `JwtAuthGuard` toàn cục + `@Public()` cho route công khai |
| Phân quyền | `RolesGuard` đọc `@Roles(...)` từ metadata; trả `403` rõ ràng khi thiếu quyền |
| Input validation | `ValidationPipe` toàn cục: `whitelist`, `forbidNonWhitelisted`, `transform` → field lạ trong body bị từ chối `400` |
| HTTP headers | `helmet` (HSTS, `X-Content-Type-Options`, ẩn `X-Powered-By`, CSP…) |
| Rate limit | `@nestjs/throttler`: toàn cục **300 req/phút**; `POST /auth/login` **10/60s**; `POST /auth/register` (chỉ ADMIN) **5/300s**; đăng ký hội viên tự do: `member-register/send-code` & `resend-code` **5/300s**, `member-register/verify` **10/300s** |
| CORS | Allowlist qua `CORS_ORIGIN` (danh sách phân tách dấu phẩy) |
| Lỗi | `AllExceptionsFilter` chuẩn hoá `{ statusCode, message, error, path, timestamp }`, map lỗi Prisma, **luôn** log chi tiết ở server |
| Nhật ký | `AuditService` (@Global) ghi 53 loại hành động (xem `AUDIT_ACTION_META`); `log()` **không bao giờ throw** để không làm hỏng nghiệp vụ chính; không lưu mật khẩu/token |
| Rò rỉ thông tin | `.env` nằm trong `.gitignore`; chỉ commit `.env.example` |

Biến môi trường bắt buộc (xem `backend/.env.example`):

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="sqlserver://localhost:1433;database=gym_db;user=sa;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
JWT_SECRET="CHUOI_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
```

---

## 🎨 Hệ thống thiết kế giao diện

Nguồn chuẩn: **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — tóm tắt:

| Token | Mã màu | Dùng cho |
| :-------- | :-------------------------- | :------------------------------------------------------- |
| `ink` | `#0B0D0F` | Nền trang |
| `surface` | `#15191D` | Thẻ, panel, sidebar |
| `neon` | `#B7FF00` (hover `#D0FF4D`) | **Chỉ** làm accent: nút chính, số liệu, indicator active |
| `chalk` | `#F5F5F5` | Chữ chính |
| `muted` | `#9AA0A6` | Chữ phụ |
| `line` | `#272C31` | Viền |
| `danger` | `#FF4545` | Lỗi, huỷ, xoá |

Nguyên tắc bắt buộc:

- **Dark-only** — không có toggle sáng/tối, không dùng class `dark:`
- Neon **không** tô nền lớn, không gradient neon
- Font: `Barlow Condensed` (tiêu đề) + `Be Vietnam Pro` (nội dung)
- Icon: `lucide-react` · Animation: component `Reveal` (IntersectionObserver, tôn trọng `prefers-reduced-motion`)
- Gộp class bằng `cn()`; ảnh qua `next/image` với `alt` tiếng Việt

---

## 🧪 Lệnh phát triển & kiểm thử

### `frontend/`

```bash
npm run dev           # dev server :3000
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (next/core-web-vitals + tailwindcss + jsx-a11y)
npm run format        # Prettier --write
npm run format:check  # Prettier --check  (CI dùng)
npm run build         # next build
npm run analyze       # build kèm @next/bundle-analyzer
npm run knip          # phát hiện file/export/dependency không dùng
```

### `backend/`

```bash
npm run start:dev     # nest start --watch :3001
npm run db:sync-staff-shift-settlement # áp dụng migration StaffShift an toàn, có thể chạy lại
npm run build         # nest build (dist/; dev dùng dist-dev/ riêng)
npm run prisma:generate
npm run prisma:seed   # ts-node prisma/seed.ts
npm run prisma:studio # trình duyệt dữ liệu
npx prisma db push    # đồng bộ schema (KHÔNG dùng migrations)
npx prisma validate   # kiểm tra schema
```

### Kiểm tra trước khi báo cáo "xong"

```bash
cd frontend && npm run typecheck && npm run lint && npm run format:check
cd ../backend && npm run build
```

> **Lưu ý Windows:** đường dẫn dự án có dấu tiếng Việt → luôn quote đường dẫn trong PowerShell.
> Không chạy `next build` khi `next dev` đang dùng chung thư mục `.next` (sẽ hỏng cache);
> nếu lỡ chạy: dừng process ở cổng 3000 → xoá `.next` → chạy lại `npm run dev`.

---

## ✅ Kết quả kiểm thử

| Hạng mục | Kết quả |
| :-------------------------- | :----------------------------------------------------------------------- |
| `npm run typecheck` (FE) | ✅ PASS — 0 lỗi TypeScript |
| `npm run lint` (FE) | ✅ PASS — 0 lỗi, 1 warning có sẵn |
| `npm run format:check` (FE) | ✅ PASS |
| `npm run build` (FE) | ✅ PASS — **49 routes**, không lỗi |
| `npm run build` (BE) | ✅ PASS |
| `prisma validate` | ✅ PASS |
| Smoke test API (STEP 9) | ✅ **76/76 PASS** |
| QA giao diện Playwright | ✅ **0** console error · **0** tràn ngang ở 375/430/768/1280/1440/1920px |

**Smoke test API** (`smoke-step9.js`) kiểm tra: security header helmet · RBAC 401/403 ·
E2E đăng ký hội viên → đăng ký gói → admin xác nhận thanh toán → check-in/out · ghi và truy vấn
audit log · lọc & phân trang · ràng buộc dữ liệu cá nhân · validation DTO ·
rate limit 429.

**QA giao diện** (`qa-step9-sweep.js`) quét **38 route × 6 viewport** với 3 vai trò đăng nhập,
đối chiếu: không overflow ngang, không lỗi console, trang không render rỗng.

---

## 📦 Triển khai (deploy)

### Backend

```bash
cd backend
npm ci
npm run build
npx prisma db push            # đồng bộ schema; sao lưu DB trước khi cập nhật
npm run start:prod
```

Bắt buộc khi deploy:

- `DATABASE_URL` trỏ tới SQL Server được quản lý hoặc máy chủ SQL Server của bạn
- `JWT_SECRET` ngẫu nhiên ≥ 32 ký tự (VD: `openssl rand -hex 32`)
- `CORS_ORIGIN` = domain thật của frontend
- Đặt sau reverse proxy HTTPS (nginx/Caddy) — `helmet` đã bật HSTS
- Rate limit đang lưu in-memory → khi chạy nhiều instance, cần Redis store

### Frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL="https://api.example.com/api" npm run build
npm run start               # next start -p 3000
```

> `NEXT_PUBLIC_API_URL` được nhúng lúc build → phải set **trước** `next build`.

### CI/CD

`.github/workflows/ci.yml` tự chạy khi push/PR lên `main`:
Frontend `typecheck → lint → format:check → build` và Backend `prisma validate → generate → build`.

---

## ⚠️ Hạn chế & hướng phát triển

- **Bài tập tập luyện** đang là dữ liệu tĩnh trong `frontend/src/lib/programs.ts` — chưa có
  model `Exercise` + CRUD quản trị.
- **Phương thức thanh toán hiện có tiền mặt (CASH) + chuyển khoản (BANK_TRANSFER)**; chuyển khoản
  được đối soát qua CASSO (quét Google Sheet định kỳ, khớp nội dung `GYM <MÃ> <MÃ Payment>`), còn
  tiền mặt do `STAFF` / `ADMIN` xác nhận tại quầy. Chưa hỗ trợ cổng thanh toán khác.
- **Gửi email / tin nhắn** chưa tích hợp — thông báo chỉ lưu trong database và hiển thị
  qua chuông + ticker.
- **Chưa có test tự động** (unit/e2e test runner) — kiểm thử hiện dùng smoke test script
  Node.js + Playwright chạy thủ công.
- **Refresh token** chưa triển khai — hết hạn JWT (7 ngày) thì đăng nhập lại.
- Ảnh thumbnail động tĩnh; nên chuyển sang object storage khi chạy thật.

---

## 📚 Cấu trúc commit & tài liệu nội bộ

Commit theo **Conventional Commits**: `feat(frontend): …`, `fix(admin): …`, `ci: …`, `docs: …`.

| Tài liệu | Nội dung |
| :----------------------------------- | :------------------------------------------------------ |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Chuẩn giao diện — đọc trước khi sửa UI |
| [AGENTS.md](AGENTS.md) | Quy ước làm việc, lệnh kiểm tra, bẫy môi trường dev |

---

## 📄 Giấy phép & Tác giả

Đồ án tốt nghiệp — Trường Đại học Lạc Hồng. Toàn quyền thuộc về nhóm tác giả.

````


## 13. module.md — danh sách chức năng theo module

> Nguồn: `module.md`
> Tóm tắt nghiệp vụ 17 nhóm.


````md

# GymShark — Mô tả chức năng (Module)

Dự án quản lý phòng tập gym (Next.js + NestJS + Prisma + SQL Server).

## 1. Xác thực & Quản lý người dùng
- Đăng nhập / Đăng ký (JWT)
- Quên mật khẩu / Đặt lại / Đổi mật khẩu
- Google OAuth
- Phân quyền: ADMIN / STAFF / TRAINER / MEMBER

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
- Yêu cầu chấm dứt hợp đồng: ADMIN đề xuất hoàn tiền theo thời gian và quota PT còn lại → hội viên xác nhận → ADMIN duyệt → ADMIN ghi nhận khoản chi thực tế
- Bảo lưu một lần, tối đa 30 ngày; ADMIN duyệt và gia hạn hợp đồng tương ứng

## 5. Thanh toán & Hóa đơn (Payment + Invoice)
- Thanh toán: tiền mặt (CASH) + chuyển khoản (BANK_TRANSFER, đối soát qua CASSO)
- Tạo hóa đơn (INV-... unique), trạng thái DRAFT / ISSUED / PAID / CANCELLED
- Xác nhận thanh toán: tiền mặt do STAFF/ADMIN xác nhận tại quầy; chuyển khoản khớp qua CASSO hoặc xác nhận thủ công khi chưa khớp
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

````


## 14. Architechture.md — công nghệ & kiến trúc

> Nguồn: `Architechture.md`
> Có nhắc 'Clean Architecture' nhưng cũng nêu rõ 'Mô hình thực tế: Module-based Monolith' — ưu tiên câu sau.


````md

# Công nghệ

* ngôn ngữ lập trình: NestJS 10.3 + TypeScript 5.4 (backend REST API, Swagger /api/docs)
* Database: Microsoft SQL Server 2022, truy cập dữ liệu qua Prisma ORM
* Css: Tailwind CSS v3 (design system 1 palette: nền tối #0B0D0F / sáng #F2F4F0, accent neon #B7FF00; token màu là CSS variables, không dùng class `dark:` thủ công) — font Barlow Condensed (tiêu đề) + Be Vietnam Pro (nội dung), icon `lucide-react`
* Frontend: Next.js 14 (App Router) + TypeScript + React 18 + TanStack Query v5 + Socket.IO client + Axios (interceptor tự gắn JWT)
* Realtime: Socket.IO 4 (`@nestjs/platform-socket.io`) cho chat HLV ↔ hội viên + thông báo
* Xác thực: JWT (Passport) + RBAC theo `UserRole` (ADMIN / STAFF / TRAINER / MEMBER), `bcryptjs` mã hoá mật khẩu
* Bảo mật: `helmet`, `@nestjs/throttler` (global 300 req/60s; login 10/60s; register 5/300s), CORS allowlist, `ValidationPipe` (whitelist + forbidNonWhitelisted), `AllExceptionsFilter` chuẩn hoá lỗi
* Nhận diện khuôn mặt: `@vladmandic/human` 3.3.6 (chạy 100% client-side, trích vector 1024 chiều, cosine similarity, anti-spoof)
* Thư viện UI: shadcn-style component tự viết (`components/ui`) — button, card, input, tabs, dialog, badge, skeleton, empty-state…
* Email: `nodemailer` (xác minh tài khoản, đặt lại mật khẩu)
* Tài liệu API: Swagger / OpenAPI (`@nestjs/swagger`)

# Architechture

* Clean Architechture
* Mô hình thực tế: **Module-based Monolith** (NestJS) — `AppModule` import 31 feature module: auth, health, users, members, trainers, rooms, packages, memberships, checkins, faces, payments, invoices, schedules, notifications, reports, public, member, audit-logs, mail, foods, meal-plans, chat, exercises, programs, class-bookings, body-metrics, casso, equipment, staff-shifts, beverages
* Tầng `common/` dùng chung: `guards/` (JwtAuthGuard, RolesGuard), `decorators/` (@Roles, @Public, @CurrentUser), `filters/` (AllExceptionsFilter), `enums/`
* Mỗi module theo cấu trúc: `controller` (HTTP + WebSocket gateway) → `service` (nghiệp vụ, gọi Prisma) → `dto` (class-validator) → `entity`; service gọi nhau qua `imports` của module
* Lớp truy cập dữ liệu: `PrismaModule` / `PrismaService` (kế thừa `PrismaClient`, `onModuleInit` kết nối) — service không tự query DB trực tiếp ngoài PrismaService
* Audit: `AuditLogsModule` là `@Global()` — `log()` không bao giờ throw, ghi 53 loại hành động (nhãn `AUDIT_ACTION_META`)
* Frontend: Next.js App Router chia theo route group — `(public)`, `(auth)`, `(member)`, `(trainer)`, `(admin)` — mỗi group có layout riêng + middleware phân quyền theo role
* Luồng dữ liệu: Client (Next.js) → Axios (JWT interceptor) → REST `/api/\*` → Controller → Service → Prisma → SQL Server; realtime qua WebSocket (Socket.IO) broadcast từ Gateway về client
* Triển khai: Backend `http://localhost:3001/api` (prefix toàn cục `/api`), Frontend `http://localhost:3000`, baseURL = `NEXT\_PUBLIC\_API\_URL`

````


## 15. DESIGN_SYSTEM.md — chuẩn giao diện

> Nguồn: `DESIGN_SYSTEM.md`
> Nguồn chuẩn cho mục 4.8: 2 theme sáng/tối qua CSS variable, palette, font, component, motion.


````md

# DESIGN SYSTEM — Dark Cinematic + Neon Fitness

Toàn bộ website GymMaster dùng **một** design system. Tài liệu này là nguồn sự thật duy nhất khi sửa/Thêm giao diện.

## 1. Color palette (exact)

| Token | Hex | Dùng cho |
|---|---|---|
| `ink` | `#0B0D0F` | Background toàn site |
| `surface` | `#15191D` | Card / panel / secondary background |
| `neon` | `#B7FF00` | Accent (CTA, active, số liệu quan trọng, icon nhấn) |
| `neon-hover` | `#D0FF4D` | Hover của CTA |
| `chalk` | `#F5F5F5` | Text chính |
| `muted` | `#9AA0A6` | Text phụ / metadata |
| `line` | `#272C31` | Border / divider |
| `danger` | `#FF4545` | Error / destructive |

**Tỷ lệ màu:** ~70% ink · 20% surface · 8% chalk/muted · **2% neon**.

Neon CHỈ dùng cho: CTA button, nav active, progress, số liệu quan trọng, icon nhấn, label nhỏ, hover highlight. **Không bao giờ** làm background lớn, không gradient neon tràn lan, không glow loè loẹt.

Site có **2 theme** (sáng/tối) qua CSS variables — token Tailwind giữ nguyên tên
(`bg-ink`, `text-chalk`, `text-neon`...) nên component KHÔNG cần sửa khi đổi theme.
`:root` = sáng, `.dark` = tối (mặc định). KHÔNG dùng `bg-white`, `bg-slate-*`,
`text-slate-*`, `emerald`, `teal` — màu cứng làm vỡ theme sáng.

## 2. Typography (max 2 font families)

- **Display (H1–H3, số liệu):** `font-display` = Barlow Condensed — bold/extrabold, thường UPPERCASE, `tracking-tight`.
- **Body:** `font-sans` = Be Vietnam Pro (mặc định) — regular/medium/semibold.

Hierarchy:
- H1: `font-display text-[clamp(3rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.95]`
- H2 section: dùng class `.section-title` (`font-display text-4xl sm:text-5xl font-bold uppercase`)
- H3: `font-display text-xl~2xl font-bold uppercase` (card) hoặc `font-bold` (trong app)
- Body: `text-sm/base text-muted leading-relaxed`, giới hạn `max-w-xl` cho đoạn dài
- Metadata: `text-xs text-muted`, label uppercase: class `.meta-label` hoặc `text-[11px] font-semibold uppercase tracking-[0.18em] text-neon/text-muted`

## 3. Utilities có sẵn (globals.css)

- `.container-x` → `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`
- `.section-title` → H2 section chuẩn
- `.meta-label` → label metadata nhỏ (muted); muốn trắng: thêm `!text-chalk`
- `.reveal` + component `<Reveal delay={ms}>` (client) → fade/slide khi cuộn vào viewport
- `animate-fade-in` / `animate-slide-up` / `animate-zoom-in`

## 4. Components (`@/components/ui/...`)

- `Button` — variants: `primary` (neon, text-ink), `secondary`/`outline` (border-line, hover neon), `ghost`, `danger`. **Primary = neon bắt buộc cho CTA chính.**
- `Card`, `CardTitle`, `CardDescription`, `CardContent` — mặc định `bg-surface border border-line rounded-2xl`
- `Badge` — `success` = neon, `destructive` = danger…
- `Input` / `Textarea` / `Select` / `Progress` / `Skeleton` / `Dialog` / `Toast` / `StatCard` (`colorScheme="neon"`)

## 5. Quy tắc layout & UI

1. **Radius:** button/input 10px (`rounded-[10px]`), card 16px (`rounded-2xl`), badge pill. Không trộn kiểu.
2. **Border mọi nơi dùng `border-line`**; hover nhấn `hover:border-neon/40` (mờ, có kiểm soát).
3. **Shadow:** subtle, ví dụ `shadow-[0_1px_2px_rgba(0,0,0,0.35)]`. Không glow mạnh.
4. **Section spacing:** `py-20 lg:py-24`, margin đầu section grid `mt-10~12`.
5. **Grid:** mobile 1 cột → `sm:grid-cols-2 lg:grid-cols-3`. Không overflow ngang (bọc trang bằng `overflow-x-hidden` nếu có phần tử vượt biên).
6. **Ảnh:** luôn có overlay tối (`bg-gradient-to-t from-ink/70`) khi có chữ đè lên; card ảnh `aspect-[16/10]` + `object-cover`; hover zoom `group-hover:scale-105` (transition 500ms).
7. **Motion:** chỉ transform/opacity, ≤500ms, tôn trọng `prefers-reduced-motion` (thường đã có sẵn trong CSS).
8. **Eyebrow:** tối đa 1 nhãn uppercase nhỏ mỗi 3 section. Trang detail thường chỉ có 1 eyebrow ở hero trang.
9. **Icons:** `lucide-react`, outline, kích thước 3.5–5 (`h-4 w-4` … `h-5 w-5`), accent bằng `text-neon` hoặc `text-muted`.
10. **Không emoji** trong UI text.

## 6. Mapping khi sửa code cũ

| Cũ (đừng dùng) | Mới |
|---|---|
| `bg-emerald-600 text-white` (button) | `bg-neon text-ink font-bold` hoặc `<Button>` |
| `text-emerald-600 dark:text-emerald-400` | `text-neon` |
| `bg-emerald-500/10 text-emerald-500` | `bg-neon/10 text-neon` |
| `border-emerald-500/40` | `border-neon/40` |
| `bg-white dark:bg-slate-900` | `bg-surface` |
| `border-slate-200 dark:border-slate-800` | `border-line` |
| `text-slate-900 dark:text-white` | `text-chalk` |
| `text-slate-500 dark:text-slate-400` | `text-muted` |
| `bg-slate-50 dark:bg-slate-950` (input) | `bg-ink` |
| `from-emerald-600 to-teal-400` (gradient card lớn) | `bg-surface border border-neon/30` + điểm nhấn neon (số/icon), **không gradient neon lớn** |
| `shadow-emerald-500/20` | bỏ glow hoặc `shadow-[0_0_24px_-12px_rgba(183,255,0,0.5)]` cho CTA |
| `text-rose-500/600` (error) | `text-danger` |
| `hover:bg-slate-100` | `hover:bg-ink` hoặc `hover:bg-line/40` |

## 7. Ảnh có sẵn (`/public/images`)

| File | Nội dung |
|---|---|
| `hero.jpg` | Battle rope trong garage tối (portrait) |
| `program-push.jpg` · `program-pull.jpg` · `program-upper.jpg` · `program-back-arms.jpg` · `program-shoulders.jpg` · `program-legs-abs.jpg` | 6 ảnh tập luyện dark |
| `article.jpg` | Nữ vận động viên, ánh sáng tối |
| `cta.jpg` | Deadlift gần như đen tuyệt đối (nền chữ) |
| `gym-wide.jpg` | Hàng tạ đơn trong gym |
| `bw-training.jpg` | Trắng đen, gym tối |
| `pullup.jpg` | Trắng đen, tập xà |

Dùng `next/image` với `fill` + `object-cover` trong container có `aspect` sẵn, `sizes` hợp lý.

## 8. Reference implementations

Xem các file này để lấy chuẩn (KHÔNG sửa chúng khi đang làm trang khác):
- `src/app/(public)/page.tsx` + `src/components/home/*` — homepage
- `src/components/layout/public-header.tsx`, `public-footer.tsx`
- `src/app/globals.css`, `tailwind.config.ts`

## 9. Motion (framer-motion) — thêm 2026-10-18

Project đã cài `framer-motion` (v11). Toàn app bọc `<MotionProvider>` (`reducedMotion="user"`
trong root layout) → animation tự tắt khi người dùng bật giảm chuyển động. CSS `Reveal`
vẫn là mặc định cho scroll-reveal; framer-motion dùng cho các trường hợp sau:

- `@/components/ui/motion` — `RevealFx` (fade/slide khi cuộn), `StaggerGroup` + `StaggerItem`
  (**chỉ** cho lưới card ≤8 phần tử; không dùng cho bảng/list dài/form), `AnimatedNumber`
  (count-up số liệu).
- `@/lib/motion` — biến số chung: `EASE`, `fadeUp`, `staggerContainer`, `staggerItem`,
  `viewportOnce`.
- `Dialog` và `Tabs` đã có animation sẵn (AnimatePresence + indicator trượt) — KHÔNG tự
  thêm animation khi dùng chúng.
- Quy tắc: ≤400ms, chỉ transform/opacity, không animate liên tục.

## 10. Trạng thái UI thống nhất — thêm 2026-10-18

- `EmptyState` (`@/components/ui/empty-state`) — icon + title + description + action tuỳ chọn.
  Thay cho các đoạn "Chưa có ..." rải rác.
- `ErrorState` (`@/components/ui/error-state`) — gắn với query lỗi, `onRetry={() => refetch()}`.
- `Spinner` (`@/components/ui/spinner`) — loading inline.
- Skeleton: giữ nguyên, nhưng nên khớp hình dạng nội dung thật (lưới card → lưới skeleton card).

## 11. Three.js (hero 3D) — thêm 2026-10-18

- Đã cài `three@0.171` + `@react-three/fiber@8.18` + `@react-three/drei@9.12` (tương thích React 18).
- Cảnh 3D **chỉ** dùng ở hero trang chủ công khai: `src/components/three/hero-3d.tsx`
  (cục tạ trừu tượng, viền neon, hạt bụi) — dynamic import `ssr:false` trong `hero.tsx`.
- Bắt buộc: chỉ mount khi desktop (≥1024px) + có WebGL + không bật reduced-motion;
  pause khi tab ẩn/cuộn ra xa; không shadow/post-processing; ảnh `hero.jpg` là fallback.
- KHÔNG dùng 3D ở trang quản trị/bảng/modal. Muốn thêm cảnh 3D mới → hỏi lại tôi trước.

````


## 16. CI workflow

> Nguồn: `.github/workflows/ci.yml`
> Các bước typecheck/lint/format/build FE và prisma validate/build BE.


````yaml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  frontend:
    name: Frontend (Next.js)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Build
        run: npm run build

      - name: Unused code check (không chặn PR)
        run: npm run knip
        continue-on-error: true

  backend:
    name: Backend (NestJS)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    env:
      DATABASE_URL: "sqlserver://localhost:1433;database=gym_db;user=sa;password=NotARealPassword123!;encrypt=true;trustServerCertificate=true"
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Validate Prisma schema
        run: npx prisma validate

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Build
        run: npm run build

````


---

## Gợi ý trích dẫn trong báo cáo

- Khi viết mục 3.4.1 (từ điển dữ liệu): trích dẫn `backend/prisma/schema.prisma` và `backend/src/common/constants/db-enums.ts`.

- Khi viết mục 3.4.2 (ERD): chỉ dùng quan hệ trong `schema.prisma`, đặc biệt hành vi `onDelete`: `Cascade` / `SetNull` / `NoAction`.

- Khi viết mục 4.x: trích dẫn tên file/endpoint thật từ `main.ts`, `app.module.ts`, controller/service trong `backend/src/modules`.

- Khi viết mục 5.1: chỉ dùng số liệu trong README.md và ghi rõ '(theo README.md)'; không tự nâng số.
