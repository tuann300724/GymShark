CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price,
           ms.discountAmount, ms.finalAmount, ms.remainingSessions, ms.status,
           ms.createdAt, ms.updatedAt,
           m.id AS member_id, m.code AS member_code, m.userId AS member_userId,
           m.fullName AS member_fullName, m.email AS member_email, m.phone AS member_phone,
           m.gender AS member_gender, m.dateOfBirth AS member_dateOfBirth, m.address AS member_address,
           m.avatarUrl AS member_avatarUrl, m.status AS member_status, m.notes AS member_notes,
           m.emergencyContact AS member_emergencyContact, m.joinedAt AS member_joinedAt,
           m.branchId AS member_branchId, m.createdAt AS member_createdAt, m.updatedAt AS member_updatedAt,
           p.id AS package_id, p.code AS package_code, p.name AS package_name,
           p.description AS package_description, p.features AS package_features,
           p.durationDays AS package_durationDays, p.price AS package_price,
           p.sessions AS package_sessions, p.type AS package_type, p.status AS package_status,
           p.allowedBranches AS package_allowedBranches,
           p.createdAt AS package_createdAt, p.updatedAt AS package_updatedAt
    FROM dbo.memberships ms
    LEFT JOIN dbo.members m ON ms.memberId = m.id
    LEFT JOIN dbo.membership_packages p ON ms.packageId = p.id
    WHERE ms.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
