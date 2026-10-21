-- ĐĂNG KÝ HỘI VIÊN (bước xác minh thành công) — ghi ĐA BẢNG trong MỘT TRANSACTION.
-- Yêu cầu thầy: transaction + TRY/CATCH cho tác vụ nhiều thao tác.
--
-- Thao tác nguyên tử: tạo User -> sinh mã Member -> tạo Member -> tạo Notification
-- chào mừng -> xoá yêu cầu EmailVerification. Nếu bất kỳ bước nào fail -> ROLLBACK
-- toàn bộ (không để lại User mồ côi thiếu Member).
--
-- Re-check race-condition bên trong transaction: email/phone có thể bị dùng giữa lúc
-- Node đọc và lúc SP chạy -> THROW để rollback, Node map thành 409 Conflict.
--
-- bcrypt.compare(code) vẫn ở Node (SQL Server không có bcrypt) — SP nhận dữ liệu
-- đã được Node xác thực hợp lệ.
CREATE OR ALTER PROCEDURE sp_auth_confirm_member_registration
    @email          VARCHAR(100),
    @passwordHash   VARCHAR(255),
    @fullName       NVARCHAR(255),
    @phone          VARCHAR(30),
    @gender         VARCHAR(10),
    @dateOfBirth    DATETIME2 = NULL,
    @address        NVARCHAR(500) = NULL,
    @emergencyContact NVARCHAR(255) = NULL,
    @branchId       UNIQUEIDENTIFIER,
    @verificationId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- lỗi runtime -> tự rollback transaction

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1) Re-check email chưa bị dùng (tránh đua điều kiện)
        IF EXISTS (SELECT 1 FROM users WHERE email = @email)
            THROW 51000, 'Email này đã được sử dụng', 1;

        -- 2) Re-check phone chưa bị dùng
        IF EXISTS (SELECT 1 FROM users WHERE phone = @phone)
            THROW 51001, 'Số điện thoại này đã được dùng cho tài khoản khác', 1;

        -- 3) Re-check yêu cầu xác minh còn tồn tại + chưa hết hạn
        IF NOT EXISTS (
            SELECT 1 FROM email_verifications
            WHERE id = @verificationId AND expiresAt > SYSUTCDATETIME()
        )
            THROW 51002, 'Yêu cầu xác minh không tồn tại hoặc đã hết hạn', 1;

        -- 4) Tạo User (role MEMBER) — id do DEFAULT newsequentialid() sinh.
        -- Dung OUTPUT INSERTED.id vi id la uniqueidentifier (khong phai identity) -> SCOPE_IDENTITY() khong dung.
        DECLARE @userOut TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO users (email, passwordHash, fullName, phone, role, status, branchId)
        OUTPUT INSERTED.id INTO @userOut
        VALUES (@email, @passwordHash, @fullName, @phone, 'MEMBER', 'ACTIVE', @branchId);
        DECLARE @userId UNIQUEIDENTIFIER = (SELECT id FROM @userOut);

        -- 5) Sinh mã hội viên MEM-0001 (bỏ qua mã đã tồn tại — không đụng khi xoá)
        DECLARE @code VARCHAR(30);
        DECLARE @i INT = 1;
        DECLARE @candidate VARCHAR(30);
        WHILE @i <= 500
        BEGIN
            SET @candidate = 'MEM-' + RIGHT('0000' + CAST(@i AS VARCHAR(10)), 4);
            IF NOT EXISTS (SELECT 1 FROM members WHERE code = @candidate)
            BEGIN
                SET @code = @candidate;
                BREAK;
            END
            SET @i = @i + 1;
        END
        IF @code IS NULL
            SET @code = 'MEM-' + RIGHT(CAST(CAST(DATEDIFF_BIG(DAY, '1900-01-01', SYSUTCDATETIME()) AS BIGINT) * 100 + 100 AS VARCHAR(20)), 8);

        -- 6) Tạo Member liên kết User — dung OUTPUT INSERTED.id (uniqueidentifier, khong phai identity)
        DECLARE @memberOut TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO members (
            userId, code, fullName, email, phone, gender,
            dateOfBirth, address, emergencyContact, branchId, status
        )
        OUTPUT INSERTED.id INTO @memberOut
        VALUES (
            @userId, @code, @fullName, @email, @phone, @gender,
            @dateOfBirth, @address, @emergencyContact, @branchId, 'ACTIVE'
        );
        DECLARE @memberId UNIQUEIDENTIFIER = (SELECT id FROM @memberOut);

        -- 7) Thông báo chào mừng
        DECLARE @welcomeContent NVARCHAR(2000) =
            N'Xin chào ' + @fullName + N'! Tài khoản hội viên của bạn đã được xác minh email và tạo thành công. Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của mình.';
        INSERT INTO notifications (memberId, title, content, type, link)
        VALUES (@memberId, N'Chào mừng bạn đến với GymMaster Pro 💪', @welcomeContent, 'SYSTEM', '/member/membership');

        -- 8) Xoá yêu cầu xác minh đã dùng
        DELETE FROM email_verifications WHERE id = @verificationId;

        COMMIT TRANSACTION;

        -- Trả kết quả cho Node (user + member như Prisma $transaction trả về)
        SELECT
            @userId   AS userId,
            @memberId AS memberId,
            @code     AS memberCode,
            @email    AS userEmail,
            @fullName AS userFullName,
            @phone    AS userPhone,
            'MEMBER'  AS userRole,
            'ACTIVE'  AS userStatus,
            @branchId AS userBranchId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW; -- lan truyền lỗi gốc -> Node map sang HttpException
    END CATCH
END
