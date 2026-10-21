CREATE OR ALTER PROCEDURE [dbo].[sp_invoices_list_by_member_count]
  @userId UNIQUEIDENTIFIER,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @memberId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.members WHERE userId = @userId);
    SELECT COUNT(*) AS total FROM dbo.invoices
    WHERE (@memberId IS NULL OR memberId = @memberId) AND (@status IS NULL OR status = @status);
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
