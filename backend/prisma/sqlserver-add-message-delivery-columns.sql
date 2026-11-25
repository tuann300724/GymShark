-- ===========================================================================
-- Bổ sung drift cũ: bảng Message trong DB thiếu 2 cột mà schema Prisma đã
-- khai báo (deliveredAt, recalledAt). Prisma SELECT đủ cột nên mọi thao tác
-- gửi/đọc tin nhắn bị lỗi "The column ... does not exist".
-- Script idempotent, chỉ thêm cột nếu chưa có — không đụng dữ liệu cũ.
-- ===========================================================================
SET NOCOUNT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51032, 'Refusing to run message columns migration outside gym_db.', 1;

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.Message') AND name = N'deliveredAt'
)
  ALTER TABLE [dbo].[Message] ADD [deliveredAt] DATETIME2 NULL;

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.Message') AND name = N'recalledAt'
)
  ALTER TABLE [dbo].[Message] ADD [recalledAt] DATETIME2 NULL;
