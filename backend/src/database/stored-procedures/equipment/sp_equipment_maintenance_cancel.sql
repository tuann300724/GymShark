CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_maintenance_cancel]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @equipmentId UNIQUEIDENTIFIER = (SELECT equipmentId FROM dbo.equipment_maintenances WHERE id = @id);

    IF @equipmentId IS NULL
    BEGIN
      RAISERROR('Khong tim thay yeu cau bao tri.', 16, 1);
      ROLLBACK TRANSACTION; RETURN;
    END;

    UPDATE dbo.equipment_maintenances SET status = 'CANCELLED', updatedAt = SYSUTCDATETIME() WHERE id = @id;

    IF NOT EXISTS (SELECT 1 FROM dbo.equipment_maintenances WHERE equipmentId = @equipmentId AND status IN ('IN_PROGRESS', 'SCHEDULED'))
    BEGIN
      UPDATE dbo.equipment SET status = 'AVAILABLE', updatedAt = SYSUTCDATETIME() WHERE id = @equipmentId AND status = 'MAINTENANCE';
    END;

    COMMIT TRANSACTION;

    SELECT
      m.id, m.equipmentId, m.type, m.maintenanceDate, m.cost, m.description,
      m.performedBy, m.status, m.nextDueDate, m.createdAt, m.updatedAt,
      e.id AS equipment_id, e.code AS equipment_code, e.name AS equipment_name,
      e.status AS equipment_status,
      b.id AS branch_id, b.name AS branch_name, b.code AS branch_code
    FROM dbo.equipment_maintenances m
    LEFT JOIN dbo.equipment e ON m.equipmentId = e.id
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    WHERE m.id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
