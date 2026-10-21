CREATE OR ALTER PROCEDURE [dbo].[sp_members_memberships]
  @memberId UNIQUEIDENTIFIER,
  @top INT = 100
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT TOP (@top)
           ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price,
           ms.discountAmount, ms.finalAmount, ms.remainingSessions, ms.status,
           ms.createdAt, ms.updatedAt,
           p.id AS package_id, p.code AS package_code, p.name AS package_name,
           p.description AS package_description, p.durationDays AS package_durationDays,
           p.price AS package_price, p.sessions AS package_sessions, p.type AS package_type,
           p.status AS package_status, p.features AS package_features,
           p.allowedBranches AS package_allowedBranches
    FROM dbo.memberships ms
    LEFT JOIN dbo.membership_packages p ON ms.packageId = p.id
    WHERE ms.memberId = @memberId
    ORDER BY ms.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
