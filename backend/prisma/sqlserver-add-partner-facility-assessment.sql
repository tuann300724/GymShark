-- ===========================================================================
-- Tính năng: Ảnh cơ sở vật chất + đánh giá hạng phòng gym đối tác (Gym Cộng đồng)
--
--   * PartnerLead: thêm kết quả đánh giá (assessedTier, assessmentNote, assessedAt, assessedBy)
--   * PartnerLeadPhoto: bảng mới lưu ảnh phòng tập đối tác gửi kèm yêu cầu
--   * Partner: thêm hạng phòng gym (gymTier, tierNote, tierAssessedAt)
--
-- Chỉ THÊM cột/bảng, không xóa/sửa dữ liệu cũ. Script idempotent, chạy lại an toàn.
--
--   npx prisma db execute --file prisma/sqlserver-add-partner-facility-assessment.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51041, 'Refusing to run partner facility assessment migration outside gym_db.', 1;

-- PartnerLead: kết quả đánh giá cơ sở vật chất ------------------------------
IF COL_LENGTH(N'dbo.PartnerLead', N'assessedTier') IS NULL
  ALTER TABLE [dbo].[PartnerLead] ADD [assessedTier] NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.PartnerLead', N'assessmentNote') IS NULL
  ALTER TABLE [dbo].[PartnerLead] ADD [assessmentNote] NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.PartnerLead', N'assessedAt') IS NULL
  ALTER TABLE [dbo].[PartnerLead] ADD [assessedAt] DATETIME2 NULL;
IF COL_LENGTH(N'dbo.PartnerLead', N'assessedBy') IS NULL
  ALTER TABLE [dbo].[PartnerLead] ADD [assessedBy] NVARCHAR(100) NULL;

-- PartnerLeadPhoto ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'PartnerLeadPhoto' AND schema_id = SCHEMA_ID(N'dbo'))
BEGIN
  CREATE TABLE [dbo].[PartnerLeadPhoto] (
    [id]        NVARCHAR(100) NOT NULL,
    [leadId]    NVARCHAR(100) NOT NULL,
    [area]      NVARCHAR(40)  NOT NULL,
    [caption]   NVARCHAR(400) NULL,
    [dataUrl]   NVARCHAR(MAX) NOT NULL,
    [sortOrder] INT           NOT NULL CONSTRAINT [DF_PartnerLeadPhoto_sortOrder] DEFAULT 0,
    [createdAt] DATETIME2     NOT NULL CONSTRAINT [DF_PartnerLeadPhoto_createdAt] DEFAULT GETDATE(),
    CONSTRAINT [PK_PartnerLeadPhoto] PRIMARY KEY ([id]),
    CONSTRAINT [FK_PartnerLeadPhoto_leadId_fkey] FOREIGN KEY ([leadId])
      REFERENCES [dbo].[PartnerLead]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'PartnerLeadPhoto_leadId_idx' AND object_id = OBJECT_ID(N'dbo.PartnerLeadPhoto'))
  CREATE INDEX [PartnerLeadPhoto_leadId_idx] ON [dbo].[PartnerLeadPhoto]([leadId]);

-- Partner: hạng phòng gym -------------------------------------------------------
IF COL_LENGTH(N'dbo.Partner', N'gymTier') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [gymTier] NVARCHAR(40) NULL;
IF COL_LENGTH(N'dbo.Partner', N'tierNote') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [tierNote] NVARCHAR(MAX) NULL;
IF COL_LENGTH(N'dbo.Partner', N'tierAssessedAt') IS NULL
  ALTER TABLE [dbo].[Partner] ADD [tierAssessedAt] DATETIME2 NULL;
