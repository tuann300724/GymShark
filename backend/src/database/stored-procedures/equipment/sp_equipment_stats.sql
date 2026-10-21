CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_stats]
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @now DATETIME2 = SYSUTCDATETIME();
    DECLARE @startOfMonth DATETIME2 = DATEFROMPARTS(YEAR(@now), MONTH(@now), 1);

    SELECT 'total' AS metric, '' AS [key], CAST((SELECT COUNT(*) FROM dbo.equipment) AS INT) AS [value]
    UNION ALL SELECT 'byStatus', 'AVAILABLE', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'AVAILABLE'
    UNION ALL SELECT 'byStatus', 'IN_USE', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'IN_USE'
    UNION ALL SELECT 'byStatus', 'MAINTENANCE', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'MAINTENANCE'
    UNION ALL SELECT 'byStatus', 'BROKEN', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'BROKEN'
    UNION ALL SELECT 'byStatus', 'RETIRED', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'RETIRED'
    UNION ALL SELECT 'byCondition', 'EXCELLENT', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE [condition] = 'EXCELLENT'
    UNION ALL SELECT 'byCondition', 'GOOD', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE [condition] = 'GOOD'
    UNION ALL SELECT 'byCondition', 'FAIR', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE [condition] = 'FAIR'
    UNION ALL SELECT 'byCondition', 'POOR', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE [condition] = 'POOR'
    UNION ALL SELECT 'overdue', '', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE nextMaintenanceAt IS NOT NULL AND nextMaintenanceAt < @now AND status IN ('AVAILABLE','IN_USE','MAINTENANCE')
    UNION ALL SELECT 'upcoming', '', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE nextMaintenanceAt IS NOT NULL AND nextMaintenanceAt >= @now AND nextMaintenanceAt <= DATEADD(DAY, 14, @now) AND status IN ('AVAILABLE','IN_USE')
    UNION ALL SELECT 'broken', '', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE status = 'BROKEN'
    UNION ALL SELECT 'warrantyExpiring', '', CAST(COUNT(*) AS INT) FROM dbo.equipment WHERE warrantyExpiry IS NOT NULL AND warrantyExpiry >= @now AND warrantyExpiry <= DATEADD(DAY, 30, @now) AND status <> 'RETIRED'
    UNION ALL SELECT 'maintenanceThisMonth', '', CAST(COUNT(*) AS INT) FROM dbo.equipment_maintenances WHERE maintenanceDate >= @startOfMonth;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
