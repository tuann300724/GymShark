CREATE OR ALTER PROCEDURE [dbo].[sp_chat_messages_mark_read]
  @conversationId UNIQUEIDENTIFIER,
  @userId UNIQUEIDENTIFIER
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.messages
    SET isRead = 1, readAt = GETDATE(), updatedAt = GETDATE()
    WHERE conversationId = @conversationId AND senderId <> @userId AND isRead = 0;
    SELECT @@ROWCOUNT AS readCount;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
