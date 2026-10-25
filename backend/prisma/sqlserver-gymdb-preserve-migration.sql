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
