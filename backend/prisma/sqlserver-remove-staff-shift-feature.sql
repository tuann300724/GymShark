/* Remove staff shifts while preserving beverage sales and payments. */
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
    THROW 51000, 'Refusing to remove staff shifts outside gym_db.', 1;

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.vw_StaffShiftRevenue', N'V') IS NOT NULL
    DROP VIEW dbo.vw_StaffShiftRevenue;

IF OBJECT_ID(N'dbo.vw_BeverageSalesStatistics', N'V') IS NOT NULL
    DROP VIEW dbo.vw_BeverageSalesStatistics;

DECLARE @sql NVARCHAR(MAX) = N'';

/* Drop every foreign key that depends on either shift reference or table. */
SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(fk.parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(fk.parent_object_id))
    + N' DROP CONSTRAINT ' + QUOTENAME(fk.name) + N';'
FROM sys.foreign_keys AS fk
WHERE fk.parent_object_id IN (OBJECT_ID(N'dbo.Payment'), OBJECT_ID(N'dbo.BeverageSale'), OBJECT_ID(N'dbo.StaffShift'))
   OR fk.referenced_object_id = OBJECT_ID(N'dbo.StaffShift');
IF @sql <> N'' EXEC sys.sp_executesql @sql;

/* Drop indexes that include the now-obsolete staffShiftId columns. */
SET @sql = N'';
SELECT @sql += N'DROP INDEX ' + QUOTENAME(i.name) + N' ON ' + QUOTENAME(OBJECT_SCHEMA_NAME(i.object_id)) + N'.' + QUOTENAME(OBJECT_NAME(i.object_id)) + N';'
FROM sys.indexes AS i
WHERE i.is_primary_key = 0 AND i.is_unique_constraint = 0
  AND i.object_id IN (OBJECT_ID(N'dbo.Payment'), OBJECT_ID(N'dbo.BeverageSale'))
  AND EXISTS (
      SELECT 1 FROM sys.index_columns AS ic
      JOIN sys.columns AS c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
      WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND c.name = N'staffShiftId'
  );
IF @sql <> N'' EXEC sys.sp_executesql @sql;

IF COL_LENGTH(N'dbo.Payment', N'staffShiftId') IS NOT NULL
    ALTER TABLE dbo.Payment DROP COLUMN staffShiftId;
IF COL_LENGTH(N'dbo.BeverageSale', N'staffShiftId') IS NOT NULL
    ALTER TABLE dbo.BeverageSale DROP COLUMN staffShiftId;

IF OBJECT_ID(N'dbo.StaffShiftTemplate', N'U') IS NOT NULL DROP TABLE dbo.StaffShiftTemplate;
IF OBJECT_ID(N'dbo.StaffShift', N'U') IS NOT NULL DROP TABLE dbo.StaffShift;
IF OBJECT_ID(N'dbo.BranchStaffShiftAssignmentArchive', N'U') IS NOT NULL DROP TABLE dbo.BranchStaffShiftAssignmentArchive;

EXEC sys.sp_executesql N'
CREATE VIEW dbo.vw_BeverageSalesStatistics
AS
SELECT
    s.id AS saleId,
    s.code AS saleCode,
    s.branchId,
    b.name AS branchName,
    s.memberId,
    mem.fullName AS memberName,
    s.staffId,
    usr.fullName AS staffName,
    s.saleDate,
    s.status,
    s.paymentMethod,
    COUNT(si.id) AS productLineCount,
    COALESCE(SUM(si.quantity), 0) AS totalSoldQuantity,
    s.subtotal,
    s.discountAmount,
    s.totalAmount,
    CASE WHEN s.status = N''PAID'' THEN s.totalAmount ELSE 0 END AS recognizedRevenue,
    s.paidAt
FROM dbo.BeverageSale AS s
INNER JOIN dbo.Branch AS b ON b.id = s.branchId
INNER JOIN dbo.Member AS mem ON mem.id = s.memberId
INNER JOIN dbo.[User] AS usr ON usr.id = s.staffId
LEFT JOIN dbo.BeverageSaleItem AS si ON si.saleId = s.id
GROUP BY
    s.id, s.code, s.branchId, b.name, s.memberId, mem.fullName,
    s.staffId, usr.fullName, s.saleDate, s.status,
    s.paymentMethod, s.subtotal, s.discountAmount, s.totalAmount, s.paidAt;';

IF OBJECT_ID(N'dbo.StaffShift', N'U') IS NOT NULL
   OR OBJECT_ID(N'dbo.StaffShiftTemplate', N'U') IS NOT NULL
   OR OBJECT_ID(N'dbo.BranchStaffShiftAssignmentArchive', N'U') IS NOT NULL
   OR COL_LENGTH(N'dbo.Payment', N'staffShiftId') IS NOT NULL
   OR COL_LENGTH(N'dbo.BeverageSale', N'staffShiftId') IS NOT NULL
   OR OBJECT_ID(N'dbo.vw_StaffShiftRevenue', N'V') IS NOT NULL
    THROW 51001, 'Staff shift removal postcondition failed.', 1;

COMMIT TRANSACTION;
