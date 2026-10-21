-- Tạo tài khoản user (register nhân viên/ admin tạo) — kiểm tra email trùng ngay trong SP.
-- Trả về user vừa tạo như Prisma .create({select}).
CREATE OR ALTER PROCEDURE sp_auth_create_user
    @email        VARCHAR(100),
    @passwordHash VARCHAR(255),
    @fullName     NVARCHAR(255),
    @phone        VARCHAR(30) = NULL,
    @role         VARCHAR(20),
    @branchId     UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM users WHERE email = @email)
            THROW 51000, 'Email này đã được sử dụng', 1;

        DECLARE @out TABLE (id UNIQUEIDENTIFIER);
        INSERT INTO users (email, passwordHash, fullName, phone, role, status, branchId)
        OUTPUT INSERTED.id INTO @out
        VALUES (@email, @passwordHash, @fullName, @phone, @role, 'ACTIVE', @branchId);
        DECLARE @id UNIQUEIDENTIFIER = (SELECT id FROM @out);

        COMMIT TRANSACTION;
        SELECT id, email, fullName, role, status, branchId, createdAt
        FROM users WHERE id = @id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
