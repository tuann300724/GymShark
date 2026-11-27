-- ===========================================================================
-- Tính năng: Admin duyệt ảnh khuôn mặt hội viên tự đăng ký (FaceEmbedding.status)
--
-- CHẠY THỦ CÔNG (không dùng `prisma db push` — DB có drift kiểu ở bảng cũ).
-- Script idempotent, chạy lại an toàn. Dữ liệu cũ được coi là đã duyệt (APPROVED)
-- để hội viên đang dùng Face ID không bị gián đoạn.
--
--   npx prisma db execute --file prisma/sqlserver-add-face-review.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51041, 'Refusing to run face review migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.FaceEmbedding', N'status') IS NULL
  ALTER TABLE [dbo].[FaceEmbedding]
    ADD [status] NVARCHAR(20) NOT NULL
      CONSTRAINT [DF_FaceEmbedding_status] DEFAULT N'APPROVED';

IF COL_LENGTH(N'dbo.FaceEmbedding', N'reviewedAt') IS NULL
  ALTER TABLE [dbo].[FaceEmbedding] ADD [reviewedAt] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.FaceEmbedding', N'reviewedById') IS NULL
  ALTER TABLE [dbo].[FaceEmbedding] ADD [reviewedById] NVARCHAR(100) NULL;

IF COL_LENGTH(N'dbo.FaceEmbedding', N'rejectReason') IS NULL
  ALTER TABLE [dbo].[FaceEmbedding] ADD [rejectReason] NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'FaceEmbedding_status_idx' AND object_id = OBJECT_ID(N'dbo.FaceEmbedding'))
  EXEC(N'CREATE INDEX [FaceEmbedding_status_idx] ON [dbo].[FaceEmbedding]([status])');
