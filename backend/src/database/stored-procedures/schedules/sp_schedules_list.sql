CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_list]
  @page INT = 1,
  @limit INT = 20,
  @branchId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberName NVARCHAR(255) = NULL,
  @trainerName NVARCHAR(255) = NULL,
  @startTime DATETIME2 = NULL,
  @endTime DATETIME2 = NULL,
  @status VARCHAR(20) = NULL,
  @type VARCHAR(30) = NULL,
  @search NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;

    SELECT ts.id, ts.trainerId, ts.memberId, ts.branchId, ts.roomId, ts.type,
           ts.title, ts.description, ts.startTime, ts.endTime, ts.status,
           ts.createdAt, ts.updatedAt,
           u.fullName AS trainerName,
           m.fullName AS memberName,
           r.name AS roomName,
           b.name AS branchName
    FROM dbo.training_schedules ts
    LEFT JOIN dbo.trainers t ON ts.trainerId = t.id
    LEFT JOIN dbo.users u ON t.userId = u.id
    LEFT JOIN dbo.members m ON ts.memberId = m.id
    LEFT JOIN dbo.rooms r ON ts.roomId = r.id
    LEFT JOIN dbo.branches b ON ts.branchId = b.id
    WHERE (@trainerId IS NULL OR ts.trainerId = @trainerId)
      AND (@memberId IS NULL OR ts.memberId = @memberId)
      AND (@branchId IS NULL OR ts.branchId = @branchId)
      AND (@memberName IS NULL OR m.fullName LIKE '%' + @memberName + '%')
      AND (@trainerName IS NULL OR u.fullName LIKE '%' + @trainerName + '%')
      AND (@startTime IS NULL OR ts.startTime >= @startTime)
      AND (@endTime IS NULL OR ts.endTime <= @endTime)
      AND (@status IS NULL OR ts.status = @status)
      AND (@type IS NULL OR ts.type = @type)
      AND (@search IS NULL OR
           ts.title LIKE '%' + @search + '%' OR
           ts.description LIKE '%' + @search + '%' OR
           u.fullName LIKE '%' + @search + '%' OR
           m.fullName LIKE '%' + @search + '%')
    ORDER BY ts.startTime ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
