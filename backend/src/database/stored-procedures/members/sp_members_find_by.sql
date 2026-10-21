CREATE OR ALTER PROCEDURE [dbo].[sp_members_find_by]
  @field NVARCHAR(50) = 'id',
  @value NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    IF @field = 'id'
      SELECT TOP 1 m.id, m.code, m.userId, m.fullName, m.email, m.phone,
        m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
        m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt
      FROM dbo.members m WHERE m.id = @value;
    ELSE IF @field = 'userId'
      SELECT TOP 1 m.id, m.code, m.userId, m.fullName, m.email, m.phone,
        m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
        m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt
      FROM dbo.members m WHERE m.userId = @value;
    ELSE IF @field = 'code'
      SELECT TOP 1 m.id, m.code, m.userId, m.fullName, m.email, m.phone,
        m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
        m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt
      FROM dbo.members m WHERE m.code = @value;
    ELSE IF @field = 'email'
      SELECT TOP 1 m.id, m.code, m.userId, m.fullName, m.email, m.phone,
        m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
        m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt
      FROM dbo.members m WHERE m.email = @value;
    ELSE IF @field = 'phone'
      SELECT TOP 1 m.id, m.code, m.userId, m.fullName, m.email, m.phone,
        m.gender, m.dateOfBirth, m.address, m.avatarUrl, m.status, m.notes,
        m.emergencyContact, m.joinedAt, m.branchId, m.createdAt, m.updatedAt
      FROM dbo.members m WHERE m.phone = @value;
  END TRY
  BEGIN CATCH
    THROW;
  END CATCH
END
