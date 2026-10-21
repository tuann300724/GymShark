CREATE OR ALTER PROCEDURE [dbo].[sp_payments_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT p.id, p.code, p.memberId, p.membershipId, p.promotionId, p.amount, p.discountAmount,
           p.currency, p.method, p.status, p.transactionRef, p.notes, p.confirmedById,
           p.confirmedAt, p.paidAt, p.createdAt, p.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName,
           m.email AS member_email, m.phone AS member_phone, m.address AS member_address,
           m.gender AS member_gender, m.joinedAt AS member_joinedAt,
           b.id AS branch_id, b.name AS branch_name, b.code AS branch_code,
           ms.id AS membership_id, ms.startDate AS membership_startDate, ms.endDate AS membership_endDate,
           ms.status AS membership_status, ms.price AS membership_price,
           mp.id AS package_id, mp.name AS package_name, mp.durationDays AS package_durationDays,
           mp.price AS package_price, mp.description AS package_description, mp.type AS package_type,
           pr.id AS promotion_id, pr.code AS promotion_code, pr.name AS promotion_name,
           pr.discountType AS promotion_discountType, pr.discountValue AS promotion_discountValue,
           u.id AS confirmedBy_id, u.fullName AS confirmedBy_fullName, u.role AS confirmedBy_role,
           inv.id AS invoice_id, inv.invoiceNumber, inv.memberId AS invoice_memberId,
           inv.membershipId AS invoice_membershipId, inv.paymentId AS invoice_paymentId,
           inv.subtotal AS invoice_subtotal, inv.discount AS invoice_discount, inv.total AS invoice_total,
           inv.status AS invoice_status, inv.issuedAt AS invoice_issuedAt, inv.dueDate AS invoice_dueDate,
           inv.createdAt AS invoice_createdAt
    FROM dbo.payments p
    LEFT JOIN dbo.members m ON p.memberId = m.id
    LEFT JOIN dbo.branches b ON m.branchId = b.id
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.promotions pr ON p.promotionId = pr.id
    LEFT JOIN dbo.users u ON p.confirmedById = u.id
    LEFT JOIN dbo.invoices inv ON inv.paymentId = p.id
    WHERE p.id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
