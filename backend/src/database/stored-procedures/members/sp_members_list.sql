CREATE OR ALTER PROCEDURE [dbo].[sp_members_list]
  @page INT = 1,
  @limit INT = 20,
  @search NVARCHAR(255) = NULL,
  @status NVARCHAR(50) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @membershipStatus NVARCHAR(50) = NULL,
  @packageId UNIQUEIDENTIFIER = NULL,
  @sortField NVARCHAR(50) = 'createdAt',
  @sortDir NVARCHAR(4) = 'desc'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;

    SELECT m.id, m.code, m.userId, m.fullName, m.email, m.phone, m.gender,
           m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
           m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt,
           b.id AS branch_id, b.name AS branch_name, b.code AS branch_code,
           u.id AS user_id, u.email AS user_email, u.status AS user_status
    FROM dbo.members m
    LEFT JOIN dbo.branches b ON m.branchId = b.id
    LEFT JOIN dbo.users u ON m.userId = u.id
    WHERE (@search IS NULL OR m.fullName LIKE '%' + @search + '%' OR m.email LIKE '%' + @search + '%'
             OR m.phone LIKE '%' + @search + '%' OR m.code LIKE '%' + @search + '%')
      AND (@status IS NULL OR m.status = @status)
      AND (@branchId IS NULL OR m.branchId = @branchId)
      AND (@membershipStatus IS NULL OR EXISTS (
            SELECT 1 FROM dbo.memberships ms WHERE ms.memberId = m.id AND ms.status = @membershipStatus))
      AND (@packageId IS NULL OR EXISTS (
            SELECT 1 FROM dbo.memberships ms WHERE ms.memberId = m.id AND ms.packageId = @packageId))
    ORDER BY
      CASE WHEN @sortField = 'name' AND @sortDir = 'asc' THEN m.fullName END ASC,
      CASE WHEN @sortField = 'name' AND @sortDir = 'desc' THEN m.fullName END DESC,
      CASE WHEN @sortField = 'code' AND @sortDir = 'asc' THEN m.code END ASC,
      CASE WHEN @sortField = 'code' AND @sortDir = 'desc' THEN m.code END DESC,
      CASE WHEN @sortField = 'joinedAt' AND @sortDir = 'asc' THEN m.joinedAt END ASC,
      CASE WHEN @sortField = 'joinedAt' AND @sortDir = 'desc' THEN m.joinedAt END DESC,
      CASE WHEN @sortField = 'createdAt' AND @sortDir = 'asc' THEN m.createdAt END ASC,
      CASE WHEN @sortField = 'createdAt' AND @sortDir = 'desc' THEN m.createdAt END DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
