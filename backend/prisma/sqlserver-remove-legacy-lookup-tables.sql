SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
    THROW 51030, 'Refusing to remove legacy lookup tables outside gym_db.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @tables TABLE (tableName SYSNAME NOT NULL PRIMARY KEY);
    INSERT INTO @tables (tableName)
    VALUES
        (N'CheckInMethod'),
        (N'CheckInStatus'),
        (N'DiscountType'),
        (N'Gender'),
        (N'InvoiceStatusTbl'),
        (N'MembershipStatusTbl'),
        (N'MemberStatusTbl'),
        (N'PackageType'),
        (N'PaymentMethodTbl'),
        (N'PaymentStatusTbl'),
        (N'RoomStatus'),
        (N'RoomType'),
        (N'ScheduleStatus'),
        (N'SessionType'),
        (N'TrainerMemberStatus'),
        (N'TrainerStatus'),
        (N'UserRole'),
        (N'UserStatus');

    DECLARE @tableName SYSNAME;
    DECLARE @objectId INT;
    DECLARE @sql NVARCHAR(MAX);

    DECLARE lookupTables CURSOR LOCAL FAST_FORWARD FOR
        SELECT tableName FROM @tables ORDER BY tableName;

    OPEN lookupTables;
    FETCH NEXT FROM lookupTables INTO @tableName;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @objectId = OBJECT_ID(N'dbo.' + QUOTENAME(@tableName), N'U');

        IF @objectId IS NOT NULL
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM sys.foreign_keys
                WHERE parent_object_id = @objectId OR referenced_object_id = @objectId
            )
                THROW 51031, 'A legacy lookup table has a foreign-key dependency; refusing to drop tables.', 1;

            IF EXISTS (
                SELECT 1
                FROM sys.sql_expression_dependencies
                WHERE referencing_id = @objectId OR referenced_id = @objectId
            )
                THROW 51032, 'A SQL object depends on a legacy lookup table; refusing to drop tables.', 1;

            IF EXISTS (SELECT 1 FROM sys.triggers WHERE parent_id = @objectId)
                THROW 51033, 'A legacy lookup table has a trigger; refusing to drop tables.', 1;

            IF (
                SELECT COUNT(*)
                FROM sys.columns
                WHERE object_id = @objectId
            ) <> 1
            OR NOT EXISTS (
                SELECT 1
                FROM sys.columns
                WHERE object_id = @objectId
                  AND column_id = 1
                  AND name = N'value'
                  AND system_type_id = 231
                  AND is_nullable = 0
            )
                THROW 51034, 'A legacy lookup table has an unexpected schema; refusing to drop tables.', 1;

            SET @sql = N'DROP TABLE dbo.' + QUOTENAME(@tableName) + N';';
            EXEC sys.sp_executesql @sql;
        END;

        FETCH NEXT FROM lookupTables INTO @tableName;
    END;

    CLOSE lookupTables;
    DEALLOCATE lookupTables;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF CURSOR_STATUS('local', 'lookupTables') >= 0
        CLOSE lookupTables;
    IF CURSOR_STATUS('local', 'lookupTables') > -3
        DEALLOCATE lookupTables;
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
