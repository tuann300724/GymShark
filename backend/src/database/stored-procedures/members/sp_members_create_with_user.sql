CREATE OR ALTER PROCEDURE [dbo].[sp_members_create_with_user]
  @email VARCHAR(100),
  @passwordHash VARCHAR(255),
  @fullName NVARCHAR(255),
  @phone VARCHAR(30),
  @branchId UNIQUEIDENTIFIER,
  @code VARCHAR(30),
  @gender VARCHAR(10) = 'MALE',
  @dateOfBirth DATETIME2 = NULL,
  @address NVARCHAR(500) = NULL,
  @emergencyContact NVARCHAR(255) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @userId UNIQUEIDENTIFIER;
    DECLARE @memberId UNIQUEIDENTIFIER;

    INSERT INTO dbo.users (email, passwordHash, fullName, phone, role, status, provider, branchId, createdAt, updatedAt)
    VALUES (@email, @passwordHash, @fullName, @phone, 'MEMBER', 'ACTIVE', 'LOCAL', @branchId, GETDATE(), GETDATE());

    SET @userId = (SELECT id FROM dbo.users WHERE email = @email);

    INSERT INTO dbo.members (userId, code, fullName, email, phone, gender, dateOfBirth,
                             address, emergencyContact, status, branchId, createdAt, updatedAt)
    VALUES (@userId, @code, @fullName, @email, @phone, @gender, @dateOfBirth,
            @address, @emergencyContact, 'ACTIVE', @branchId, GETDATE(), GETDATE());

    SET @memberId = (SELECT id FROM dbo.members WHERE userId = @userId);

    INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt)
    VALUES (@memberId, N'Chào mừng đến với GymShark 🎉',
            N'Tài khoản hội viên của bạn đã được tạo tại quầy. Hãy đăng nhập để xem thẻ tập, lịch tập và đăng ký khuôn mặt nhận diện nhanh tại quầy.',
            'SYSTEM', '/member', 0, GETDATE());

    COMMIT TRANSACTION;

    SELECT @userId AS userId, @memberId AS memberId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
