CREATE OR ALTER PROCEDURE [dbo].[sp_packages_list_count]
  @status VARCHAR(20) = NULL,
  @search NVARCHAR(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.membership_packages
    WHERE (@status IS NULL OR status = @status)
      AND (@search IS NULL OR name LIKE '%' + @search + '%' OR code LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
