CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_list_count]
  @search NVARCHAR(100) = NULL,
  @status VARCHAR(20) = NULL,
  @specialization NVARCHAR(100) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.trainers t
    LEFT JOIN dbo.users u ON t.userId = u.id
    WHERE (@status IS NULL OR t.status = @status)
      AND (@specialization IS NULL OR t.specialization LIKE '%' + @specialization + '%')
      AND (@branchId IS NULL OR u.branchId = @branchId)
      AND (@search IS NULL OR @search = '' OR
           ISNULL(u.fullName,'') LIKE '%' + @search + '%' OR
           ISNULL(u.email,'') LIKE '%' + @search + '%' OR
           ISNULL(u.phone,'') LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
