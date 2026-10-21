CREATE OR ALTER PROCEDURE [dbo].[sp_members_find_by_code]
  @code VARCHAR(30)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT m.* FROM dbo.members m WHERE m.code = @code;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
