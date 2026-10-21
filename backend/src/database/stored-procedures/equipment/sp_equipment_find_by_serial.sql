CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_find_by_serial]
  @serial VARCHAR(100),
  @excludeId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code, name FROM dbo.equipment WHERE serialNumber = @serial AND (@excludeId IS NULL OR id <> @excludeId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
