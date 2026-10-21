-- Tăng số lần nhập sai mã xác minh — trả về attempts mới.
CREATE OR ALTER PROCEDURE sp_auth_increment_verification_attempts
    @id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE email_verifications
        SET attempts = attempts + 1, updatedAt = SYSUTCDATETIME()
        WHERE id = @id;

        SELECT attempts FROM email_verifications WHERE id = @id;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
