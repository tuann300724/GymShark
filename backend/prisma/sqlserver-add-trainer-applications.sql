-- ===========================================================================
-- Tính năng: PT tự do gửi đơn đăng ký (kèm ảnh bằng cấp) → admin duyệt → tạo tài khoản
--            + PT sửa hồ sơ công khai phải qua admin duyệt (bản nháp).
--
--   TrainerApplication / TrainerApplicationDocument — đơn đăng ký PT (chưa có tài khoản)
--   UserAvatar               — ảnh đại diện tải lên, phục vụ qua GET /api/public/avatars/:userId
--   Trainer.source            — ADMIN | SELF (tạo từ đơn PT được duyệt)
--   Trainer.pendingProfile + profile* — bản nháp chỉnh sửa hồ sơ chờ duyệt
--
-- CHẠY THỦ CÔNG (không dùng `prisma db push` — DB có drift kiểu ở bảng cũ).
-- Script idempotent, chạy lại an toàn. PT hiện có giữ nguyên (source = ADMIN).
--
--   npx prisma db execute --file prisma/sqlserver-add-trainer-applications.sql --schema prisma/schema.prisma
--   npx prisma generate
-- ===========================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51042, 'Refusing to run trainer application migration outside gym_db.', 1;

-- ---------------------------------------------------------------------------
-- Trainer: nguồn tạo + bản nháp chỉnh sửa hồ sơ
-- ---------------------------------------------------------------------------
IF COL_LENGTH(N'dbo.Trainer', N'source') IS NULL
  ALTER TABLE [dbo].[Trainer]
    ADD [source] NVARCHAR(20) NOT NULL
      CONSTRAINT [DF_Trainer_source] DEFAULT N'ADMIN';

IF COL_LENGTH(N'dbo.Trainer', N'pendingProfile') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [pendingProfile] NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.Trainer', N'profileReviewStatus') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [profileReviewStatus] NVARCHAR(20) NULL;

IF COL_LENGTH(N'dbo.Trainer', N'profileSubmittedAt') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [profileSubmittedAt] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.Trainer', N'profileReviewedAt') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [profileReviewedAt] DATETIME2 NULL;

IF COL_LENGTH(N'dbo.Trainer', N'profileRejectReason') IS NULL
  ALTER TABLE [dbo].[Trainer] ADD [profileRejectReason] NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'Trainer_profileReviewStatus_idx' AND object_id = OBJECT_ID(N'dbo.Trainer'))
  EXEC(N'CREATE INDEX [Trainer_profileReviewStatus_idx] ON [dbo].[Trainer]([profileReviewStatus])');

-- Bản nháp đầu của tính năng từng thêm 3 cột duyệt ngay trên Trainer — nay chuyển sang
-- bảng TrainerApplication nên gỡ đi (chỉ là cột NULL, không có ràng buộc).
IF COL_LENGTH(N'dbo.Trainer', N'reviewedAt') IS NOT NULL
  ALTER TABLE [dbo].[Trainer] DROP COLUMN [reviewedAt];
IF COL_LENGTH(N'dbo.Trainer', N'reviewedById') IS NOT NULL
  ALTER TABLE [dbo].[Trainer] DROP COLUMN [reviewedById];
IF COL_LENGTH(N'dbo.Trainer', N'rejectReason') IS NOT NULL
  ALTER TABLE [dbo].[Trainer] DROP COLUMN [rejectReason];

-- ---------------------------------------------------------------------------
-- Đơn đăng ký PT tự do
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.TrainerApplication', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[TrainerApplication] (
    [id]              NVARCHAR(100)  NOT NULL,
    [fullName]        NVARCHAR(400)  NOT NULL,
    [email]           NVARCHAR(400)  NOT NULL,
    [phone]           NVARCHAR(400)  NOT NULL,
    [gender]          NVARCHAR(40)   NULL,
    [specialization]  NVARCHAR(400)  NOT NULL,
    [certification]   NVARCHAR(400)  NULL,
    [experienceYears] INT            NOT NULL CONSTRAINT [TrainerApplication_experienceYears_df] DEFAULT 0,
    [bio]             NVARCHAR(MAX)  NOT NULL,
    [hourlyRate]      DECIMAL(10, 2) NULL,
    [avatarUrl]       NVARCHAR(400)  NULL,
    [status]          NVARCHAR(20)   NOT NULL CONSTRAINT [TrainerApplication_status_df] DEFAULT N'PENDING',
    [rejectReason]    NVARCHAR(500)  NULL,
    [reviewedAt]      DATETIME2      NULL,
    [reviewedById]    NVARCHAR(100)  NULL,
    [trainerId]       NVARCHAR(100)  NULL,
    [ip]              NVARCHAR(100)  NULL,
    [createdAt]       DATETIME2      NOT NULL CONSTRAINT [TrainerApplication_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]       DATETIME2      NOT NULL,
    CONSTRAINT [TrainerApplication_pkey] PRIMARY KEY CLUSTERED ([id])
  );
  CREATE INDEX [TrainerApplication_status_idx] ON [dbo].[TrainerApplication]([status]);
  CREATE INDEX [TrainerApplication_email_idx] ON [dbo].[TrainerApplication]([email]);
  CREATE INDEX [TrainerApplication_createdAt_idx] ON [dbo].[TrainerApplication]([createdAt]);
END;

IF OBJECT_ID(N'dbo.TrainerApplicationDocument', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[TrainerApplicationDocument] (
    [id]            NVARCHAR(100) NOT NULL,
    [applicationId] NVARCHAR(100) NOT NULL,
    [caption]       NVARCHAR(400) NULL,
    [dataUrl]       NVARCHAR(MAX) NOT NULL,
    [sortOrder]     INT           NOT NULL CONSTRAINT [TrainerApplicationDocument_sortOrder_df] DEFAULT 0,
    [createdAt]     DATETIME2     NOT NULL CONSTRAINT [TrainerApplicationDocument_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TrainerApplicationDocument_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TrainerApplicationDocument_applicationId_fkey] FOREIGN KEY ([applicationId])
      REFERENCES [dbo].[TrainerApplication]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
  );
  CREATE INDEX [TrainerApplicationDocument_applicationId_idx] ON [dbo].[TrainerApplicationDocument]([applicationId]);
END;

-- Ảnh đại diện PT tải lên: đơn lưu data URL (MAX), ảnh đã duyệt lưu ở UserAvatar
IF EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'dbo.TrainerApplication') AND name = N'avatarUrl' AND max_length <> -1
)
  ALTER TABLE [dbo].[TrainerApplication] ALTER COLUMN [avatarUrl] NVARCHAR(MAX) NULL;

IF OBJECT_ID(N'dbo.UserAvatar', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[UserAvatar] (
    [userId]    NVARCHAR(100) NOT NULL,
    [dataUrl]   NVARCHAR(MAX) NOT NULL,
    [updatedAt] DATETIME2     NOT NULL,
    CONSTRAINT [UserAvatar_pkey] PRIMARY KEY CLUSTERED ([userId])
  );
END;
