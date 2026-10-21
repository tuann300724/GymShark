CREATE OR ALTER PROCEDURE [dbo].[sp_members_checkins]
  @memberId UNIQUEIDENTIFIER,
  @top INT = 30
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@top) * FROM dbo.check_ins WHERE memberId = @memberId ORDER BY checkInTime DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
