CREATE OR ALTER PROCEDURE [dbo].[sp_foods_list_count]
  @category VARCHAR(20) = NULL,
  @search NVARCHAR(100) = NULL,
  @isActive BIT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total FROM dbo.foods
    WHERE (@category IS NULL OR category = @category)
      AND (@isActive IS NULL OR isActive = @isActive)
      AND (@search IS NULL OR name LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
