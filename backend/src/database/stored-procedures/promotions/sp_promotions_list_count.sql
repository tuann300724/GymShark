CREATE OR ALTER PROCEDURE [dbo].[sp_promotions_list_count]
  @status VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total FROM dbo.promotions
    WHERE (@status IS NULL OR status = @status)
      AND (@search IS NULL OR code LIKE '%' + @search + '%' OR name LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH DECLARE @E NVARCHAR(4000)=ERROR_MESSAGE(); DECLARE @S INT=ERROR_SEVERITY(); DECLARE @St INT=ERROR_STATE(); RAISERROR(@E,@S,@St); END CATCH
END
