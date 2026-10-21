CREATE OR ALTER PROCEDURE [dbo].[sp_chat_conversations_list]
  @userId UNIQUEIDENTIFIER = NULL,
  @role VARCHAR(20) = NULL,
  @search NVARCHAR(255) = NULL,
  @page INT = 1,
  @limit INT = 30
AS BEGIN
  SET NOCOUNT ON;
  DECLARE @offset INT = (@page - 1) * @limit;
  BEGIN TRY
    SELECT
      c.id, c.trainerId, c.memberId, c.status, c.lastMessageAt, c.lastMessagePreview, c.lastSenderRole,
      c.createdAt, c.updatedAt,
      -- trainer info
      t.id AS trainer_id, t.userId AS trainer_userId,
      u_t.id AS trainer_user_id, u_t.fullName AS trainer_user_fullName, u_t.avatarUrl AS trainer_user_avatarUrl,
      -- member info
      m.id AS member_id, m.userId AS member_userId, m.fullName AS member_fullName,
      m.avatarUrl AS member_avatarUrl, m.code AS member_code,
      -- unread count
      (SELECT COUNT(*) FROM dbo.messages msg WHERE msg.conversationId = c.id AND msg.isRead = 0 AND msg.senderId <> @userId) AS unreadCount
    FROM dbo.conversations c
    LEFT JOIN dbo.trainers t ON c.trainerId = t.id
    LEFT JOIN dbo.users u_t ON t.userId = u_t.id
    LEFT JOIN dbo.members m ON c.memberId = m.id
    WHERE (@userId IS NULL OR c.trainerId IN (SELECT id FROM dbo.trainers WHERE userId = @userId) OR c.memberId IN (SELECT id FROM dbo.members WHERE userId = @userId))
      AND (@role IS NULL OR (@role = 'TRAINER' AND c.trainerId IN (SELECT id FROM dbo.trainers WHERE userId = @userId)) OR (@role = 'MEMBER' AND c.memberId IN (SELECT id FROM dbo.members WHERE userId = @userId)))
      AND (@search IS NULL OR c.lastMessagePreview LIKE '%' + @search + '%' OR m.fullName LIKE '%' + @search + '%')
    ORDER BY c.lastMessageAt DESC, c.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
