CREATE OR ALTER PROCEDURE [dbo].[sp_checkins_create]
  @memberId UNIQUEIDENTIFIER,
  @branchId UNIQUEIDENTIFIER,
  @checkInTime DATETIME2,
  @method VARCHAR(20) = 'FACE_ID'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @id UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.check_ins (id, memberId, branchId, checkInTime, method, status, createdAt, updatedAt)
    VALUES (@id, @memberId, @branchId, @checkInTime, @method, 'COMPLETED', GETDATE(), GETDATE());
    COMMIT TRANSACTION;
    SELECT id, memberId, branchId, checkInTime, method, status, createdAt FROM dbo.check_ins WHERE id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrorMsg, 16, 1);
  END CATCH
END