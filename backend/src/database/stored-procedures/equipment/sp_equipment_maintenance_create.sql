CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_maintenance_create]
  @equipmentId UNIQUEIDENTIFIER,
  @type VARCHAR(20) = 'ROUTINE',
  @maintenanceDate DATETIME2 = NULL,
  @cost DECIMAL(10,2) = NULL,
  @description NVARCHAR(2000),
  @performedBy NVARCHAR(255) = NULL,
  @status VARCHAR(20) = 'IN_PROGRESS',
  @nextDueDate DATETIME2 = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM dbo.equipment WHERE id = @equipmentId)
    BEGIN
      RAISERROR('Khong tim thay thiet bi.', 16, 1);
      ROLLBACK TRANSACTION; RETURN;
    END;

    DECLARE @newId UNIQUEIDENTIFIER = NEWID();
    DECLARE @effectiveDate DATETIME2 = ISNULL(@maintenanceDate, SYSUTCDATETIME());

    INSERT INTO dbo.equipment_maintenances (
      id, equipmentId, type, maintenanceDate, cost, description, performedBy, status, nextDueDate, createdAt, updatedAt
    )
    VALUES (
      @newId, @equipmentId, @type, @effectiveDate, @cost, @description, @performedBy, @status, @nextDueDate, SYSUTCDATETIME(), SYSUTCDATETIME()
    );

    IF @status <> 'SCHEDULED' AND EXISTS (SELECT 1 FROM dbo.equipment WHERE id = @equipmentId AND status <> 'BROKEN')
    BEGIN
      UPDATE dbo.equipment SET status = 'MAINTENANCE', updatedAt = SYSUTCDATETIME() WHERE id = @equipmentId;
    END;

    COMMIT TRANSACTION;

    SELECT
      m.id, m.equipmentId, m.type, m.maintenanceDate, m.cost, m.description,
      m.performedBy, m.status, m.nextDueDate, m.createdAt, m.updatedAt,
      e.id AS equipment_id, e.code AS equipment_code, e.name AS equipment_name,
      e.status AS equipment_status, e.branchId,
      b.id AS branch_id, b.name AS branch_name, b.code AS branch_code
    FROM dbo.equipment_maintenances m
    LEFT JOIN dbo.equipment e ON m.equipmentId = e.id
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    WHERE m.id = @newId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
