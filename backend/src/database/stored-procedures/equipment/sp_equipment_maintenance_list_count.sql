CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_maintenance_list_count]
  @equipmentId UNIQUEIDENTIFIER = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @status VARCHAR(20) = NULL,
  @type VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.equipment_maintenances m
    LEFT JOIN dbo.equipment e ON m.equipmentId = e.id
    WHERE (@equipmentId IS NULL OR e.id = @equipmentId)
      AND (@branchId IS NULL OR EXISTS (SELECT 1 FROM dbo.equipment eq WHERE eq.id = e.id AND eq.branchId = @branchId))
      AND (@status IS NULL OR m.status = @status)
      AND (@type IS NULL OR m.type = @type);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
