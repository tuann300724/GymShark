-- TẠO TÀI KẢN GOOGLE (lần đầu đăng nhập OAuth) — User + Member + Notification trong MỘT TRANSACTION.
-- Mật khẩu random (bcrypt ở Node) — tài khoản này chỉ đăng nhập Google, không dùng mật khẩu.
CREATE OR ALTER PROCEDURE sp_auth_create_google_member
    @email        VARCHAR(100),
    @passwordHash VARCHAR(255),
    @fullName     NVARCHAR(255),
    @branchId     UNIQUEIDENTIFIER,
    @avatarUrl    VARCHAR(500) = NULL,
    @providerId   VARCHAR(64),
    @memberPhone  VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM users WHERE email = @email)
            THROW 51000, 'Email này đã được sử dụng', 1;

        DECLARE @userOut TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO users (email, passwordHash, fullName, role, status, branchId, avatarUrl, provider, providerId)
        OUTPUT INSERTED.id INTO @userOut
        VALUES (@email, @passwordHash, @fullName, 'MEMBER', 'ACTIVE', @branchId, @avatarUrl, 'GOOGLE', @providerId);
        DECLARE @userId UNIQUEIDENTIFIER = (SELECT id FROM @userOut);

        -- Sinh mã hội viên MEM-xxxx (bỏ qua mã đã tồn tại)
        DECLARE @code VARCHAR(30);
        DECLARE @i INT = 1;
        DECLARE @candidate VARCHAR(30);
        SET @code = NULL;
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

        DECLARE @memberOut TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO members (userId, code, fullName, email, phone, branchId, status)
        OUTPUT INSERTED.id INTO @memberOut
        VALUES (@userId, @code, @fullName, @email, @memberPhone, @branchId, 'ACTIVE');
        DECLARE @memberId UNIQUEIDENTIFIER = (SELECT id FROM @memberOut);

        DECLARE @welcomeContent NVARCHAR(2000) =
            N'Xin chào ' + @fullName + N'! Tài khoản hội viên của bạn đã được tạo qua đăng nhập Google. Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của mình.';
        INSERT INTO notifications (memberId, title, content, type, link)
        VALUES (@memberId, N'Chào mừng bạn đến với GymMaster Pro 💪', @welcomeContent, 'SYSTEM', '/member/membership');

        COMMIT TRANSACTION;

        SELECT
            @userId AS id, @email AS email, @fullName AS fullName,
            'MEMBER' AS role, 'ACTIVE' AS status, @branchId AS branchId,
            @avatarUrl AS avatarUrl, 'GOOGLE' AS provider, @providerId AS providerId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
