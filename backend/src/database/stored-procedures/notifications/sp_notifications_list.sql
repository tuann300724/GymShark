CREATE OR ALTER PROCEDURE [dbo].[sp_notifications_list]
  @userId UNIQUEIDENTIFIER = NULL,
  @isRead BIT = NULL,
  @type VARCHAR(30) = NULL,
  @search NVARCHAR(100) = NULL,
  @page INT = 1,
  @limit INT = 20
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT * FROM dbo.notifications
    WHERE (@userId IS NULL OR userId = @userId)
      AND (@isRead IS NULL OR isRead = @isRead)
      AND (@type IS NULL OR type = @type)
      AND (@search IS NULL OR title LIKE '%' + @search + '%' OR content LIKE '%' + @search + '%')
    ORDER BY createdAt DESC
    OFFSET (@page - 1) * @limit ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH DECLARE @E NVARCHAR(4000)=ERROR_MESSAGE(); DECLARE @S INT=ERROR_SEVERITY(); DECLARE @St INT=ERROR_STATE(); RAISERROR(@E,@S,@St); END CATCH
END