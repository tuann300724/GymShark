CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_maintenance_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      m.id, m.equipmentId, m.type, m.maintenanceDate, m.cost, m.description,
      m.performedBy, m.status, m.nextDueDate, m.createdAt, m.updatedAt,
      e.id AS equipment_id, e.code AS equipment_code, e.name AS equipment_name,
      e.status AS equipment_status, e.branchId,
      b.id AS branch_id, b.name AS branch_name, b.code AS branch_code
    FROM dbo.equipment_maintenances m
    LEFT JOIN dbo.equipment e ON m.equipmentId = e.id
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    WHERE m.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
