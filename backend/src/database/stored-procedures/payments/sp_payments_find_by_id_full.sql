CREATE OR ALTER PROCEDURE [dbo].[sp_payments_find_by_id_full]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT p.id, p.code, p.memberId, p.membershipId, p.promotionId, p.amount, p.method, p.status,
           p.notes, p.confirmedById,
           ms.id AS membership_id, ms.status AS membership_status, ms.endDate AS membership_endDate,
           mp.name AS package_name,
           m.id AS member_id, m.fullName AS member_fullName
    FROM dbo.payments p
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.members m ON p.memberId = m.id
    WHERE p.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
