CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_list]
  @page INT = 1,
  @limit INT = 20,
  @search NVARCHAR(100) = NULL,
  @status VARCHAR(20) = NULL,
  @specialization NVARCHAR(100) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT t.id, t.userId, t.specialization, t.certification, t.experienceYears,
           t.bio, t.gender, t.dateOfBirth, t.rating, t.hourlyRate, t.status,
           t.createdAt, t.updatedAt,
           u.id AS user_id, u.email AS user_email, u.fullName AS user_fullName,
           u.phone AS user_phone, u.avatarUrl AS user_avatarUrl, u.status AS user_status,
           u.branchId AS user_branchId,
           (SELECT COUNT(*) FROM dbo.trainer_members tm WHERE tm.trainerId = t.id AND tm.status = 'ACTIVE') AS activeMemberCount,
           (SELECT COUNT(*) FROM dbo.training_schedules s WHERE s.trainerId = t.id) AS scheduleCount
    FROM dbo.trainers t
    LEFT JOIN dbo.users u ON t.userId = u.id
    WHERE (@status IS NULL OR t.status = @status)
      AND (@specialization IS NULL OR t.specialization LIKE '%' + @specialization + '%')
      AND (@branchId IS NULL OR u.branchId = @branchId)
      AND (@search IS NULL OR @search = '' OR
           ISNULL(u.fullName,'') LIKE '%' + @search + '%' OR
           ISNULL(u.email,'') LIKE '%' + @search + '%' OR
           ISNULL(u.phone,'') LIKE '%' + @search + '%')
    ORDER BY t.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
