CREATE OR ALTER PROCEDURE [dbo].[sp_members_find_by_user_id]
  @userId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT m.id, m.code, m.userId, m.fullName, m.email, m.phone,
           m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
           m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt,
           b.id AS branch_id, b.name AS branch_name, b.code AS branch_code,
           u.id AS user_id, u.email AS user_email, u.status AS user_status
    FROM dbo.members m
    LEFT JOIN dbo.branches b ON m.branchId = b.id
    LEFT JOIN dbo.users u ON m.userId = u.id
    WHERE m.userId = @userId;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
