CREATE OR ALTER PROCEDURE [dbo].[sp_payments_confirm]
  @id UNIQUEIDENTIFIER,
  @actorId UNIQUEIDENTIFIER,
  @transactionRef NVARCHAR(100) = NULL,
  @note NVARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @now DATETIME2 = GETDATE();
    DECLARE @memberId UNIQUEIDENTIFIER;
    DECLARE @membershipId UNIQUEIDENTIFIER;
    DECLARE @promotionId UNIQUEIDENTIFIER;
    DECLARE @paymentStatus VARCHAR(20);
    DECLARE @membershipStatus VARCHAR(20);
    DECLARE @paymentCode VARCHAR(30);
    DECLARE @notes NVARCHAR(1000);

    SELECT @memberId = p.memberId, @membershipId = p.membershipId, @promotionId = p.promotionId,
           @paymentStatus = p.status, @paymentCode = p.code, @notes = p.notes,
           @membershipStatus = ms.status
    FROM dbo.payments p
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    WHERE p.id = @id;

    IF @memberId IS NULL
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50001, N'Không tìm thấy giao dịch thanh toán', 1;
    END

    IF @paymentStatus <> 'PENDING'
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50002, N'Chỉ hóa đơn đang chờ (PENDING) mới có thể xác nhận', 1;
    END

    -- Cập nhật payment
    UPDATE dbo.payments
    SET status = 'PAID',
        paidAt = @now,
        confirmedById = @actorId,
        confirmedAt = @now,
        transactionRef = ISNULL(@transactionRef, transactionRef),
        notes = CASE WHEN @note IS NOT NULL THEN ISNULL(@notes + ' | ' + @note, @note) ELSE notes END,
        updatedAt = @now
    WHERE id = @id;

    -- Tăng lượt dùng promotion
    IF @promotionId IS NOT NULL
    BEGIN
      UPDATE dbo.promotions SET usedCount = ISNULL(usedCount,0) + 1, updatedAt = @now WHERE id = @promotionId;
    END

    -- Kích hoạt membership nếu đang PENDING
    IF @membershipId IS NOT NULL AND @membershipStatus = 'PENDING'
    BEGIN
      UPDATE dbo.memberships SET status = 'ACTIVE', updatedAt = @now WHERE id = @membershipId;
    END

    -- Cập nhật invoice
    UPDATE dbo.invoices SET status = 'PAID', updatedAt = @now WHERE paymentId = @id AND status = 'ISSUED';

    -- Thông báo
    DECLARE @memberIdForNotif UNIQUEIDENTIFIER = @memberId;
    INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt, referenceType, referenceId)
    VALUES (@memberIdForNotif, N'Thanh toán thành công ✅',
            N'Hóa đơn ' + @paymentCode + N' đã được xác nhận.',
            'PAYMENT', '/member/payments', 0, @now, 'PAYMENT_CONFIRMED', @id);

    COMMIT TRANSACTION;

    SELECT p.id, p.code, p.memberId, p.membershipId, p.promotionId, p.amount, p.discountAmount,
           p.currency, p.method, p.status, p.transactionRef, p.notes, p.confirmedById,
           p.confirmedAt, p.paidAt, p.createdAt, p.updatedAt
    FROM dbo.payments p WHERE p.id = @id;

    SELECT ms.id, ms.memberId, ms.packageId, ms.startDate, ms.endDate, ms.price,
           ms.discountAmount, ms.finalAmount, ms.remainingSessions, ms.status, ms.createdAt, ms.updatedAt
    FROM dbo.memberships ms WHERE ms.id = @membershipId;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
