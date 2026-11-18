-- Add membership cancellation/refund, freeze, transfer, and PT accounting fields.
-- Safe to run repeatedly; existing memberships and payment history remain unchanged.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.MembershipPackage', N'ptSessionValue') IS NULL
  ALTER TABLE dbo.MembershipPackage ADD ptSessionValue DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Membership', N'ptSessionsIncluded') IS NULL
  ALTER TABLE dbo.Membership ADD ptSessionsIncluded INT NULL;

IF COL_LENGTH(N'dbo.Membership', N'ptSessionsUsed') IS NULL
  ALTER TABLE dbo.Membership ADD ptSessionsUsed INT NOT NULL
    CONSTRAINT DF_Membership_ptSessionsUsed DEFAULT (0);

IF COL_LENGTH(N'dbo.Membership', N'ptSessionValue') IS NULL
  ALTER TABLE dbo.Membership ADD ptSessionValue DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Membership', N'freezeStartedAt') IS NULL
  ALTER TABLE dbo.Membership ADD freezeStartedAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.Membership', N'freezeEndsAt') IS NULL
  ALTER TABLE dbo.Membership ADD freezeEndsAt DATETIME2 NULL;

IF COL_LENGTH(N'dbo.TrainingSchedule', N'membershipId') IS NULL
  ALTER TABLE dbo.TrainingSchedule ADD membershipId UNIQUEIDENTIFIER NULL;

IF OBJECT_ID(N'dbo.MembershipChangeRequest', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.MembershipChangeRequest (
    id UNIQUEIDENTIFIER NOT NULL,
    membershipId UNIQUEIDENTIFIER NOT NULL,
    memberId UNIQUEIDENTIFIER NOT NULL,
    type NVARCHAR(40) NOT NULL,
    status NVARCHAR(50) NOT NULL
      CONSTRAINT DF_MembershipChangeRequest_status DEFAULT (N'REQUESTED'),
    reason NVARCHAR(MAX) NULL,
    reviewNote NVARCHAR(MAX) NULL,
    freezeDays INT NULL,
    freezeStartsAt DATETIME2 NULL,
    freezeEndsAt DATETIME2 NULL,
    ptSessionsUsed INT NULL,
    proposedRefundAmount DECIMAL(12, 2) NULL,
    proposedRefundReason NVARCHAR(MAX) NULL,
    refundAmount DECIMAL(12, 2) NULL,
    refundMethod NVARCHAR(40) NULL,
    refundReference NVARCHAR(400) NULL,
    memberConfirmedAt DATETIME2 NULL,
    reviewedAt DATETIME2 NULL,
    reviewedById UNIQUEIDENTIFIER NULL,
    approvedAt DATETIME2 NULL,
    approvedById UNIQUEIDENTIFIER NULL,
    completedAt DATETIME2 NULL,
    completedById UNIQUEIDENTIFIER NULL,
    createdAt DATETIME2 NOT NULL
      CONSTRAINT DF_MembershipChangeRequest_createdAt DEFAULT (SYSUTCDATETIME()),
    updatedAt DATETIME2 NOT NULL
      CONSTRAINT DF_MembershipChangeRequest_updatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_MembershipChangeRequest PRIMARY KEY (id),
    CONSTRAINT FK_MembershipChangeRequest_Membership
      FOREIGN KEY (membershipId) REFERENCES dbo.Membership(id),
    CONSTRAINT FK_MembershipChangeRequest_Member
      FOREIGN KEY (memberId) REFERENCES dbo.Member(id),
    CONSTRAINT FK_MembershipChangeRequest_ReviewedBy
      FOREIGN KEY (reviewedById) REFERENCES dbo.[User](id),
    CONSTRAINT FK_MembershipChangeRequest_ApprovedBy
      FOREIGN KEY (approvedById) REFERENCES dbo.[User](id),
    CONSTRAINT FK_MembershipChangeRequest_CompletedBy
      FOREIGN KEY (completedById) REFERENCES dbo.[User](id)
  );
END;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.TrainingSchedule')
    AND name = N'IX_TrainingSchedule_membershipId'
)
  CREATE INDEX IX_TrainingSchedule_membershipId
    ON dbo.TrainingSchedule(membershipId);

IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys
  WHERE parent_object_id = OBJECT_ID(N'dbo.TrainingSchedule')
    AND name = N'FK_TrainingSchedule_Membership'
)
  ALTER TABLE dbo.TrainingSchedule
    ADD CONSTRAINT FK_TrainingSchedule_Membership
    FOREIGN KEY (membershipId) REFERENCES dbo.Membership(id) ON DELETE SET NULL;

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
    AND name = N'IX_MembershipChangeRequest_membershipId_type_status'
)
  CREATE INDEX IX_MembershipChangeRequest_membershipId_type_status
    ON dbo.MembershipChangeRequest(membershipId, type, status);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'dbo.MembershipChangeRequest')
    AND name = N'IX_MembershipChangeRequest_memberId_status'
)
  CREATE INDEX IX_MembershipChangeRequest_memberId_status
    ON dbo.MembershipChangeRequest(memberId, status);

COMMIT TRANSACTION;
