CREATE OR ALTER PROCEDURE [dbo].[sp_invoices_list_by_member]
  @userId UNIQUEIDENTIFIER,
  @page INT = 1,
  @limit INT = 20,
  @status VARCHAR(20) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;
    DECLARE @memberId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.members WHERE userId = @userId);

    SELECT inv.id, inv.invoiceNumber, inv.memberId, inv.membershipId, inv.paymentId,
           inv.subtotal, inv.discount, inv.total, inv.status, inv.issuedAt, inv.dueDate,
           inv.createdAt, inv.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName,
           m.email AS member_email, m.phone AS member_phone,
           mp.id AS package_id, mp.name AS package_name,
           p.code AS payment_code, p.method AS payment_method, p.status AS payment_status, p.paidAt AS payment_paidAt
    FROM dbo.invoices inv
    LEFT JOIN dbo.members m ON inv.memberId = m.id
    LEFT JOIN dbo.memberships ms ON inv.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.payments p ON inv.paymentId = p.id
    WHERE (@memberId IS NULL OR inv.memberId = @memberId)
      AND (@status IS NULL OR inv.status = @status)
    ORDER BY inv.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
