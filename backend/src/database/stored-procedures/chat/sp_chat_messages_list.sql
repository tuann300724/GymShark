CREATE OR ALTER PROCEDURE [dbo].[sp_chat_messages_list]
  @conversationId UNIQUEIDENTIFIER,
  @page INT = 1,
  @limit INT = 30
AS BEGIN
  SET NOCOUNT ON;
  DECLARE @offset INT = (@page - 1) * @limit;
  BEGIN TRY
    SELECT m.id, m.conversationId, m.senderId, m.type, m.content, m.isRead, m.readAt, m.mealPlanId, m.createdAt, m.updatedAt,
           s.id AS sender_id, s.fullName AS sender_fullName, s.avatarUrl AS sender_avatarUrl, s.role AS sender_role
    FROM dbo.messages m LEFT JOIN dbo.users s ON m.senderId = s.id
    WHERE m.conversationId = @conversationId
    ORDER BY m.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END