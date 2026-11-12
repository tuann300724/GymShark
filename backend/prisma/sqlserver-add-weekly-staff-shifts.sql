-- Add clock-in/out timestamps and recurring weekly staff shift templates.
-- Safe to run repeatedly; does not modify existing shift assignments.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.StaffShift', N'startedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD startedAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'endedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD endedAt DATETIME2 NULL;

IF OBJECT_ID(N'dbo.StaffShiftTemplate', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.StaffShiftTemplate (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_StaffShiftTemplate_Id DEFAULT NEWSEQUENTIALID(),
    staffId UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(255) NOT NULL,
    weekday TINYINT NOT NULL,
    startMinute SMALLINT NOT NULL,
    endMinute SMALLINT NOT NULL,
    notes NVARCHAR(MAX) NULL,
    isActive BIT NOT NULL CONSTRAINT DF_StaffShiftTemplate_IsActive DEFAULT 1,
    createdAt DATETIME2 NOT NULL CONSTRAINT DF_StaffShiftTemplate_CreatedAt DEFAULT SYSUTCDATETIME(),
    updatedAt DATETIME2 NOT NULL CONSTRAINT DF_StaffShiftTemplate_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_StaffShiftTemplate PRIMARY KEY (id),
    CONSTRAINT CK_StaffShiftTemplate_Weekday CHECK (weekday BETWEEN 1 AND 7),
    CONSTRAINT CK_StaffShiftTemplate_StartMinute CHECK (startMinute BETWEEN 0 AND 1439),
    CONSTRAINT CK_StaffShiftTemplate_EndMinute CHECK (endMinute BETWEEN 0 AND 1439),
    CONSTRAINT CK_StaffShiftTemplate_TimeRange CHECK (endMinute <> startMinute)
  );
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.StaffShiftTemplate')
    AND name = N'IX_StaffShiftTemplate_Staff_Weekday'
)
  CREATE INDEX IX_StaffShiftTemplate_Staff_Weekday
    ON dbo.StaffShiftTemplate (staffId, weekday, isActive);

COMMIT TRANSACTION;
