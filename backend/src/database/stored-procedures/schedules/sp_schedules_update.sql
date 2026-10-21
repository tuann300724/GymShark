CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_update]
  @id UNIQUEIDENTIFIER,
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @roomId UNIQUEIDENTIFIER = NULL,
  @title NVARCHAR(255) = NULL,
  @description NVARCHAR(2000) = NULL,
  @type VARCHAR(30) = NULL,
  @startTime VARCHAR(100) = NULL,
  @endTime VARCHAR(100) = NULL,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.training_schedules
    SET trainerId = ISNULL(@trainerId, trainerId),
        memberId = ISNULL(@memberId, memberId),
        branchId = ISNULL(@branchId, branchId),
        roomId = ISNULL(@roomId, roomId),
        type = ISNULL(@type, type),
        title = ISNULL(@title, title),
        description = ISNULL(@description, description),
        startTime = ISNULL(@startTime, startTime),
        endTime = ISNULL(@endTime, endTime),
        status = ISNULL(@status, status),
        updatedAt = GETDATE()
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END