CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_list_count]
  @branchId UNIQUEIDENTIFIER = NULL,
  @status VARCHAR(20) = NULL,
  @category NVARCHAR(100) = NULL,
  @condition VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL,
  @roomId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.equipment e
    WHERE (@branchId IS NULL OR e.branchId = @branchId)
      AND (@status IS NULL OR e.status = @status)
      AND (@category IS NULL OR e.category = @category)
      AND (@condition IS NULL OR e.[condition] = @condition)
      AND (@roomId IS NULL OR e.roomId = @roomId)
      AND (@search IS NULL OR e.name LIKE '%' + @search + '%' OR e.code LIKE '%' + @search + '%'
           OR e.brand LIKE '%' + @search + '%' OR e.model LIKE '%' + @search + '%'
           OR e.serialNumber LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
