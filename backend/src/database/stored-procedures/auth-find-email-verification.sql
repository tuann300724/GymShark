-- Đọc yêu cầu đăng ký đang chờ theo email — dùng cho resend + confirm (đọc để Node bcrypt.compare).
CREATE OR ALTER PROCEDURE sp_auth_find_email_verification
    @email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        SELECT TOP 1
            id, email, fullName, phone, passwordHash, codeHash,
            gender, dateOfBirth, address, emergencyContact,
            branchId, attempts, expiresAt, lastSentAt
        FROM email_verifications
        WHERE email = @email
        ORDER BY createdAt DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
