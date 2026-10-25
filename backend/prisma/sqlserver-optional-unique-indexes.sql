-- Run after `prisma db push`. SQL Server unique indexes otherwise allow only
-- one NULL value, while these fields are optional in the application schema.
SET NOCOUNT ON;

DECLARE @Targets TABLE (
  TableName sysname NOT NULL,
  ColumnName sysname NOT NULL,
  IndexName sysname NOT NULL
);

INSERT INTO @Targets (TableName, ColumnName, IndexName)
VALUES
  ('Room', 'code', 'Room_code_key'),
  ('User', 'phone', 'User_phone_key'),
  ('User', 'providerId', 'User_providerId_key'),
  ('Member', 'userId', 'Member_userId_key'),
  ('Payment', 'transactionRef', 'Payment_transactionRef_key'),
  ('Invoice', 'paymentId', 'Invoice_paymentId_key'),
  ('Equipment', 'serialNumber', 'Equipment_serialNumber_key');

DECLARE @TableName sysname;
DECLARE @ColumnName sysname;
DECLARE @IndexName sysname;
DECLARE @IsConstraint bit;
DECLARE @QualifiedTable nvarchar(300);
DECLARE @Sql nvarchar(max);

DECLARE ExistingIndexes CURSOR LOCAL FAST_FORWARD FOR
  SELECT DISTINCT
    target.TableName,
    target.ColumnName,
    indexInfo.name,
    indexInfo.is_unique_constraint
  FROM @Targets AS target
  JOIN sys.tables AS tableInfo
    ON tableInfo.name = target.TableName
  JOIN sys.schemas AS schemaInfo
    ON schemaInfo.schema_id = tableInfo.schema_id
    AND schemaInfo.name = N'dbo'
  JOIN sys.indexes AS indexInfo
    ON indexInfo.object_id = tableInfo.object_id
    AND indexInfo.is_unique = 1
    AND indexInfo.is_primary_key = 0
  JOIN sys.index_columns AS indexColumn
    ON indexColumn.object_id = indexInfo.object_id
    AND indexColumn.index_id = indexInfo.index_id
    AND indexColumn.key_ordinal = 1
  JOIN sys.columns AS columnInfo
    ON columnInfo.object_id = indexColumn.object_id
    AND columnInfo.column_id = indexColumn.column_id
    AND columnInfo.name = target.ColumnName
  WHERE (
    SELECT COUNT(*)
    FROM sys.index_columns AS keyColumn
    WHERE keyColumn.object_id = indexInfo.object_id
      AND keyColumn.index_id = indexInfo.index_id
      AND keyColumn.key_ordinal > 0
  ) = 1;

OPEN ExistingIndexes;
FETCH NEXT FROM ExistingIndexes INTO @TableName, @ColumnName, @IndexName, @IsConstraint;

WHILE @@FETCH_STATUS = 0
BEGIN
  SET @QualifiedTable = QUOTENAME(N'dbo') + N'.' + QUOTENAME(@TableName);
  IF @IsConstraint = 1
    SET @Sql = N'ALTER TABLE ' + @QualifiedTable + N' DROP CONSTRAINT ' + QUOTENAME(@IndexName);
  ELSE
    SET @Sql = N'DROP INDEX ' + QUOTENAME(@IndexName) + N' ON ' + @QualifiedTable;
  EXEC sys.sp_executesql @Sql;

  FETCH NEXT FROM ExistingIndexes INTO @TableName, @ColumnName, @IndexName, @IsConstraint;
END;

CLOSE ExistingIndexes;
DEALLOCATE ExistingIndexes;

DECLARE OptionalIndexes CURSOR LOCAL FAST_FORWARD FOR
  SELECT TableName, ColumnName, IndexName
  FROM @Targets;

OPEN OptionalIndexes;
FETCH NEXT FROM OptionalIndexes INTO @TableName, @ColumnName, @IndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
  SET @QualifiedTable = QUOTENAME(N'dbo') + N'.' + QUOTENAME(@TableName);
  IF OBJECT_ID(@QualifiedTable, N'U') IS NOT NULL
    AND COL_LENGTH(@QualifiedTable, @ColumnName) IS NOT NULL
  BEGIN
    SET @Sql =
      N'CREATE UNIQUE NONCLUSTERED INDEX ' + QUOTENAME(@IndexName)
      + N' ON ' + @QualifiedTable + N' (' + QUOTENAME(@ColumnName) + N')'
      + N' WHERE ' + QUOTENAME(@ColumnName) + N' IS NOT NULL';
    EXEC sys.sp_executesql @Sql;
  END;

  FETCH NEXT FROM OptionalIndexes INTO @TableName, @ColumnName, @IndexName;
END;

CLOSE OptionalIndexes;
DEALLOCATE OptionalIndexes;
