-- Dọn yêu cầu xác minh đã hết hạn (quá grace period) — gọi định kỳ khi có yêu cầu mới.
CREATE OR ALTER PROCEDURE sp_auth_cleanup_expired_verifications
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM email_verifications
        WHERE expiresAt < DATEADD(HOUR, -6, SYSUTCDATETIME());
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
