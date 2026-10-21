CREATE OR ALTER PROCEDURE [dbo].[sp_members_payments]
  @memberId UNIQUEIDENTIFIER,
  @top INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@top) * FROM dbo.payments WHERE memberId = @memberId ORDER BY createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
