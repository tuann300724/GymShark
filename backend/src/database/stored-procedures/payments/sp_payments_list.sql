CREATE OR ALTER PROCEDURE [dbo].[sp_payments_list]
  @page INT = 1,
  @limit INT = 20,
  @status VARCHAR(20) = NULL,
  @method VARCHAR(20) = NULL,
  @memberId UNIQUEIDENTIFIER = NULL,
  @packageId UNIQUEIDENTIFIER = NULL,
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL,
  @search NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;

    SELECT p.id, p.code, p.memberId, p.membershipId, p.promotionId, p.amount, p.discountAmount,
           p.currency, p.method, p.status, p.transactionRef, p.notes, p.confirmedById,
           p.confirmedAt, p.paidAt, p.createdAt, p.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName,
           m.email AS member_email, m.phone AS member_phone,
           ms.id AS membership_id, mp.id AS package_id, mp.name AS package_name,
           pr.id AS promotion_id, pr.code AS promotion_code, pr.name AS promotion_name,
           inv.id AS invoice_id, inv.invoiceNumber, inv.status AS invoice_status,
           u.id AS confirmedBy_id, u.fullName AS confirmedBy_fullName
    FROM dbo.payments p
    LEFT JOIN dbo.members m ON p.memberId = m.id
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.promotions pr ON p.promotionId = pr.id
    LEFT JOIN dbo.invoices inv ON inv.paymentId = p.id
    LEFT JOIN dbo.users u ON p.confirmedById = u.id
    WHERE (@status IS NULL OR p.status = @status)
      AND (@method IS NULL OR p.method = @method)
      AND (@memberId IS NULL OR p.memberId = @memberId)
      AND (@packageId IS NULL OR ms.packageId = @packageId)
      AND (@from IS NULL OR p.createdAt >= @from)
      AND (@to IS NULL OR p.createdAt <= @to)
      AND (@search IS NULL OR @search = '' OR
           p.code LIKE '%' + @search + '%' OR
           ISNULL(p.transactionRef,'') LIKE '%' + @search + '%' OR
           ISNULL(m.fullName,'') LIKE '%' + @search + '%' OR
           ISNULL(m.email,'') LIKE '%' + @search + '%' OR
           ISNULL(m.phone,'') LIKE '%' + @search + '%' OR
           ISNULL(m.code,'') LIKE '%' + @search + '%' OR
           ISNULL(inv.invoiceNumber,'') LIKE '%' + @search + '%')
    ORDER BY p.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
