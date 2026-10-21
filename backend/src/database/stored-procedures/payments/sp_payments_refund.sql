CREATE OR ALTER PROCEDURE [dbo].[sp_payments_refund]
  @id UNIQUEIDENTIFIER,
  @actorId UNIQUEIDENTIFIER,
  @reason NVARCHAR(500) = NULL,
  @deactivateMembership BIT = 0
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
    DECLARE @paymentCode VARCHAR(30);
    DECLARE @notes NVARCHAR(1000);
    DECLARE @membershipStatus VARCHAR(20);
    DECLARE @packageName NVARCHAR(255);

    SELECT @memberId = p.memberId, @membershipId = p.membershipId, @promotionId = p.promotionId,
           @paymentStatus = p.status, @paymentCode = p.code, @notes = p.notes,
           @membershipStatus = ms.status, @packageName = mp.name
    FROM dbo.payments p
    LEFT JOIN dbo.memberships ms ON p.membershipId = ms.id
    LEFT JOIN dbo.membership_packages mp ON ms.packageId = mp.id
    WHERE p.id = @id;

    IF @memberId IS NULL
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50001, N'Không tìm thấy giao dịch thanh toán', 1;
    END

    IF @paymentStatus <> 'PAID'
    BEGIN
      ROLLBACK TRANSACTION;
      ;THROW 50002, N'Chỉ giao dịch đã thanh toán (PAID) mới hoàn tiền được', 1;
    END

    UPDATE dbo.payments
    SET status = 'REFUNDED',
        confirmedById = @actorId,
        confirmedAt = @now,
        notes = ISNULL(@notes + ' | ' + N'Hoàn tiền' + CASE WHEN @reason IS NOT NULL THEN N': ' + @reason ELSE N'' END, N'Hoàn tiền' + CASE WHEN @reason IS NOT NULL THEN N': ' + @reason ELSE N'' END),
        updatedAt = @now
    WHERE id = @id;

    UPDATE dbo.invoices SET status = 'CANCELLED', updatedAt = @now WHERE paymentId = @id AND status = 'PAID';

    IF @promotionId IS NOT NULL
    BEGIN
      UPDATE dbo.promotions SET usedCount = CASE WHEN ISNULL(usedCount,0) > 0 THEN usedCount - 1 ELSE 0 END, updatedAt = @now WHERE id = @promotionId;
    END

    IF @deactivateMembership = 1 AND @membershipId IS NOT NULL AND @membershipStatus = 'ACTIVE'
    BEGIN
      UPDATE dbo.memberships SET status = 'CANCELLED', updatedAt = @now WHERE id = @membershipId;
    END

    INSERT INTO dbo.notifications (memberId, title, content, type, link, isRead, createdAt, referenceType, referenceId)
    VALUES (@memberId, N'Đã hoàn tiền 💸',
            N'Hóa đơn ' + @paymentCode + CASE WHEN @packageName IS NOT NULL THEN N' (' + @packageName + N')' ELSE N'' END + N' đã được hoàn tiền. ' + ISNULL(N'Lý do: ' + @reason, N''),
            'PAYMENT', '/member/payments', 0, @now, 'PAYMENT_REFUNDED', @id);

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
