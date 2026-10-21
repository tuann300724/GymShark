CREATE OR ALTER PROCEDURE [dbo].[sp_invoices_list]
  @page INT = 1,
  @limit INT = 20,
  @status VARCHAR(20) = NULL,
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL,
  @search NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;

    SELECT inv.id, inv.invoiceNumber, inv.memberId, inv.membershipId, inv.paymentId,
           inv.subtotal, inv.discount, inv.total, inv.status, inv.issuedAt, inv.dueDate,
           inv.createdAt, inv.updatedAt,
           m.id AS member_id, m.code AS member_code, m.fullName AS member_fullName,
           m.email AS member_email, m.phone AS member_phone,
           mp.id AS package_id, mp.name AS package_name,
           p.id AS payment_id, p.code AS payment_code, p.method AS payment_method,
           p.status AS payment_status, p.paidAt AS payment_paidAt
    FROM dbo.invoices inv
    LEFT JOIN dbo.members m ON inv.memberId = m.id
    LEFT JOIN dbo.memberships ms ON inv.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    LEFT JOIN dbo.payments p ON inv.paymentId = p.id
    WHERE (@status IS NULL OR inv.status = @status)
      AND (@from IS NULL OR inv.issuedAt >= @from)
      AND (@to IS NULL OR inv.issuedAt <= @to)
      AND (@search IS NULL OR @search = '' OR
           inv.invoiceNumber LIKE '%' + @search + '%' OR
           ISNULL(m.fullName,'') LIKE '%' + @search + '%' OR
           ISNULL(m.email,'') LIKE '%' + @search + '%' OR
           ISNULL(m.code,'') LIKE '%' + @search + '%')
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
