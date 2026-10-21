CREATE OR ALTER PROCEDURE [dbo].[sp_notifications_create]
  @userId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @title NVARCHAR(255),
  @content NVARCHAR(MAX),
  @type VARCHAR(50) = 'SYSTEM',
  @link VARCHAR(500) = NULL,
  @referenceType VARCHAR(50) = NULL,
  @referenceId UNIQUEIDENTIFIER = NULL,
  @data NVARCHAR(MAX) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.notifications (userId, memberId, title, content, type, link, referenceType, referenceId, data, isRead, createdAt)
    OUTPUT INSERTED.id
    VALUES (@userId, @memberId, @title, @content, @type, @link, @referenceType, @referenceId, @data, 0, GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
