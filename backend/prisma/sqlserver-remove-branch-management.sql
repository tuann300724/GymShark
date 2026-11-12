SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Branch', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Branch (
            id NVARCHAR(100) NOT NULL CONSTRAINT PK_Branch PRIMARY KEY,
            name NVARCHAR(400) NOT NULL,
            address NVARCHAR(MAX) NULL,
            phone NVARCHAR(400) NULL,
            status NVARCHAR(400) NOT NULL CONSTRAINT DF_Branch_status DEFAULT N'ACTIVE',
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_Branch_createdAt DEFAULT SYSUTCDATETIME(),
            updatedAt DATETIME2 NOT NULL CONSTRAINT DF_Branch_updatedAt DEFAULT SYSUTCDATETIME(),
            CONSTRAINT UQ_Branch_name UNIQUE (name)
        );
    END;

    DECLARE @locationId NVARCHAR(100);

    SELECT TOP (1) @locationId = id
    FROM dbo.Branch
    WHERE UPPER(status) = N'ACTIVE'
    ORDER BY createdAt, id;

    IF @locationId IS NULL
    BEGIN
        SELECT TOP (1) @locationId = id
        FROM dbo.Branch
        ORDER BY createdAt, id;
    END;

    IF @locationId IS NULL
    BEGIN
        SET @locationId = CONVERT(NVARCHAR(100), NEWID());
        INSERT INTO dbo.Branch (id, name, address, phone, status, createdAt, updatedAt)
        VALUES (@locationId, N'Cơ sở chính', NULL, NULL, N'ACTIVE', SYSUTCDATETIME(), SYSUTCDATETIME());
    END;

    IF OBJECT_ID(N'dbo.BeverageStockMovement', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageStockMovement', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageStockMovement SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;
    IF OBJECT_ID(N'dbo.BeverageImport', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageImport', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageImport SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;
    IF OBJECT_ID(N'dbo.BeverageSale', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.BeverageSale', N'branchId') IS NOT NULL
        UPDATE dbo.BeverageSale SET branchId = @locationId WHERE ISNULL(branchId, N'') <> @locationId;

    UPDATE dbo.Branch
    SET status = CASE WHEN id = @locationId THEN N'ACTIVE' ELSE N'INACTIVE' END
    WHERE UPPER(status) <> CASE WHEN id = @locationId THEN N'ACTIVE' ELSE N'INACTIVE' END;

    DECLARE @tableName SYSNAME;
    DECLARE @constraintName SYSNAME;
    DECLARE @sql NVARCHAR(MAX);

    DECLARE branchForeignKeys CURSOR LOCAL FAST_FORWARD FOR
        SELECT OBJECT_NAME(fk.parent_object_id), fk.name
        FROM sys.foreign_keys AS fk
        WHERE fk.referenced_object_id = OBJECT_ID(N'dbo.Branch')
          AND fk.parent_object_id IN (OBJECT_ID(N'dbo.Member'), OBJECT_ID(N'dbo.StaffShift'));

    OPEN branchForeignKeys;
    FETCH NEXT FROM branchForeignKeys INTO @tableName, @constraintName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = N'ALTER TABLE dbo.' + QUOTENAME(@tableName)
            + N' DROP CONSTRAINT ' + QUOTENAME(@constraintName) + N';';
        EXEC sys.sp_executesql @sql;
        FETCH NEXT FROM branchForeignKeys INTO @tableName, @constraintName;
    END;
    CLOSE branchForeignKeys;
    DEALLOCATE branchForeignKeys;

    DECLARE @indexTable SYSNAME;
    DECLARE @indexName SYSNAME;
    DECLARE branchIndexes CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT OBJECT_NAME(i.object_id), i.name
        FROM sys.indexes AS i
        INNER JOIN sys.index_columns AS ic
            ON ic.object_id = i.object_id AND ic.index_id = i.index_id
        INNER JOIN sys.columns AS c
            ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE i.object_id IN (OBJECT_ID(N'dbo.Member'), OBJECT_ID(N'dbo.StaffShift'))
          AND c.name = N'branchId'
          AND i.name IS NOT NULL
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;

    OPEN branchIndexes;
    FETCH NEXT FROM branchIndexes INTO @indexTable, @indexName;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = N'DROP INDEX ' + QUOTENAME(@indexName) + N' ON dbo.'
            + QUOTENAME(@indexTable) + N';';
        EXEC sys.sp_executesql @sql;
        FETCH NEXT FROM branchIndexes INTO @indexTable, @indexName;
    END;
    CLOSE branchIndexes;
    DEALLOCATE branchIndexes;

    IF COL_LENGTH(N'dbo.Member', N'branchId') IS NOT NULL
    BEGIN
        IF OBJECT_ID(N'dbo.BranchMemberAssignmentArchive', N'U') IS NULL
            CREATE TABLE dbo.BranchMemberAssignmentArchive (
                entityId NVARCHAR(100) NOT NULL CONSTRAINT PK_BranchMemberAssignmentArchive PRIMARY KEY,
                branchId NVARCHAR(100) NULL,
                archivedAt DATETIME2 NOT NULL CONSTRAINT DF_BranchMemberAssignmentArchive_archivedAt DEFAULT SYSUTCDATETIME()
            );

        EXEC sys.sp_executesql N'
            INSERT INTO dbo.BranchMemberAssignmentArchive (entityId, branchId)
            SELECT CONVERT(NVARCHAR(100), id), branchId
            FROM dbo.Member
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BranchMemberAssignmentArchive AS archived
                WHERE archived.entityId = CONVERT(NVARCHAR(100), dbo.Member.id)
            );';
    END;

    IF COL_LENGTH(N'dbo.StaffShift', N'branchId') IS NOT NULL
    BEGIN
        IF OBJECT_ID(N'dbo.BranchStaffShiftAssignmentArchive', N'U') IS NULL
            CREATE TABLE dbo.BranchStaffShiftAssignmentArchive (
                entityId NVARCHAR(100) NOT NULL CONSTRAINT PK_BranchStaffShiftAssignmentArchive PRIMARY KEY,
                branchId NVARCHAR(100) NULL,
                archivedAt DATETIME2 NOT NULL CONSTRAINT DF_BranchStaffShiftAssignmentArchive_archivedAt DEFAULT SYSUTCDATETIME()
            );

        EXEC sys.sp_executesql N'
            INSERT INTO dbo.BranchStaffShiftAssignmentArchive (entityId, branchId)
            SELECT CONVERT(NVARCHAR(100), id), branchId
            FROM dbo.StaffShift
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BranchStaffShiftAssignmentArchive AS archived
                WHERE archived.entityId = CONVERT(NVARCHAR(100), dbo.StaffShift.id)
            );';
    END;

    IF COL_LENGTH(N'dbo.Member', N'branchId') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.Member DROP COLUMN branchId;';
    IF COL_LENGTH(N'dbo.StaffShift', N'branchId') IS NOT NULL
        EXEC sys.sp_executesql N'ALTER TABLE dbo.StaffShift DROP COLUMN branchId;';

    EXEC sys.sp_executesql N'
        CREATE OR ALTER VIEW dbo.vw_StaffShiftRevenue
        AS
        SELECT
            ss.id AS staffShiftId,
            ss.title AS shiftTitle,
            ss.staffId,
            u.fullName AS staffName,
            CAST(NULL AS NVARCHAR(100)) AS branchId,
            CAST(NULL AS NVARCHAR(400)) AS branchName,
            ss.startTime,
            ss.endTime,
            ss.status AS shiftStatus,
            COUNT(p.id) AS paidPaymentCount,
            COUNT(DISTINCT p.memberId) AS memberCount,
            COALESCE(SUM(p.amount), 0) AS totalRevenue
        FROM dbo.StaffShift AS ss
        INNER JOIN dbo.[User] AS u
            ON u.id = ss.staffId
        LEFT JOIN dbo.Payment AS p
            ON p.staffShiftId = ss.id
           AND UPPER(p.status) = N''PAID''
        GROUP BY
            ss.id, ss.title, ss.staffId, u.fullName,
            ss.startTime, ss.endTime, ss.status;';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
