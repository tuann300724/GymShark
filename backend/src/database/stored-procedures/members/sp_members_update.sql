CREATE OR ALTER PROCEDURE [dbo].[sp_members_update]
  @id UNIQUEIDENTIFIER,
  @fullName NVARCHAR(255) = NULL,
  @email VARCHAR(100) = NULL,
  @phone VARCHAR(30) = NULL,
  @gender VARCHAR(10) = NULL,
  @dateOfBirth DATETIME2 = NULL,
  @address NVARCHAR(500) = NULL,
  @avatarUrl VARCHAR(500) = NULL,
  @status VARCHAR(20) = NULL,
  @notes NVARCHAR(2000) = NULL,
  @emergencyContact NVARCHAR(255) = NULL,
  @joinedAt DATETIME2 = NULL,
  @setEmail BIT = 0
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    UPDATE dbo.members
    SET
      fullName = ISNULL(@fullName, fullName),
      email = CASE WHEN @setEmail = 1 THEN @email ELSE email END,
      phone = ISNULL(@phone, phone),
      gender = ISNULL(@gender, gender),
      dateOfBirth = ISNULL(@dateOfBirth, dateOfBirth),
      address = ISNULL(@address, address),
      avatarUrl = ISNULL(@avatarUrl, avatarUrl),
      status = ISNULL(@status, status),
      notes = ISNULL(@notes, notes),
      emergencyContact = ISNULL(@emergencyContact, emergencyContact),
      joinedAt = ISNULL(@joinedAt, joinedAt),
      updatedAt = GETDATE()
    OUTPUT INSERTED.*
    WHERE id = @id;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
