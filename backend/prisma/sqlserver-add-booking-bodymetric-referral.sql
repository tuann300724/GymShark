-- ===========================================================================
-- Tính năng: ClassBooking (đăng ký ca nhóm) + BodyMetric (số đo cơ thể)
--            + Mã giới thiệu (Referral) trên Member
--
-- CHẠY THỦ CÔNG, không dùng `prisma db push`: lệnh push đang bị chặn bởi
-- lệch sẵn có của bảng Conversation (id uniqueidentifier, không có PK) — lỗi
-- có trước, không thuộc thay đổi này. Script này idempotent — chạy lại an toàn.
-- ===========================================================================

-- 1) Sức chứa cho ca nhóm (NULL = buổi 1:1 PT, hội viên không cần đăng ký)
IF COL_LENGTH('TrainingSchedule', 'capacity') IS NULL
  ALTER TABLE TrainingSchedule ADD capacity INT NULL;

-- 2) Bảng đăng ký ca nhóm (mỗi hội viên 1 booking / buổi, hủy = xóa dòng)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'ClassBooking' AND xtype = 'U')
CREATE TABLE ClassBooking (
  id          NVARCHAR(100) PRIMARY KEY,
  scheduleId  UNIQUEIDENTIFIER NOT NULL,
  memberId    UNIQUEIDENTIFIER NOT NULL,
  createdAt   DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_ClassBooking_TrainingSchedule FOREIGN KEY (scheduleId)
    REFERENCES TrainingSchedule(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT FK_ClassBooking_Member FOREIGN KEY (memberId)
    REFERENCES Member(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT UQ_ClassBooking_schedule_member UNIQUE (scheduleId, memberId)
);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ClassBooking_memberId' AND object_id = OBJECT_ID('ClassBooking'))
  CREATE INDEX IX_ClassBooking_memberId ON ClassBooking(memberId);

-- 3) Bảng số đo cơ thể hội viên tự theo dõi
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'BodyMetric' AND xtype = 'U')
CREATE TABLE BodyMetric (
  id              NVARCHAR(100) PRIMARY KEY,
  memberId        UNIQUEIDENTIFIER NOT NULL,
  recordedAt      DATETIME2 NOT NULL DEFAULT GETDATE(),
  weightKg        FLOAT NULL,
  bodyFatPercent  FLOAT NULL,
  waistCm         FLOAT NULL,
  chestCm         FLOAT NULL,
  armCm           FLOAT NULL,
  thighCm         FLOAT NULL,
  note            NVARCHAR(MAX) NULL,
  createdAt       DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_BodyMetric_Member FOREIGN KEY (memberId)
    REFERENCES Member(id) ON DELETE CASCADE ON UPDATE CASCADE
);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BodyMetric_memberId' AND object_id = OBJECT_ID('BodyMetric'))
  CREATE INDEX IX_BodyMetric_memberId ON BodyMetric(memberId);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_BodyMetric_recordedAt' AND object_id = OBJECT_ID('BodyMetric'))
  CREATE INDEX IX_BodyMetric_recordedAt ON BodyMetric(recordedAt);

-- 4) Mã giới thiệu trên Member (mã riêng + người giới thiệu + đã thưởng lần nào)
IF COL_LENGTH('Member', 'referralCode') IS NULL
  ALTER TABLE Member ADD referralCode NVARCHAR(400) NULL;
IF COL_LENGTH('Member', 'referredById') IS NULL
  ALTER TABLE Member ADD referredById UNIQUEIDENTIFIER NULL;
IF COL_LENGTH('Member', 'referralRewardedAt') IS NULL
  ALTER TABLE Member ADD referralRewardedAt DATETIME2 NULL;

-- Sinh mã ngẫu nhiên cho hội viên chưa có (SQL Server unique index chỉ cho
-- phép 1 NULL nên phải điền đủ trước khi tạo unique index)
UPDATE Member
SET referralCode = 'GYM-' + UPPER(SUBSTRING(REPLACE(CAST(NEWID() AS NVARCHAR(36)), '-', ''), 1, 8))
WHERE referralCode IS NULL;

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Member_referralCode' AND object_id = OBJECT_ID('Member'))
  CREATE UNIQUE INDEX UQ_Member_referralCode ON Member(referralCode);

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Member_referredBy')
  ALTER TABLE Member ADD CONSTRAINT FK_Member_referredBy FOREIGN KEY (referredById)
    REFERENCES Member(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
