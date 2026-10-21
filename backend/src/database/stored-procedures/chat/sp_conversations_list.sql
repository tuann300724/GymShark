CREATE OR ALTER PROCEDURE [dbo].[sp_conversations_list]
  @userId UNIQUEIDENTIFIER,
  @limit INT = 50
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) c.id, c.trainerId, c.memberId, c.lastMessageAt, c.createdAt, c.updatedAt
    FROM dbo.conversations c
    WHERE c.trainerId = @userId OR c.memberId = @userId
    ORDER BY c.lastMessageAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END