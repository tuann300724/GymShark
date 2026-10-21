CREATE OR ALTER PROCEDURE [dbo].[sp_chat_messages_create]
  @id UNIQUEIDENTIFIER,
  @conversationId UNIQUEIDENTIFIER,
  @senderId UNIQUEIDENTIFIER,
  @type VARCHAR(20) = 'TEXT',
  @content NVARCHAR(4000) = NULL,
  @mealPlanId UNIQUEIDENTIFIER = NULL
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.messages (id, conversationId, senderId, type, content, mealPlanId, isRead, createdAt, updatedAt)
    OUTPUT INSERTED.id, INSERTED.conversationId, INSERTED.senderId, INSERTED.type, INSERTED.content, INSERTED.mealPlanId, INSERTED.isRead, INSERTED.createdAt, INSERTED.updatedAt
    VALUES (@id, @conversationId, @senderId, @type, @content, @mealPlanId, 0, GETDATE(), GETDATE());
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END