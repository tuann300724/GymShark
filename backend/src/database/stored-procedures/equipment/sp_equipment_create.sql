CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_create]
  @code VARCHAR(50),
  @name NVARCHAR(255),
  @category NVARCHAR(100),
  @branchId UNIQUEIDENTIFIER,
  @roomId UNIQUEIDENTIFIER = NULL,
  @brand NVARCHAR(100) = NULL,
  @model NVARCHAR(100) = NULL,
  @serialNumber VARCHAR(100) = NULL,
  @purchaseDate DATETIME2 = NULL,
  @purchasePrice DECIMAL(12,2) = NULL,
  @warrantyExpiry DATETIME2 = NULL,
  @status VARCHAR(20) = 'AVAILABLE',
  @condition VARCHAR(20) = 'GOOD',
  @nextMaintenanceAt DATETIME2 = NULL,
  @description NVARCHAR(2000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.branches WHERE id = @branchId)
    BEGIN
        RAISERROR('Khong tim thay chi nhanh.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM dbo.equipment WHERE code = @code)
    BEGIN
        RAISERROR('Ma thiet bi %s da ton tai.', 16, 1, @code);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF @serialNumber IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.equipment WHERE serialNumber = @serialNumber)
    BEGIN
        RAISERROR('So serial %s da duoc su dung boi thiet bi khac.', 16, 1, @serialNumber);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF @roomId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE id = @roomId AND branchId = @branchId)
    BEGIN
        RAISERROR('Phong duoc chon khong thuoc chi nhanh cua thiet bi.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    DECLARE @newId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.equipment (
      id, code, name, category, brand, model, serialNumber, purchaseDate, purchasePrice,
      warrantyExpiry, status, condition, lastMaintenanceAt, nextMaintenanceAt, description,
      branchId, roomId, createdAt, updatedAt
    )
    VALUES (
      @newId, @code, @name, @category, @brand, @model, @serialNumber, @purchaseDate, @purchasePrice,
      @warrantyExpiry, @status, @condition, NULL, @nextMaintenanceAt, @description,
      @branchId, @roomId, SYSUTCDATETIME(), SYSUTCDATETIME()
    );

    COMMIT TRANSACTION;

    SELECT
      e.id, e.code, e.name, e.category, e.brand, e.model, e.status,
      e.condition, e.serialNumber, e.purchaseDate, e.purchasePrice,
      e.warrantyExpiry, e.lastMaintenanceAt, e.nextMaintenanceAt,
      e.description, e.branchId, e.roomId, e.createdAt, e.updatedAt,
      b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
      r.id AS room_id, r.code AS room_code, r.name AS room_name
    FROM dbo.equipment e
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    LEFT JOIN dbo.rooms r ON e.roomId = r.id
    WHERE e.id = @newId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
