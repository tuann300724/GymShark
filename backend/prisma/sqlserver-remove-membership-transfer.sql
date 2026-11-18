-- Remove transfer-only columns while preserving refund and freeze requests.
-- Refuse to drop transfer history if any request has already been recorded.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.MembershipChangeRequest', N'U') IS NOT NULL
BEGIN
  DECLARE @historyPredicate NVARCHAR(MAX) =
    N'type = N''TRANSFER'' OR status = N''PENDING_RECIPIENT_ACCEPTANCE''';
  DECLARE @historySql NVARCHAR(MAX);

  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'transferMemberId') IS NOT NULL
    SET @historyPredicate += N' OR transferMemberId IS NOT NULL';
  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'newMembershipId') IS NOT NULL
    SET @historyPredicate += N' OR newMembershipId IS NOT NULL';
  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'recipientAcceptedAt') IS NOT NULL
    SET @historyPredicate += N' OR recipientAcceptedAt IS NOT NULL';

  SET @historySql =
    N'IF EXISTS (SELECT 1 FROM dbo.MembershipChangeRequest WHERE ' +
    @historyPredicate +
    N') THROW 51000, ''Transfer request history exists; preserve and review it before removing transfer columns.'', 1;';
  EXEC sys.sp_executesql @historySql;

  IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
      AND name = N'FK_MembershipChangeRequest_TransferMember'
  )
    ALTER TABLE dbo.MembershipChangeRequest
      DROP CONSTRAINT FK_MembershipChangeRequest_TransferMember;

  IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
      AND name = N'FK_MembershipChangeRequest_NewMembership'
  )
    ALTER TABLE dbo.MembershipChangeRequest
      DROP CONSTRAINT FK_MembershipChangeRequest_NewMembership;

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
      AND name = N'IX_MembershipChangeRequest_transferMemberId_status'
  )
    DROP INDEX IX_MembershipChangeRequest_transferMemberId_status
      ON dbo.MembershipChangeRequest;

  IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
      AND name = N'IX_MembershipChangeRequest_newMembershipId'
  )
    DROP INDEX IX_MembershipChangeRequest_newMembershipId
      ON dbo.MembershipChangeRequest;

  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'transferMemberId') IS NOT NULL
    ALTER TABLE dbo.MembershipChangeRequest DROP COLUMN transferMemberId;

  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'newMembershipId') IS NOT NULL
    ALTER TABLE dbo.MembershipChangeRequest DROP COLUMN newMembershipId;

  IF COL_LENGTH(N'dbo.MembershipChangeRequest', N'recipientAcceptedAt') IS NOT NULL
    ALTER TABLE dbo.MembershipChangeRequest DROP COLUMN recipientAcceptedAt;
END;

COMMIT TRANSACTION;
