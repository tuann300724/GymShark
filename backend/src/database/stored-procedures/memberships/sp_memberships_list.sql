CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_list]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price,
           ms.discountAmount, ms.finalAmount, ms.remainingSessions, ms.status,
           ms.createdAt, ms.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName, m.phone AS member_phone,
           p.id AS package_id, p.name AS package_name, p.durationDays AS package_durationDays,
           p.price AS package_price
    FROM dbo.memberships ms
    LEFT JOIN dbo.members m ON ms.memberId = m.id
    LEFT JOIN dbo.membership_packages p ON ms.packageId = p.id
    ORDER BY ms.createdAt DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
