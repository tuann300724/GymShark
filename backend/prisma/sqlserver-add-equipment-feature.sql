SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'gym_db'
  THROW 51030, 'Refusing to add equipment tables outside gym_db.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  -- ==================== EQUIPMENT ====================
  IF OBJECT_ID(N'dbo.Equipment', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.Equipment (
      id NVARCHAR(100) NOT NULL PRIMARY KEY DEFAULT NEWID(),
      name NVARCHAR(400) NOT NULL,
      code NVARCHAR(400) NOT NULL UNIQUE,
      [type] NVARCHAR(400) NOT NULL DEFAULT N'CARDIO',
      [status] NVARCHAR(400) NOT NULL DEFAULT N'AVAILABLE',
      capacity INT NULL,
      createdAt DATETIME NOT NULL DEFAULT GETDATE(),
      updatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_Equipment_Status_Type ON dbo.Equipment ([status], [type]);
    CREATE INDEX IX_Equipment_Code ON dbo.Equipment (code);
  END;

  -- ==================== EQUIPMENT MAINTENANCE ====================
  IF OBJECT_ID(N'dbo.EquipmentMaintenance', N'U') IS NULL
  BEGIN
    CREATE TABLE dbo.EquipmentMaintenance (
      id NVARCHAR(100) NOT NULL PRIMARY KEY DEFAULT NEWID(),
      equipmentId NVARCHAR(100) NOT NULL,
      [status] NVARCHAR(400) NOT NULL DEFAULT N'PENDING',
      startDate DATETIME NOT NULL,
      endDate DATETIME NULL,
      [description] NVARCHAR(MAX) NULL,
      notes NVARCHAR(MAX) NULL,
      createdAt DATETIME NOT NULL DEFAULT GETDATE(),
      updatedAt DATETIME NOT NULL DEFAULT GETDATE(),
      CONSTRAINT FK_EquipmentMaintenance_Equipment FOREIGN KEY (equipmentId)
        REFERENCES dbo.Equipment(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IX_EquipmentMaintenance_EquipmentId ON dbo.EquipmentMaintenance (equipmentId);
    CREATE INDEX IX_EquipmentMaintenance_Status ON dbo.EquipmentMaintenance ([status]);
  END;

  -- ==================== CHECKIN: THÊM EQUIPMENTID ====================
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.CheckIn') AND name = N'equipmentId')
  BEGIN
    ALTER TABLE dbo.CheckIn ADD equipmentId NVARCHAR(100) NULL;
    CREATE INDEX IX_CheckIn_EquipmentId ON dbo.CheckIn (equipmentId);
  END;

  -- Nếu CheckIn chưa có relation FK (tùy chọn cho an toàn)
  IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CheckIn_Equipment')
  BEGIN
    ALTER TABLE dbo.CheckIn ADD CONSTRAINT FK_CheckIn_Equipment
      FOREIGN KEY (equipmentId) REFERENCES dbo.Equipment(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END;

  COMMIT TRANSACTION;
  PRINT 'Equipment + CheckIn equipmentId added successfully in gym_db.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
