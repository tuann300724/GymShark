CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_find_by_code]
  @code VARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, name, status, [condition], branchId, roomId FROM dbo.equipment WHERE code = @code;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
