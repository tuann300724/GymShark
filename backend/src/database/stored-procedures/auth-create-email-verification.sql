-- Tạo/ghi đè yêu cầu đăng ký (bước 1 send-code):
--   1) dọn yêu cầu cũ của email này,  2) dọn yêu cầu hết hạn cũ,  3) INSERT bản mới.
-- Gộp trong 1 transaction để không để lại trạng thái nửa vời.
CREATE OR ALTER PROCEDURE sp_auth_create_email_verification
    @email            VARCHAR(100),
    @fullName         NVARCHAR(255),
    @phone            VARCHAR(30),
    @passwordHash     VARCHAR(255),
    @codeHash         VARCHAR(255),
    @gender           VARCHAR(10),
    @dateOfBirth      DATETIME2 = NULL,
    @address          NVARCHAR(500) = NULL,
    @emergencyContact NVARCHAR(255) = NULL,
    @branchId         UNIQUEIDENTIFIER,
    @expiresAt        DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dọn yêu cầu cũ đã hết hạn (quá grace) để bảng không phình vô hạn
        DELETE FROM email_verifications
        WHERE expiresAt < DATEADD(HOUR, -6, SYSUTCDATETIME());

        -- Ghi đè yêu cầu đang chờ của email này (mỗi email 1 mã còn hiệu lực)
        DELETE FROM email_verifications WHERE email = @email;

        DECLARE @out TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO email_verifications (
            email, fullName, phone, passwordHash, codeHash, gender,
            dateOfBirth, address, emergencyContact, branchId,
            attempts, expiresAt, lastSentAt
        )
        OUTPUT INSERTED.id INTO @out
        VALUES (
            @email, @fullName, @phone, @passwordHash, @codeHash, @gender,
            @dateOfBirth, @address, @emergencyContact, @branchId,
            0, @expiresAt, SYSUTCDATETIME()
        );
        DECLARE @id UNIQUEIDENTIFIER = (SELECT id FROM @out);

        COMMIT TRANSACTION;
        SELECT @id AS id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
