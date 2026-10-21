CREATE OR ALTER PROCEDURE [dbo].[sp_members_create]
  @userId UNIQUEIDENTIFIER = NULL,
  @code VARCHAR(30),
  @fullName NVARCHAR(255),
  @email VARCHAR(100) = NULL,
  @phone VARCHAR(30),
  @gender VARCHAR(10) = 'MALE',
  @dateOfBirth DATETIME2 = NULL,
  @address NVARCHAR(500) = NULL,
  @avatarUrl VARCHAR(500) = NULL,
  @status VARCHAR(20) = 'ACTIVE',
  @notes NVARCHAR(2000) = NULL,
  @emergencyContact NVARCHAR(255) = NULL,
  @joinedAt DATETIME2 = NULL,
  @branchId UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    INSERT INTO dbo.members (
      userId, code, fullName, email, phone, gender, dateOfBirth,
      address, avatarUrl, status, notes, emergencyContact, joinedAt,
      branchId, createdAt, updatedAt
    )
    OUTPUT INSERTED.id, INSERTED.code, INSERTED.fullName, INSERTED.email, INSERTED.phone,
           INSERTED.status, INSERTED.branchId, INSERTED.userId
    VALUES (
      @userId, @code, @fullName, @email, @phone, @gender, @dateOfBirth,
      @address, @avatarUrl, @status, @notes, @emergencyContact, @joinedAt,
      @branchId, GETDATE(), GETDATE()
    );
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
