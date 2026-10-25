-- LEGACY bootstrap script. It DROPS and recreates gym_db and permanently deletes its data.
-- This schema predates the current backend and is missing models/columns used by the application.
-- Do not run against the existing gym_db. Current backend schema: backend/prisma/schema.prisma.
-- Existing databases must use a reviewed, data-preserving migration instead.

USE master;
GO
IF DB_ID(N'gym_db') IS NOT NULL
BEGIN
    ALTER DATABASE gym_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE gym_db;
END;
GO
CREATE DATABASE gym_db;
GO
USE gym_db;
GO

-- Lookup / Enum tables (PostgreSQL enum chuyển thành bảng tra SQL Server)
CREATE TABLE UserRole (value NVARCHAR(20) PRIMARY KEY); INSERT INTO UserRole VALUES('ADMIN'),('MANAGER'),('STAFF'),('TRAINER'),('MEMBER');
CREATE TABLE UserStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO UserStatus VALUES('ACTIVE'),('INACTIVE'),('SUSPENDED');
CREATE TABLE Gender (value NVARCHAR(10) PRIMARY KEY); INSERT INTO Gender VALUES('MALE'),('FEMALE'),('OTHER');
CREATE TABLE MemberStatusTbl (value NVARCHAR(20) PRIMARY KEY); INSERT INTO MemberStatusTbl VALUES('ACTIVE'),('INACTIVE'),('EXPIRED'),('SUSPENDED');
CREATE TABLE MembershipStatusTbl (value NVARCHAR(20) PRIMARY KEY); INSERT INTO MembershipStatusTbl VALUES('PENDING'),('ACTIVE'),('EXPIRED'),('CANCELLED'),('SUSPENDED');
CREATE TABLE TrainerStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO TrainerStatus VALUES('ACTIVE'),('INACTIVE'),('ON_LEAVE');
CREATE TABLE PackageType (value NVARCHAR(20) PRIMARY KEY); INSERT INTO PackageType VALUES('FIXED_TERM'),('SESSION_BASED');
CREATE TABLE CheckInMethod (value NVARCHAR(20) PRIMARY KEY); INSERT INTO CheckInMethod VALUES('MANUAL'),('QR_CODE'),('STAFF'),('FACE_ID');
CREATE TABLE CheckInStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO CheckInStatus VALUES('CHECKED_IN'),('CHECKED_OUT');
CREATE TABLE ScheduleStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO ScheduleStatus VALUES('SCHEDULED'),('COMPLETED'),('CANCELLED'),('NO_SHOW');
CREATE TABLE SessionType (value NVARCHAR(30) PRIMARY KEY); INSERT INTO SessionType VALUES('PERSONAL_TRAINING'),('GROUP_CLASS'),('FREE_TRAINING');
CREATE TABLE TrainerMemberStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO TrainerMemberStatus VALUES('ACTIVE'),('INACTIVE');
CREATE TABLE DiscountType (value NVARCHAR(20) PRIMARY KEY); INSERT INTO DiscountType VALUES('PERCENTAGE'),('FIXED_AMOUNT');
CREATE TABLE RoomType (value NVARCHAR(20) PRIMARY KEY); INSERT INTO RoomType VALUES('GYM_AREA'),('CARDIO'),('WEIGHT_AREA'),('GROUP_CLASS'),('PERSONAL_TRAINING'),('YOGA'),('OTHER');
CREATE TABLE RoomStatus (value NVARCHAR(20) PRIMARY KEY); INSERT INTO RoomStatus VALUES('AVAILABLE'),('IN_USE'),('UNDER_MAINTENANCE'),('CLOSED');
CREATE TABLE PaymentMethodTbl (value NVARCHAR(20) PRIMARY KEY); INSERT INTO PaymentMethodTbl VALUES('CASH'),('CREDIT_CARD'),('BANK_TRANSFER'),('MOMO'),('VNPAY');
CREATE TABLE PaymentStatusTbl (value NVARCHAR(20) PRIMARY KEY); INSERT INTO PaymentStatusTbl VALUES('PENDING'),('PAID'),('FAILED'),('CANCELLED'),('REFUNDED');
CREATE TABLE InvoiceStatusTbl (value NVARCHAR(20) PRIMARY KEY); INSERT INTO InvoiceStatusTbl VALUES('DRAFT'),('ISSUED'),('PAID'),('CANCELLED');

-- User (tài khoản)
CREATE TABLE [User] (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) UNIQUE NOT NULL,
  passwordHash NVARCHAR(500) NOT NULL,
  fullName NVARCHAR(255) NOT NULL,
  phone NVARCHAR(50) NULL,
  role NVARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  avatarUrl NVARCHAR(500) NULL,
  provider NVARCHAR(50) DEFAULT 'LOCAL',
  providerId NVARCHAR(200) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_User_Role FOREIGN KEY (role) REFERENCES UserRole(value),
  CONSTRAINT FK_User_Status FOREIGN KEY (status) REFERENCES UserStatus(value)
);

CREATE UNIQUE INDEX UX_User_Phone_NotNull ON [User](phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX UX_User_ProviderId_NotNull ON [User](providerId) WHERE providerId IS NOT NULL;

-- Trainer (huấn luyện viên)
CREATE TABLE Trainer (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  userId UNIQUEIDENTIFIER NOT NULL UNIQUE,
  specialization NVARCHAR(255) NOT NULL,
  certification NVARCHAR(500) NULL,
  experienceYears INT DEFAULT 1,
  bio NVARCHAR(MAX) NULL,
  gender NVARCHAR(10) NULL,
  dateOfBirth DATETIME2 NULL,
  rating FLOAT DEFAULT 5.0,
  hourlyRate DECIMAL(10,2) NULL,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Trainer_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
  CONSTRAINT FK_Trainer_Status FOREIGN KEY (status) REFERENCES TrainerStatus(value)
);
CREATE INDEX IX_Trainer_UserId ON Trainer(userId);
CREATE INDEX IX_Trainer_Status ON Trainer(status);

-- Branch (chi nhánh / phòng)
CREATE TABLE Branch (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) UNIQUE NOT NULL,
  address NVARCHAR(500) NULL,
  phone NVARCHAR(50) NULL,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Branch_Status FOREIGN KEY (status) REFERENCES UserStatus(value)
);

-- Room (phòng)
CREATE TABLE Room (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  code NVARCHAR(20) NULL,
  name NVARCHAR(255) NOT NULL,
  type NVARCHAR(20) DEFAULT 'GYM_AREA',
  capacity INT DEFAULT 20,
  floor NVARCHAR(10) NULL,
  description NVARCHAR(MAX) NULL,
  status NVARCHAR(20) DEFAULT 'AVAILABLE',
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Room_Type FOREIGN KEY (type) REFERENCES RoomType(value),
  CONSTRAINT FK_Room_Status FOREIGN KEY (status) REFERENCES RoomStatus(value)
);
CREATE INDEX IX_Room_Type ON Room(type);
CREATE INDEX IX_Room_Status ON Room(status);

CREATE UNIQUE INDEX UX_Room_Code_NotNull ON Room(code) WHERE code IS NOT NULL;

-- Member (hội viên)
CREATE TABLE Member (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  code NVARCHAR(20) UNIQUE NOT NULL,
  userId UNIQUEIDENTIFIER NULL,
  branchId UNIQUEIDENTIFIER NULL,
  fullName NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) NULL,
  phone NVARCHAR(50) NOT NULL,
  gender NVARCHAR(10) NULL,
  dateOfBirth DATE NULL,
  address NVARCHAR(500) NULL,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  notes NVARCHAR(MAX) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Member_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE SET NULL,
  CONSTRAINT FK_Member_Branch FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL,
  CONSTRAINT FK_Member_Gender FOREIGN KEY (gender) REFERENCES Gender(value),
  CONSTRAINT FK_Member_Status FOREIGN KEY (status) REFERENCES MemberStatusTbl(value)
);
CREATE INDEX IX_Member_Code ON Member(code);
CREATE INDEX IX_Member_UserId ON Member(userId);
CREATE INDEX IX_Member_Status ON Member(status);

CREATE UNIQUE INDEX UX_Member_UserId_NotNull ON Member(userId) WHERE userId IS NOT NULL;

-- Membership (gói hội viên)
CREATE TABLE Membership (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  packageType NVARCHAR(20) DEFAULT 'FIXED_TERM',
  status NVARCHAR(20) DEFAULT 'PENDING',
  startDate DATE NULL,
  endDate DATE NULL,
  price DECIMAL(12,2) DEFAULT 0,
  note NVARCHAR(500) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Membership_Member FOREIGN KEY (memberId) REFERENCES Member(id),
  CONSTRAINT FK_Membership_Type FOREIGN KEY (packageType) REFERENCES PackageType(value),
  CONSTRAINT FK_Membership_Status FOREIGN KEY (status) REFERENCES MembershipStatusTbl(value)
);
CREATE INDEX IX_Membership_MemberId ON Membership(memberId);
CREATE INDEX IX_Membership_Status ON Membership(status);

-- MembershipPackage (gói mẫu)
CREATE TABLE MembershipPackage (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) UNIQUE NOT NULL,
  description NVARCHAR(1000) NULL,
  durationDays INT DEFAULT 30,
  sessionCount INT DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  isActive BIT DEFAULT 1,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE()
);

-- CheckIn (lượt tập)
CREATE TABLE CheckIn (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  method NVARCHAR(20) DEFAULT 'MANUAL',
  checkInTime DATETIME2 DEFAULT GETDATE(),
  checkOutTime DATETIME2 NULL,
  status NVARCHAR(20) DEFAULT 'CHECKED_IN',
  note NVARCHAR(1000) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_CheckIn_Member FOREIGN KEY (memberId) REFERENCES Member(id),
  CONSTRAINT FK_CheckIn_Method FOREIGN KEY (method) REFERENCES CheckInMethod(value),
  CONSTRAINT FK_CheckIn_Status FOREIGN KEY (status) REFERENCES CheckInStatus(value)
);
CREATE INDEX IX_CheckIn_MemberId ON CheckIn(memberId);
CREATE INDEX IX_CheckIn_Status ON CheckIn(status);

-- FaceEmbedding (sinh trắc học)
CREATE TABLE FaceEmbedding (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  embedding NVARCHAR(MAX) NULL,
  imageData NVARCHAR(MAX) NULL,
  consentAt DATETIME2 NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Face_Member FOREIGN KEY (memberId) REFERENCES Member(id)
);
CREATE INDEX IX_Face_MemberId ON FaceEmbedding(memberId);

-- Payment (thanh toán)
CREATE TABLE Payment (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  method NVARCHAR(20) NULL,
  status NVARCHAR(20) DEFAULT 'PENDING',
  currency NVARCHAR(10) DEFAULT 'VND',
  transactionRef NVARCHAR(200) NULL,
  confirmedById UNIQUEIDENTIFIER NULL,
  paidAt DATETIME2 NULL,
  note NVARCHAR(500) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Payment_Member FOREIGN KEY (memberId) REFERENCES Member(id),
  CONSTRAINT FK_Payment_Confirm FOREIGN KEY (confirmedById) REFERENCES [User](id),
  CONSTRAINT FK_Payment_Method FOREIGN KEY (method) REFERENCES PaymentMethodTbl(value),
  CONSTRAINT FK_Payment_Status FOREIGN KEY (status) REFERENCES PaymentStatusTbl(value)
);
CREATE INDEX IX_Payment_MemberId ON Payment(memberId);
CREATE INDEX IX_Payment_TransactionRef ON Payment(transactionRef);

CREATE UNIQUE INDEX UX_Payment_TransactionRef_NotNull ON Payment(transactionRef) WHERE transactionRef IS NOT NULL;

-- Invoice (hóa đơn)
CREATE TABLE Invoice (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  code NVARCHAR(50) UNIQUE NOT NULL,
  status NVARCHAR(20) DEFAULT 'DRAFT',
  amount DECIMAL(12,2) DEFAULT 0,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Invoice_Member FOREIGN KEY (memberId) REFERENCES Member(id),
  CONSTRAINT FK_Invoice_Status FOREIGN KEY (status) REFERENCES InvoiceStatusTbl(value)
);
CREATE INDEX IX_Invoice_Code ON Invoice(code);
CREATE INDEX IX_Invoice_MemberId ON Invoice(memberId);

-- TrainingSchedule (lịch tập)
CREATE TABLE TrainingSchedule (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  roomId UNIQUEIDENTIFIER NULL,
  trainerId UNIQUEIDENTIFIER NULL,
  sessionType NVARCHAR(30) DEFAULT 'GROUP_CLASS',
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(1000) NULL,
  startTime DATETIME2 NOT NULL,
  endTime DATETIME2 NOT NULL,
  status NVARCHAR(20) DEFAULT 'SCHEDULED',
  maxParticipants INT DEFAULT 0,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Schedule_Room FOREIGN KEY (roomId) REFERENCES Room(id) ON DELETE SET NULL,
  CONSTRAINT FK_Schedule_Trainer FOREIGN KEY (trainerId) REFERENCES Trainer(id) ON DELETE SET NULL,
  CONSTRAINT FK_Schedule_SessionType FOREIGN KEY (sessionType) REFERENCES SessionType(value),
  CONSTRAINT FK_Schedule_Status FOREIGN KEY (status) REFERENCES ScheduleStatus(value)
);
CREATE INDEX IX_Schedule_RoomId ON TrainingSchedule(roomId);
CREATE INDEX IX_Schedule_TrainerId ON TrainingSchedule(trainerId);
CREATE INDEX IX_Schedule_Status ON TrainingSchedule(status);

-- TrainingProgress (tiến độ tập)
CREATE TABLE TrainingProgress (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  trainerId UNIQUEIDENTIFIER NOT NULL,
  sessionType NVARCHAR(30) DEFAULT 'PERSONAL_TRAINING',
  date DATE DEFAULT GETDATE(),
  durationMinutes INT DEFAULT 60,
  notes NVARCHAR(1000) NULL,
  caloriesBurned INT DEFAULT 0,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Progress_Member FOREIGN KEY (memberId) REFERENCES Member(id),
  CONSTRAINT FK_Progress_Trainer FOREIGN KEY (trainerId) REFERENCES Trainer(id),
  CONSTRAINT FK_Progress_SessionType FOREIGN KEY (sessionType) REFERENCES SessionType(value)
);
CREATE INDEX IX_Progress_MemberId ON TrainingProgress(memberId);
CREATE INDEX IX_Progress_TrainerId ON TrainingProgress(trainerId);

-- TrainerMember (gán PT cho hội viên)
CREATE TABLE TrainerMember (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  trainerId UNIQUEIDENTIFIER NOT NULL,
  memberId UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  assignedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_TM_Trainer FOREIGN KEY (trainerId) REFERENCES Trainer(id) ON DELETE CASCADE,
  CONSTRAINT FK_TM_Member FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE CASCADE,
  CONSTRAINT FK_TM_Status FOREIGN KEY (status) REFERENCES TrainerMemberStatus(value)
);
CREATE INDEX IX_TrainerMember_TrainerId ON TrainerMember(trainerId);
CREATE INDEX IX_TrainerMember_MemberId ON TrainerMember(memberId);

-- Notification (thông báo)
CREATE TABLE Notification (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(255) NOT NULL,
  content NVARCHAR(1000) NOT NULL,
  type NVARCHAR(30) DEFAULT 'GENERAL',
  link NVARCHAR(500) NULL,
  referenceType NVARCHAR(50) NULL,
  referenceId NVARCHAR(200) NULL,
  isRead BIT DEFAULT 0,
  createdAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Notification_Member FOREIGN KEY (memberId) REFERENCES Member(id)
);
CREATE INDEX IX_Notification_MemberId ON Notification(memberId);
CREATE INDEX IX_Notification_IsRead ON Notification(isRead);

-- Promotion (khuyến mãi)
CREATE TABLE Promotion (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  code NVARCHAR(50) UNIQUE NOT NULL,
  name NVARCHAR(255) NOT NULL,
  description NVARCHAR(1000) NULL,
  discountType NVARCHAR(20) DEFAULT 'PERCENTAGE',
  discountValue DECIMAL(10,2) DEFAULT 0,
  minOrderValue DECIMAL(12,2) DEFAULT 0,
  maxDiscount DECIMAL(12,2) NULL,
  usageLimit INT DEFAULT 0,
  usageCount INT DEFAULT 0,
  startDate DATETIME2 DEFAULT GETDATE(),
  endDate DATETIME2 NULL,
  isActive BIT DEFAULT 1,
  perMemberLimit INT DEFAULT 1,
  branchId UNIQUEIDENTIFIER NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Promotion_DiscountType FOREIGN KEY (discountType) REFERENCES DiscountType(value),
  CONSTRAINT FK_Promotion_Branch FOREIGN KEY (branchId) REFERENCES Branch(id) ON DELETE SET NULL
);
CREATE INDEX IX_Promotion_Code ON Promotion(code);
CREATE INDEX IX_Promotion_IsActive ON Promotion(isActive);

-- AuditLog
CREATE TABLE AuditLog (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  userId UNIQUEIDENTIFIER NULL,
  action NVARCHAR(50) NOT NULL,
  entity NVARCHAR(50) NULL,
  entityId NVARCHAR(200) NULL,
  metadata NVARCHAR(MAX) NULL,
  createdAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Audit_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE SET NULL
);
CREATE INDEX IX_Audit_UserId ON AuditLog(userId);
CREATE INDEX IX_Audit_Action ON AuditLog(action);
CREATE INDEX IX_Audit_EntityId ON AuditLog(entityId);

-- Message / Conversation (chat nội bộ)
CREATE TABLE Conversation (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  memberId UNIQUEIDENTIFIER NULL,
  trainerId UNIQUEIDENTIFIER NULL,
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Conv_Member FOREIGN KEY (memberId) REFERENCES Member(id) ON DELETE SET NULL,
  CONSTRAINT FK_Conv_Trainer FOREIGN KEY (trainerId) REFERENCES Trainer(id) ON DELETE SET NULL
);

CREATE TABLE Message (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  conversationId UNIQUEIDENTIFIER NOT NULL,
  senderId UNIQUEIDENTIFIER NOT NULL,
  receiverId UNIQUEIDENTIFIER NOT NULL,
  content NVARCHAR(2000) NOT NULL,
  isRead BIT DEFAULT 0,
  createdAt DATETIME2 DEFAULT GETDATE(),
  CONSTRAINT FK_Message_Conv FOREIGN KEY (conversationId) REFERENCES Conversation(id) ON DELETE CASCADE,
  CONSTRAINT FK_Message_Sender FOREIGN KEY (senderId) REFERENCES [User](id),
  CONSTRAINT FK_Message_Receiver FOREIGN KEY (receiverId) REFERENCES [User](id)
);
CREATE INDEX IX_Message_ConvId ON Message(conversationId);
CREATE INDEX IX_Message_SenderId ON Message(senderId);

GO

-- =========================================================
-- DATA MẪU ĐÃ SỬA: chạy sau khi tạo xong toàn bộ bảng
-- Lưu ý: script tạo database/bảng chỉ nên chạy một lần trên DB mới.
-- =========================================================

DECLARE @UserAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @UserMember UNIQUEIDENTIFIER = NEWID();
DECLARE @UserStaff UNIQUEIDENTIFIER = NEWID();
DECLARE @UserTrainer UNIQUEIDENTIFIER = NEWID();
DECLARE @Branch1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Branch2 UNIQUEIDENTIFIER = NEWID();
DECLARE @TrainerId UNIQUEIDENTIFIER = NEWID();
DECLARE @Member1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Member2 UNIQUEIDENTIFIER = NEWID();
DECLARE @Member3 UNIQUEIDENTIFIER = NEWID();
DECLARE @Room1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Room2 UNIQUEIDENTIFIER = NEWID();

-- TAI KHOAN DEMO (passwordHash la BCrypt; backend phai verify bang BCrypt)
-- Admin:    admin@gymshark.com / Admin@12345
-- Member:   test1@gym.local   / Member@12345
-- Staff:    staff@gym.local   / Staff@12345
-- Trainer:  trainer@gym.local / Trainer@12345
INSERT INTO [User] (id, email, passwordHash, fullName, role, status, createdAt, updatedAt)
VALUES
(@UserMember, N'test1@gym.local', N'$2b$10$AQI4HYfDu6HrfQM2kaIWw.aZoUVNgf1T/g4xKVrM1pT/UrcKi0dT2', N'Lê Hoàng Anh', N'MEMBER', N'ACTIVE', GETDATE(), GETDATE()),
(@UserStaff, N'staff@gym.local', N'$2b$10$v.B/QFQZC5I5jUAWM4jBX.BXBzPA7pLWqMbcXorI0BUPjswCgV4sO', N'Trần Thị Bình', N'STAFF', N'ACTIVE', GETDATE(), GETDATE()),
(@UserTrainer, N'trainer@gym.local', N'$2b$10$F9svRQu.ALCEXkAK2f8L7u5Y0glMe9JAfCFZC8nLFj46ngBrgIR6i', N'Phạm Văn Cường', N'TRAINER', N'ACTIVE', GETDATE(), GETDATE()),
(@UserAdmin, N'admin@gymshark.com', N'$2b$10$sNhRaGzlKc/WufCOJ2vFIuzNA70JKAbIpTj5z2SStaXtMnKgQuqHm', N'Quản trị viên', N'ADMIN', N'ACTIVE', GETDATE(), GETDATE());

-- Chi nhánh
INSERT INTO Branch (id, name, address, status)
VALUES
(@Branch1, N'Chi nhánh Quận 1', N'TP. Hồ Chí Minh', N'ACTIVE'),
(@Branch2, N'Chi nhánh Quận 2', N'TP. Hồ Chí Minh', N'ACTIVE');

-- Huấn luyện viên: phải tạo trước TrainingProgress và TrainerMember
INSERT INTO Trainer (id, userId, specialization, certification, experienceYears, gender, status)
VALUES (@TrainerId, @UserTrainer, N'Cardio', N'Chứng chỉ huấn luyện viên', 3, N'MALE', N'ACTIVE');

-- Hội viên: code duy nhất, phone bắt buộc
INSERT INTO Member (id, code, userId, branchId, fullName, email, phone, gender, status)
VALUES
(@Member1, N'MEM-0001', @UserMember, @Branch1, N'Lê Hoàng Anh', N'test1@gym.local', N'0900000001', N'MALE', N'ACTIVE'),
(@Member2, N'MEM-0002', NULL, @Branch1, N'Phạm Thị Ngọc', N'member2@gym.local', N'0900000002', N'FEMALE', N'ACTIVE'),
(@Member3, N'MEM-0003', NULL, @Branch2, N'Vũ Đức Thành', N'member3@gym.local', N'0900000003', N'MALE', N'ACTIVE');

-- Gói hội viên mẫu
INSERT INTO MembershipPackage (id, name, description, durationDays, sessionCount, price, isActive)
VALUES
(NEWID(), N'Gói 30 ngày', N'Gói tập cơ bản 30 ngày', 30, 0, 299000, 1),
(NEWID(), N'Gói 60 ngày', N'Gói tập 60 ngày', 60, 0, 499000, 1);

INSERT INTO Membership (id, memberId, packageType, status, startDate, endDate, price, note)
VALUES
(NEWID(), @Member1, N'FIXED_TERM', N'ACTIVE', CAST(GETDATE() AS DATE), DATEADD(DAY, 30, CAST(GETDATE() AS DATE)), 299000, N'Gói 30 ngày'),
(NEWID(), @Member2, N'FIXED_TERM', N'PENDING', NULL, NULL, 499000, N'Chờ kích hoạt');

-- Điểm danh
INSERT INTO CheckIn (id, memberId, method, checkInTime, status)
VALUES
(NEWID(), @Member1, N'FACE_ID', DATEADD(HOUR, -2, GETDATE()), N'CHECKED_IN'),
(NEWID(), @Member2, N'MANUAL', GETDATE(), N'CHECKED_IN');

-- Thanh toán và hóa đơn
INSERT INTO Payment (id, memberId, amount, method, status, currency, transactionRef, paidAt)
VALUES
(NEWID(), @Member1, 299000, N'CASH', N'PAID', N'VND', N'REF-001', GETDATE()),
(NEWID(), @Member2, 250000, N'BANK_TRANSFER', N'PAID', N'VND', N'REF-002', GETDATE()),
(NEWID(), @Member3, 120000, N'MOMO', N'PAID', N'VND', N'REF-003', GETDATE());

INSERT INTO Invoice (id, memberId, code, status, amount)
VALUES
(NEWID(), @Member1, N'INV-2026-1001', N'PAID', 299000),
(NEWID(), @Member2, N'INV-2026-1002', N'PAID', 250000);

-- Thông báo
INSERT INTO Notification (id, memberId, title, content, isRead)
VALUES
(NEWID(), @Member1, N'Chào mừng', N'Chào bạn đến với phòng gym!', 0),
(NEWID(), @Member2, N'Khuyến mãi', N'Ưu đãi dành cho hội viên.', 0);

-- Nhật ký hoạt động và dữ liệu nhận diện (dữ liệu giả lập)
INSERT INTO AuditLog (id, userId, action, entity, createdAt)
VALUES
(NEWID(), @UserStaff, N'MEMBER_CREATE', N'Member', GETDATE()),
(NEWID(), @UserStaff, N'CHECK_IN', N'CheckIn', GETDATE());


INSERT INTO FaceEmbedding (id, memberId, consentAt)
VALUES (NEWID(), @Member1, GETDATE());

-- Phòng tập
INSERT INTO Room (id, code, name, type, capacity, status)
VALUES
(@Room1, N'R-01', N'Phòng Cardio', N'CARDIO', 20, N'AVAILABLE'),
(@Room2, N'R-02', N'Phòng tập PT', N'PERSONAL_TRAINING', 10, N'AVAILABLE');

-- Lịch tập: startTime/endTime là NOT NULL nên phải cung cấp
INSERT INTO TrainingSchedule (id, roomId, trainerId, sessionType, title, description, startTime, endTime, status, maxParticipants)
VALUES
(NEWID(), @Room1, @TrainerId, N'PERSONAL_TRAINING', N'PT buổi sáng', N'Buổi tập cá nhân', DATEADD(HOUR, 1, GETDATE()), DATEADD(HOUR, 2, GETDATE()), N'SCHEDULED', 1),
(NEWID(), @Room2, @TrainerId, N'GROUP_CLASS', N'Lớp tập buổi tối', N'Lớp tập nhóm', DATEADD(HOUR, 3, GETDATE()), DATEADD(HOUR, 4, GETDATE()), N'SCHEDULED', 10);

-- Tiến độ tập: trainerId là NOT NULL, dùng huấn luyện viên đã tạo
INSERT INTO TrainingProgress (id, memberId, trainerId, sessionType, date, durationMinutes, notes, caloriesBurned)
VALUES
(NEWID(), @Member1, @TrainerId, N'PERSONAL_TRAINING', CAST(GETDATE() AS DATE), 60, N'Buổi tập đầu tiên', 300),
(NEWID(), @Member2, @TrainerId, N'PERSONAL_TRAINING', CAST(GETDATE() AS DATE), 45, N'Tập cardio', 220);

-- Gán huấn luyện viên cho hội viên
INSERT INTO TrainerMember (id, trainerId, memberId, status)
VALUES
(NEWID(), @TrainerId, @Member1, N'ACTIVE'),
(NEWID(), @TrainerId, @Member2, N'ACTIVE');

-- Khuyến mãi
INSERT INTO Promotion (id, code, name, discountType, discountValue, minOrderValue, isActive)
VALUES
(NEWID(), N'PROMO10', N'Giảm 10%', N'PERCENTAGE', 10, 0, 1),
(NEWID(), N'PROMO50K', N'Giảm 50.000 đồng', N'FIXED_AMOUNT', 50000, 0, 1);

GO
