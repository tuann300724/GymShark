-- Gửi lại mã: cập nhật codeHash + expiresAt + reset attempts + lastSentAt = now.
CREATE OR ALTER PROCEDURE sp_auth_resend_email_verification
    @id        UNIQUEIDENTIFIER,
    @codeHash  VARCHAR(255),
    @expiresAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE email_verifications
        SET codeHash = @codeHash,
            expiresAt = @expiresAt,
            lastSentAt = SYSUTCDATETIME(),
            attempts = 0,
            updatedAt = SYSUTCDATETIME()
        WHERE id = @id;

        IF @@ROWCOUNT = 0
            THROW 51004, 'Không tìm thấy yêu cầu đăng ký đang chờ', 1;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
