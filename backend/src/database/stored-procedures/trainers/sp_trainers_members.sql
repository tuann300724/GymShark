CREATE OR ALTER PROCEDURE [dbo].[sp_trainers_members]
  @trainerId UNIQUEIDENTIFIER,
  @limit INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@limit) tm.id, tm.trainerId, tm.memberId, tm.startDate, tm.endDate, tm.note, tm.status, tm.createdAt, tm.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName, m.phone AS member_phone, m.avatarUrl AS member_avatarUrl,
           u.id AS member_user_id, u.fullName AS member_user_fullName, u.avatarUrl AS member_user_avatarUrl,
           mem.id AS membership_id, mem.endDate AS membership_endDate, mem.remainingSessions AS membership_remainingSessions,
           pkg.id AS package_id, pkg.name AS package_name
    FROM dbo.trainer_members tm
    LEFT JOIN dbo.members m ON tm.memberId = m.id
    LEFT JOIN dbo.users u ON m.userId = u.id
    LEFT JOIN dbo.memberships mem ON mem.memberId = m.id AND mem.status = 'ACTIVE'
    LEFT JOIN dbo.membership_packages pkg ON mem.packageId = pkg.id
    WHERE tm.trainerId = @trainerId
    ORDER BY tm.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
