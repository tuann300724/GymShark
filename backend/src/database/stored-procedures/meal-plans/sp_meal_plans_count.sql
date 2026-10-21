CREATE OR ALTER PROCEDURE [dbo].[sp_meal_plans_count]
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @isTemplate BIT = NULL,
  @status VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.meal_plans mp
    WHERE (@trainerId IS NULL OR mp.trainerId = @trainerId)
      AND (@memberId IS NULL OR mp.memberId = @memberId)
      AND (@isTemplate IS NULL OR mp.isTemplate = @isTemplate)
      AND (@status IS NULL OR mp.status = @status)
      AND (@search IS NULL OR mp.title LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
