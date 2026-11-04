-- Add cash reconciliation fields to the existing StaffShift table.
-- Safe to run repeatedly; existing shift records remain unchanged.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.StaffShift', N'cashExpected') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashExpected DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'cashCounted') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashCounted DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'cashDifference') IS NULL
  ALTER TABLE dbo.StaffShift ADD cashDifference DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closedById') IS NULL
  ALTER TABLE dbo.StaffShift ADD closedById UNIQUEIDENTIFIER NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closedAt') IS NULL
  ALTER TABLE dbo.StaffShift ADD closedAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.StaffShift', N'closeNotes') IS NULL
  ALTER TABLE dbo.StaffShift ADD closeNotes NVARCHAR(1000) NULL;

COMMIT TRANSACTION;
