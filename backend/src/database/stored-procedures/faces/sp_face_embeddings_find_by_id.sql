CREATE OR ALTER PROCEDURE [dbo].[sp_face_embeddings_find_by_id]
  @id UNIQUEIDENTIFIER
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT id, memberId, embedding, imageData, consentAt, createdAt, updatedAt
    FROM dbo.face_embeddings
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
