CREATE OR ALTER PROCEDURE [dbo].[sp_notifications_create]
  @id UNIQUEIDENTIFIER = NULL,
  @userId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @title NVARCHAR(255),
  @content NVARCHAR(2000),
  @type VARCHAR(30) = 'SYSTEM',
  @link VARCHAR(500) = NULL,
  @referenceType VARCHAR(50) = NULL,
  @referenceId UNIQUEIDENTIFIER = NULL,
  @data NVARCHAR(MAX) = NULL,
  @isRead BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    IF @id IS NULL SET @id = NEWID();
    INSERT INTO dbo.notifications (id, userId, memberId, title, content, type, link, isRead, referenceType, referenceId, data, createdAt)
    OUTPUT INSERTED.id
    VALUES (@id, @userId, @memberId, @title, @content, @type, @link, @isRead, @referenceType, @referenceId, @data, GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
