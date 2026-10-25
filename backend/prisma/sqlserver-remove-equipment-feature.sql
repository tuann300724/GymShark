SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51020, 'Refusing to remove equipment tables outside gym_db.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  DECLARE @EquipmentRows BIGINT;
  DECLARE @MaintenanceRows BIGINT;

  IF OBJECT_ID(N'dbo.Equipment', N'U') IS NOT NULL
  BEGIN
    EXEC sys.sp_executesql
      N'SELECT @Rows = COUNT_BIG(*) FROM dbo.Equipment;',
      N'@Rows BIGINT OUTPUT',
      @Rows = @EquipmentRows OUTPUT;
    IF @EquipmentRows > 0
      THROW 51021, 'Equipment contains data; refusing to drop the table.', 1;
  END;

  IF OBJECT_ID(N'dbo.EquipmentMaintenance', N'U') IS NOT NULL
  BEGIN
    EXEC sys.sp_executesql
      N'SELECT @Rows = COUNT_BIG(*) FROM dbo.EquipmentMaintenance;',
      N'@Rows BIGINT OUTPUT',
      @Rows = @MaintenanceRows OUTPUT;
    IF @MaintenanceRows > 0
      THROW 51022, 'EquipmentMaintenance contains data; refusing to drop the table.', 1;
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID(N'dbo.Equipment')
      AND parent_object_id <> OBJECT_ID(N'dbo.EquipmentMaintenance')
  )
    THROW 51023, 'Other tables reference Equipment; refusing to drop the table.', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID(N'dbo.EquipmentMaintenance')
  )
    THROW 51024, 'Other tables reference EquipmentMaintenance; refusing to drop the table.', 1;

  IF OBJECT_ID(N'dbo.EquipmentMaintenance', N'U') IS NOT NULL
    DROP TABLE dbo.EquipmentMaintenance;
  IF OBJECT_ID(N'dbo.Equipment', N'U') IS NOT NULL
    DROP TABLE dbo.Equipment;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
