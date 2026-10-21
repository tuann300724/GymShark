CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_update]
  @id UNIQUEIDENTIFIER,
  @code VARCHAR(50) = NULL,
  @name NVARCHAR(255) = NULL,
  @category NVARCHAR(100) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @roomId UNIQUEIDENTIFIER = NULL,
  @brand NVARCHAR(100) = NULL,
  @model NVARCHAR(100) = NULL,
  @serialNumber VARCHAR(100) = NULL,
  @purchaseDate DATETIME2 = NULL,
  @purchasePrice DECIMAL(12,2) = NULL,
  @warrantyExpiry DATETIME2 = NULL,
  @status VARCHAR(20) = NULL,
  @condition VARCHAR(20) = NULL,
  @lastMaintenanceAt DATETIME2 = NULL,
  @nextMaintenanceAt DATETIME2 = NULL,
  @description NVARCHAR(2000) = NULL,
  @setBranchId BIT = 0,
  @setRoomId BIT = 0,
  @setBrand BIT = 0,
  @setModel BIT = 0,
  @setSerialNumber BIT = 0,
  @setPurchaseDate BIT = 0,
  @setPurchasePrice BIT = 0,
  @setWarrantyExpiry BIT = 0,
  @setLastMaintenanceAt BIT = 0,
  @setNextMaintenanceAt BIT = 0,
  @setDescription BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @curBranchId UNIQUEIDENTIFIER = (SELECT branchId FROM dbo.equipment WHERE id = @id);

    IF @curBranchId IS NULL
    BEGIN
      RAISERROR('Khong tim thay thiet bi.', 16, 1);
      ROLLBACK TRANSACTION; RETURN;
    END;

    IF @code IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.equipment WHERE code = @code AND id <> @id)
    BEGIN
      RAISERROR('Ma thiet bi %s da duoc su dung boi thiet bi khac.', 16, 1, @code);
      ROLLBACK TRANSACTION; RETURN;
    END;

    IF @serialNumber IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.equipment WHERE serialNumber = @serialNumber AND id <> @id)
    BEGIN
      RAISERROR('So serial %s da duoc su dung boi thiet bi khac.', 16, 1, @serialNumber);
      ROLLBACK TRANSACTION; RETURN;
    END;

    IF @roomId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE id = @roomId AND branchId = ISNULL(@branchId, @curBranchId))
    BEGIN
      RAISERROR('Phong duoc chon khong thuoc chi nhanh cua thiet bi.', 16, 1);
      ROLLBACK TRANSACTION; RETURN;
    END;

    UPDATE dbo.equipment SET
      code = ISNULL(@code, code),
      name = ISNULL(@name, name),
      category = ISNULL(@category, category),
      status = ISNULL(@status, status),
      [condition] = ISNULL(@condition, [condition]),
      brand = CASE WHEN @setBrand = 1 THEN @brand ELSE brand END,
      model = CASE WHEN @setModel = 1 THEN @model ELSE model END,
      serialNumber = CASE WHEN @setSerialNumber = 1 THEN @serialNumber ELSE serialNumber END,
      purchaseDate = CASE WHEN @setPurchaseDate = 1 THEN @purchaseDate ELSE purchaseDate END,
      purchasePrice = CASE WHEN @setPurchasePrice = 1 THEN @purchasePrice ELSE purchasePrice END,
      warrantyExpiry = CASE WHEN @setWarrantyExpiry = 1 THEN @warrantyExpiry ELSE warrantyExpiry END,
      lastMaintenanceAt = CASE WHEN @setLastMaintenanceAt = 1 THEN @lastMaintenanceAt ELSE lastMaintenanceAt END,
      nextMaintenanceAt = CASE WHEN @setNextMaintenanceAt = 1 THEN @nextMaintenanceAt ELSE nextMaintenanceAt END,
      description = CASE WHEN @setDescription = 1 THEN @description ELSE description END,
      branchId = CASE WHEN @setBranchId = 1 THEN @branchId ELSE branchId END,
      roomId = CASE WHEN @setRoomId = 1 THEN @roomId ELSE roomId END,
      updatedAt = SYSUTCDATETIME()
    WHERE id = @id;

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
    WHERE e.id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
