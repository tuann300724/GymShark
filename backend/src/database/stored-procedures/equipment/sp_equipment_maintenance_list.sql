CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_maintenance_list]
  @page INT = 1,
  @limit INT = 20,
  @equipmentId UNIQUEIDENTIFIER = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @status VARCHAR(20) = NULL,
  @type VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT m.id, m.equipmentId, m.type, m.maintenanceDate, m.cost, m.description,
           m.performedBy, m.status, m.nextDueDate, m.createdAt, m.updatedAt,
           e.id AS equipment_id, e.code AS equipment_code, e.name AS equipment_name,
           e.status AS equipment_status,
           b.id AS branch_id, b.name AS branch_name, b.code AS branch_code
    FROM dbo.equipment_maintenances m
    LEFT JOIN dbo.equipment e ON m.equipmentId = e.id
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    WHERE (@equipmentId IS NULL OR e.id = @equipmentId)
      AND (@branchId IS NULL OR EXISTS (SELECT 1 FROM dbo.equipment eq WHERE eq.id = e.id AND eq.branchId = @branchId))
      AND (@status IS NULL OR m.status = @status)
      AND (@type IS NULL OR m.type = @type)
    ORDER BY m.maintenanceDate DESC, m.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
