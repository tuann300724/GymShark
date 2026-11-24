-- ===========================================================================
-- Tính năng: Đăng ký đối tác phòng gym (Partner) + Chi nhánh đối tác
--            + Gán doanh thu Payment cho đối tác
--
-- CHẠY THỦ CÔNG / idempotent — chạy lại nhiều lần an toàn, KHÔNG xóa dữ liệu cũ.
-- Lưu ý: CSDL hiện dùng UNIQUEIDENTIFIER cho khóa User/Payment dù Prisma khai báo
-- NVARCHAR(100); script dùng UNIQUEIDENTIFIER để khớp dữ liệu thực tế.
-- ===========================================================================

-- 1) Bảng hồ sơ đối tác (1 tài khoản User role = PARTNER → 1 hồ sơ Partner)
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'Partner' AND xtype = 'U')
CREATE TABLE dbo.Partner (
  id          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  userId      UNIQUEIDENTIFIER NOT NULL,
  businessName NVARCHAR(400) NOT NULL,
  taxCode     NVARCHAR(100) NULL,
  phone       NVARCHAR(400) NULL,
  email       NVARCHAR(400) NULL,
  address     NVARCHAR(MAX) NULL,
  status      NVARCHAR(40) NOT NULL DEFAULT N'PENDING',
  notes       NVARCHAR(MAX) NULL,
  createdAt   DATETIME2 NOT NULL DEFAULT GETDATE(),
  updatedAt   DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_Partner_User FOREIGN KEY (userId)
    REFERENCES dbo.[User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Partner_userId' AND object_id = OBJECT_ID('dbo.Partner'))
  CREATE UNIQUE INDEX UQ_Partner_userId ON dbo.Partner(userId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Partner_status' AND object_id = OBJECT_ID('dbo.Partner'))
  CREATE INDEX IX_Partner_status ON dbo.Partner(status);

-- 2) Bảng chi nhánh phòng gym của đối tác
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'PartnerBranch' AND xtype = 'U')
CREATE TABLE dbo.PartnerBranch (
  id          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  partnerId   UNIQUEIDENTIFIER NOT NULL,
  name        NVARCHAR(400) NOT NULL,
  address     NVARCHAR(MAX) NULL,
  phone       NVARCHAR(400) NULL,
  status      NVARCHAR(40) NOT NULL DEFAULT N'ACTIVE',
  latitude    FLOAT NULL,
  longitude   FLOAT NULL,
  notes       NVARCHAR(MAX) NULL,
  createdAt   DATETIME2 NOT NULL DEFAULT GETDATE(),
  updatedAt   DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_PartnerBranch_Partner FOREIGN KEY (partnerId)
    REFERENCES dbo.Partner(id) ON DELETE CASCADE ON UPDATE NO ACTION
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PartnerBranch_partnerId_status' AND object_id = OBJECT_ID('dbo.PartnerBranch'))
  CREATE INDEX IX_PartnerBranch_partnerId_status ON dbo.PartnerBranch(partnerId, status);

-- 3) Gán doanh thu cho đối tác (NULL = doanh thu chung của hệ thống)
IF COL_LENGTH('dbo.Payment', 'partnerId') IS NULL
  ALTER TABLE dbo.Payment ADD partnerId UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Payment_Partner')
  ALTER TABLE dbo.Payment ADD CONSTRAINT FK_Payment_Partner FOREIGN KEY (partnerId)
    REFERENCES dbo.Partner(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payment_Partner_Status_PaidAt' AND object_id = OBJECT_ID('dbo.Payment'))
  CREATE INDEX IX_Payment_Partner_Status_PaidAt ON dbo.Payment(partnerId, status, paidAt);
