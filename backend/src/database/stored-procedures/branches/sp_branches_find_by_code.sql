CREATE OR ALTER PROCEDURE [dbo].[sp_branches_find_by_code]
  @code VARCHAR(30),
  @excludeId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, code FROM dbo.branches
    WHERE code = @code AND (@excludeId IS NULL OR id <> @excludeId);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
