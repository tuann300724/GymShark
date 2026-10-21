CREATE OR ALTER PROCEDURE [dbo].[sp_memberships_extend]
  @id UNIQUEIDENTIFIER,
  @days INT,
  @paymentCode VARCHAR(30),
  @reason NVARCHAR(1000) = NULL,
  @notificationContent NVARCHAR(2000)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @memberId UNIQUEIDENTIFIER;
    DECLARE @packageId UNIQUEIDENTIFIER;
    DECLARE @packagePrice DECIMAL(12,2);
    DECLARE @packageName NVARCHAR(255);
    DECLARE @curStatus VARCHAR(20);
    DECLARE @endDate DATETIME2;

    SELECT @memberId = ms.memberId,
           @packageId = ms.packageId,
           @curStatus = ms.status,
           @endDate = ms.endDate,
           @packagePrice = p.price,
           @packageName = p.name
    FROM dbo.memberships ms
    LEFT JOIN dbo.membership_packages p ON ms.packageId = p.id
    WHERE ms.id = @id;

    IF @memberId IS NULL
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50001, N'Không tìm thấy hợp đồng/thẻ hội viên', 1;
    END

    DECLARE @newEndDate DATETIME2 = DATEADD(DAY, @days, @endDate);
    DECLARE @newStatus VARCHAR(20) = CASE WHEN @curStatus = 'PENDING' THEN 'ACTIVE' ELSE @curStatus END;

    UPDATE dbo.memberships
    SET endDate = @newEndDate, status = @newStatus, updatedAt = GETDATE()
    WHERE id = @id;

    DECLARE @paymentId UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.payments (id, code, memberId, membershipId, amount, currency, method, status, notes, createdAt, updatedAt)
    VALUES (@paymentId, @paymentCode, @memberId, @id, @packagePrice, 'VND', 'CASH', 'PENDING',
            N'Gia hạn bởi quản trị viên (+' + CAST(@days AS NVARCHAR(10)) + N' ngày)' +
            CASE WHEN @reason IS NOT NULL THEN N' - ' + @reason ELSE N'' END,
            GETDATE(), GETDATE());

    INSERT INTO dbo.invoices (invoiceNumber, memberId, membershipId, paymentId, subtotal, discount, total,
                              status, issuedAt, dueDate, createdAt, updatedAt)
    VALUES (@paymentCode, @memberId, @id, @paymentId, @packagePrice, 0, @packagePrice,
            'ISSUED', GETDATE(), DATEADD(DAY, 7, @newEndDate), GETDATE(), GETDATE());

    INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt)
    VALUES (@memberId, N'Gói tập được gia hạn bởi lễ tân 🔄', @notificationContent, 'MEMBERSHIP', '/member/membership', 0, GETDATE());

    COMMIT TRANSACTION;

    SELECT ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price, ms.discountAmount,
           ms.finalAmount, ms.remainingSessions, ms.status, ms.createdAt, ms.updatedAt
    FROM dbo.memberships ms WHERE ms.id = @id;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
