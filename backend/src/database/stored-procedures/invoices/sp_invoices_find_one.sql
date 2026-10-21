CREATE OR ALTER PROCEDURE [dbo].[sp_invoices_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT inv.id, inv.invoiceNumber, inv.memberId, inv.membershipId, inv.paymentId,
           inv.subtotal, inv.discount, inv.total, inv.status, inv.issuedAt, inv.dueDate,
           inv.createdAt, inv.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName,
           m.email AS member_email, m.phone AS member_phone, m.address AS member_address,
           b.id AS branch_id, b.name AS branch_name, b.code AS branch_code,
           ms.id AS membership_id, ms.startDate AS membership_startDate, ms.endDate AS membership_endDate,
           ms.status AS membership_status, ms.price AS membership_price,
           mp.id AS package_id, mp.name AS package_name, mp.durationDays AS package_durationDays,
           mp.price AS package_price, mp.description AS package_description, mp.type AS package_type,
           p.id AS payment_id, p.code AS payment_code, p.method AS payment_method, p.status AS payment_status,
           p.amount AS payment_amount, p.paidAt AS payment_paidAt, p.transactionRef AS payment_transactionRef,
           u.id AS confirmedBy_id, u.fullName AS confirmedBy_fullName, u.role AS confirmedBy_role
    FROM dbo.invoices inv
    LEFT JOIN dbo.members m ON inv.memberId = m.id
    LEFT JOIN dbo.branches b ON m.branchId = b.id
    LEFT JOIN dbo.memberships ms ON inv.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.payments p ON inv.paymentId = p.id
    LEFT JOIN dbo.users u ON p.confirmedById = u.id
    WHERE inv.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
