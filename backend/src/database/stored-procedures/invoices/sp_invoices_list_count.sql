CREATE OR ALTER PROCEDURE [dbo].[sp_invoices_list_count]
  @status VARCHAR(20) = NULL,
  @from DATETIME2 = NULL,
  @to DATETIME2 = NULL,
  @search NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT COUNT(*) AS total
    FROM dbo.invoices inv
    LEFT JOIN dbo.members m ON inv.memberId = m.id
    WHERE (@status IS NULL OR inv.status = @status)
      AND (@from IS NULL OR inv.issuedAt >= @from)
      AND (@to IS NULL OR inv.issuedAt <= @to)
      AND (@search IS NULL OR @search = '' OR
           inv.invoiceNumber LIKE '%' + @search + '%' OR
           ISNULL(m.fullName,'') LIKE '%' + @search + '%' OR
           ISNULL(m.email,'') LIKE '%' + @search + '%' OR
           ISNULL(m.code,'') LIKE '%' + @search + '%');
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
