CREATE OR ALTER PROCEDURE [dbo].[sp_payments_list_count]
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
    SELECT COUNT(DISTINCT p.id) AS total
    FROM dbo.payments p
    LEFT JOIN dbo.members m ON p.memberId = m.id
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    LEFT JOIN dbo.invoices inv ON inv.paymentId = p.id
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
           ISNULL(inv.invoiceNumber,'') LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
