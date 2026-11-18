SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Migration cho tính năng "Thu hồi tin nhắn" + "Đã gửi / Đã nhận / Đã xem"
-- Idempotent — chạy lại nhiều lần không ảnh hưởng.
IF DB_NAME() <> N'gym_db'
  THROW 51030, 'Refusing to run message recall/delivered migration outside gym_db.', 1;

IF COL_LENGTH(N'dbo.Message', N'recalledAt') IS NULL
  ALTER TABLE [dbo].[Message] ADD [recalledAt] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.Message', N'deliveredAt') IS NULL
  ALTER TABLE [dbo].[Message] ADD [deliveredAt] DATETIME2 NULL;
