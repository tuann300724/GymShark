CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_create]
  @id UNIQUEIDENTIFIER,
  @trainerId UNIQUEIDENTIFIER,
  @memberId UNIQUEIDENTIFIER,
  @branchId UNIQUEIDENTIFIER,
  @roomId UNIQUEIDENTIFIER,
  @title NVARCHAR(255),
  @description NVARCHAR(2000) = NULL,
  @type VARCHAR(30) = 'PERSONAL_TRAINING',
  @startTime DATETIME2,
  @endTime DATETIME2,
  @status VARCHAR(20) = 'SCHEDULED'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.training_schedules (
      id, trainerId, memberId, branchId, roomId, type, title, description,
      startTime, endTime, status, createdAt, updatedAt
    )
    OUTPUT INSERTED.id, INSERTED.trainerId, INSERTED.memberId, INSERTED.branchId,
           INSERTED.roomId, INSERTED.type, INSERTED.title, INSERTED.description,
           INSERTED.startTime, INSERTED.endTime, INSERTED.status, INSERTED.createdAt, INSERTED.updatedAt
    VALUES (
      @id, @trainerId, @memberId, @branchId, @roomId, @type, @title, @description,
      @startTime, @endTime, @status, GETDATE(), GETDATE()
    );
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
