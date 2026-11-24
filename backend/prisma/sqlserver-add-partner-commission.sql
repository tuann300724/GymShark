-- ===========================================================================
-- Tính năng: Hoa hồng đối tác + ghi nhận lượt tập tại phòng gym đối tác
-- Idempotent — chạy lại nhiều lần an toàn, KHÔNG xóa dữ liệu cũ.
-- Chạy sau sqlserver-add-partner-feature.sql
-- Lưu ý: prisma db execute KHÔNG hỗ trợ GO nên script không dùng GO.
-- ===========================================================================

-- 1) Tỷ lệ hoa hồng cấu hình theo từng đối tác (0.30 = 30%)
IF COL_LENGTH('dbo.Partner', 'commissionRate') IS NULL
  ALTER TABLE dbo.Partner ADD commissionRate DECIMAL(5, 4) NOT NULL CONSTRAINT DF_Partner_commissionRate DEFAULT 0.3000;

-- 2) CheckIn gắn với đối tác nơi hội viên vào tập
IF COL_LENGTH('dbo.CheckIn', 'partnerId') IS NULL
  ALTER TABLE dbo.CheckIn ADD partnerId UNIQUEIDENTIFIER NULL;

-- 3) Snapshot giá/tỷ lệ/thành tiền hoa hồng tại thời điểm check-in
IF COL_LENGTH('dbo.CheckIn', 'unitPrice') IS NULL
  ALTER TABLE dbo.CheckIn ADD unitPrice DECIMAL(12, 2) NULL;
IF COL_LENGTH('dbo.CheckIn', 'commissionRate') IS NULL
  ALTER TABLE dbo.CheckIn ADD commissionRate DECIMAL(5, 4) NULL;
IF COL_LENGTH('dbo.CheckIn', 'commissionAmount') IS NULL
  ALTER TABLE dbo.CheckIn ADD commissionAmount DECIMAL(12, 2) NULL;

-- 4) Ràng buộc & index
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CheckIn_Partner')
  ALTER TABLE dbo.CheckIn ADD CONSTRAINT FK_CheckIn_Partner FOREIGN KEY (partnerId)
    REFERENCES dbo.Partner(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CheckIn_Partner_Time' AND object_id = OBJECT_ID('dbo.CheckIn'))
  CREATE INDEX IX_CheckIn_Partner_Time ON dbo.CheckIn(partnerId, checkInTime);
