CREATE OR ALTER PROCEDURE [dbo].[sp_members_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT m.id, m.code, m.userId, m.fullName, m.email, m.phone, m.gender,
           m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
           m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt,
           b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
           b.address AS branch_address, b.phone AS branch_phone, b.email AS branch_email,
           b.description AS branch_description, b.openingTime AS branch_openingTime,
           b.closingTime AS branch_closingTime, b.openingHours AS branch_openingHours,
           b.status AS branch_status, b.createdAt AS branch_createdAt, b.updatedAt AS branch_updatedAt,
           u.id AS user_id, u.email AS user_email, u.role AS user_role, u.status AS user_status,
           u.avatarUrl AS user_avatarUrl
    FROM dbo.members m
    LEFT JOIN dbo.branches b ON m.branchId = b.id
    LEFT JOIN dbo.users u ON m.userId = u.id
    WHERE m.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
