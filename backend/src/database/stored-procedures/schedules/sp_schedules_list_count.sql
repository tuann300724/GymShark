CREATE OR ALTER PROCEDURE [dbo].[sp_schedules_list_count]
  @trainerId UNIQUEIDENTIFIER = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @startTime DATETIME2 = NULL,
  @endTime DATETIME2 = NULL,
  @status VARCHAR(20) = NULL,
  @type VARCHAR(30) = NULL,
  @search NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.training_schedules ts
    LEFT JOIN dbo.trainers t ON ts.trainerId = t.id
    LEFT JOIN dbo.users u ON t.userId = u.id
    LEFT JOIN dbo.members m ON ts.memberId = m.id
    WHERE (@trainerId IS NULL OR ts.trainerId = @trainerId)
      AND (@memberId IS NULL OR ts.memberId = @memberId)
      AND (@branchId IS NULL OR ts.branchId = @branchId)
      AND (@startTime IS NULL OR ts.startTime >= @startTime)
      AND (@endTime IS NULL OR ts.endTime <= @endTime)
      AND (@status IS NULL OR ts.status = @status)
      AND (@type IS NULL OR ts.type = @type)
      AND (@search IS NULL OR
           ts.title LIKE '%' + @search + '%' OR
           ts.description LIKE '%' + @search + '%' OR
           u.fullName LIKE '%' + @search + '%' OR
           m.fullName LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
