CREATE OR ALTER PROCEDURE [dbo].[sp_face_embeddings_delete]
  @memberId UNIQUEIDENTIFIER
AS BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DELETE FROM dbo.face_embeddings WHERE memberId = @memberId;
    SELECT @@ROWCOUNT AS deletedCount;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
