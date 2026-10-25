SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'dbo.Membership', N'U') IS NULL
    THROW 51000, 'dbo.Membership does not exist.', 1;

  IF OBJECT_ID(N'dbo.MembershipPackage', N'U') IS NULL
    THROW 51001, 'dbo.MembershipPackage does not exist.', 1;

  IF COL_LENGTH(N'dbo.Membership', N'packageId') IS NULL
    ALTER TABLE dbo.Membership ADD packageId UNIQUEIDENTIFIER NULL;

  IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Membership')
      AND c.name = N'packageId'
      AND t.name <> N'uniqueidentifier'
  )
    THROW 51002, 'Membership.packageId exists with an unexpected SQL Server type.', 1;

  IF EXISTS (
    SELECT p.price
    FROM dbo.MembershipPackage p
    GROUP BY p.price
    HAVING COUNT_BIG(*) > 1
  )
    THROW 51003, 'Package prices are not unique; membership links cannot be inferred safely.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.Membership m
    LEFT JOIN dbo.MembershipPackage p ON p.price = m.price
    WHERE m.packageId IS NULL
    GROUP BY m.id
    HAVING COUNT_BIG(p.id) <> 1
  )
    THROW 51004, 'A membership does not map to exactly one package by price; no data was changed.', 1;

  UPDATE m
  SET packageId = p.id
  FROM dbo.Membership m
  JOIN dbo.MembershipPackage p ON p.price = m.price
  WHERE m.packageId IS NULL;

  IF EXISTS (
    SELECT 1
    FROM dbo.Membership m
    WHERE m.packageId IS NULL
       OR NOT EXISTS (SELECT 1 FROM dbo.MembershipPackage p WHERE p.id = m.packageId)
  )
    THROW 51005, 'Membership package links are incomplete or invalid.', 1;

  IF EXISTS (
    SELECT 1
    FROM dbo.Membership
    WHERE startDate IS NULL
      AND createdAt IS NULL
  )
    THROW 51006, 'A membership has no start date or creation date; no data was changed.', 1;

  UPDATE dbo.Membership
  SET startDate = CONVERT(date, createdAt)
  WHERE startDate IS NULL;

  UPDATE m
  SET endDate = DATEADD(day, p.durationDays, m.startDate)
  FROM dbo.Membership m
  JOIN dbo.MembershipPackage p ON p.id = m.packageId
  WHERE m.endDate IS NULL;

  IF EXISTS (
    SELECT 1
    FROM dbo.Membership
    WHERE startDate IS NULL OR endDate IS NULL
  )
    THROW 51007, 'Membership dates could not be backfilled; no data was changed.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID(N'dbo.Membership')
      AND name = N'Membership_packageId_fkey'
  )
    ALTER TABLE dbo.Membership WITH CHECK
      ADD CONSTRAINT Membership_packageId_fkey
      FOREIGN KEY (packageId) REFERENCES dbo.MembershipPackage(id);

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes i
    JOIN sys.index_columns ic
      ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c
      ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.Membership')
      AND i.is_disabled = 0
      AND ic.key_ordinal = 1
      AND c.name = N'packageId'
  )
    CREATE INDEX Membership_packageId_idx ON dbo.Membership(packageId);

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
