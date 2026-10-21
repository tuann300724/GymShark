CREATE OR ALTER PROCEDURE [dbo].[sp_notifications_list_count]
  @userId UNIQUEIDENTIFIER = NULL,
  @isRead BIT = NULL,
  @type VARCHAR(30) = NULL,
  @search NVARCHAR(100) = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total FROM dbo.notifications
    WHERE (@userId IS NULL OR userId = @userId)
      AND (@isRead IS NULL OR isRead = @isRead)
      AND (@type IS NULL OR type = @type)
      AND (@search IS NULL OR title LIKE '%' + @search + '%' OR content LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH DECLARE @E NVARCHAR(4000)=ERROR_MESSAGE(); DECLARE @S INT=ERROR_SEVERITY(); DECLARE @St INT=ERROR_STATE(); RAISERROR(@E,@S,@St); END CATCH
END
