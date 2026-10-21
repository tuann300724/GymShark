CREATE OR ALTER PROCEDURE [dbo].[sp_audit_logs_list]
  @page INT = 1,
  @limit INT = 20,
  @userId UNIQUEIDENTIFIER = NULL,
  @action VARCHAR(50) = NULL,
  @entity VARCHAR(50) = NULL,
  @search NVARCHAR(100) = NULL,
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT id, userId, action, entity, entityId, metadata, ip, createdAt
    FROM dbo.audit_logs
    WHERE (@userId IS NULL OR userId = @userId)
      AND (@action IS NULL OR action = @action)
      AND (@entity IS NULL OR entity = @entity)
      AND (@search IS NULL OR @search = '' OR
           ISNULL(action,'') LIKE '%' + @search + '%' OR
           ISNULL(entity,'') LIKE '%' + @search + '%' OR
           ISNULL(entityId,'') LIKE '%' + @search + '%')
      AND (@from IS NULL OR createdAt >= @from)
      AND (@to IS NULL OR createdAt <= @to)
    ORDER BY createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END