CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_list]
  @page INT = 1,
  @limit INT = 20,
  @search NVARCHAR(255) = NULL,
  @category NVARCHAR(100) = NULL,
  @status VARCHAR(20) = NULL,
  @condition VARCHAR(20) = NULL,
  @branchId UNIQUEIDENTIFIER = NULL,
  @roomId UNIQUEIDENTIFIER = NULL,
  @sortField VARCHAR(50) = 'createdAt',
  @sortDir VARCHAR(4) = 'desc'
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    DECLARE @offset INT = (@page - 1) * @limit;

    WITH Page AS (
      SELECT e.id, e.code, e.name, e.category, e.brand, e.model, e.status,
             e.[condition], e.serialNumber, e.purchaseDate, e.purchasePrice,
             e.warrantyExpiry, e.lastMaintenanceAt, e.nextMaintenanceAt,
             e.description, e.branchId, e.roomId, e.createdAt, e.updatedAt
      FROM dbo.equipment e
      WHERE (@branchId IS NULL OR e.branchId = @branchId)
        AND (@status IS NULL OR e.status = @status)
        AND (@category IS NULL OR e.category = @category)
        AND (@condition IS NULL OR e.[condition] = @condition)
        AND (@roomId IS NULL OR e.roomId = @roomId)
        AND (@search IS NULL OR e.name LIKE '%' + @search + '%' OR e.code LIKE '%' + @search + '%'
             OR e.brand LIKE '%' + @search + '%' OR e.model LIKE '%' + @search + '%'
             OR e.serialNumber LIKE '%' + @search + '%')
      ORDER BY
        CASE WHEN @sortDir = 'desc' AND @sortField = 'createdAt' THEN e.createdAt END DESC,
        CASE WHEN @sortDir = 'asc' AND @sortField = 'createdAt' THEN e.createdAt END ASC,
        CASE WHEN @sortDir = 'desc' AND @sortField = 'code' THEN e.code END DESC,
        CASE WHEN @sortDir = 'asc' AND @sortField = 'code' THEN e.code END ASC,
        CASE WHEN @sortDir = 'desc' AND @sortField = 'name' THEN e.name END DESC,
        CASE WHEN @sortDir = 'asc' AND @sortField = 'name' THEN e.name END ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    )
    SELECT
      p.id, p.code, p.name, p.category, p.brand, p.model, p.status,
      p.[condition], p.serialNumber, p.purchaseDate, p.purchasePrice,
      p.warrantyExpiry, p.lastMaintenanceAt, p.nextMaintenanceAt,
      p.description, p.branchId, p.roomId, p.createdAt, p.updatedAt,
      b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
      r.id AS room_id, r.code AS room_code, r.name AS room_name,
      m.id AS maint_id, m.equipmentId AS maint_equipmentId, m.type AS maint_type,
      m.maintenanceDate AS maint_maintenanceDate, m.cost AS maint_cost,
      m.description AS maint_description, m.performedBy AS maint_performedBy,
      m.status AS maint_status, m.nextDueDate AS maint_nextDueDate,
      m.createdAt AS maint_createdAt, m.updatedAt AS maint_updatedAt
    FROM Page p
    LEFT JOIN dbo.branches b ON p.branchId = b.id
    LEFT JOIN dbo.rooms r ON p.roomId = r.id
    LEFT JOIN (
      SELECT mm.*, ROW_NUMBER() OVER (PARTITION BY mm.equipmentId ORDER BY mm.maintenanceDate DESC, mm.createdAt DESC) AS rn
      FROM dbo.equipment_maintenances mm
    ) m ON m.equipmentId = p.id AND m.rn <= 3
    ORDER BY
      CASE WHEN @sortDir = 'desc' AND @sortField = 'createdAt' THEN p.createdAt END DESC,
      CASE WHEN @sortDir = 'asc' AND @sortField = 'createdAt' THEN p.createdAt END ASC,
      CASE WHEN @sortDir = 'desc' AND @sortField = 'code' THEN p.code END DESC,
      CASE WHEN @sortDir = 'asc' AND @sortField = 'code' THEN p.code END ASC,
      CASE WHEN @sortDir = 'desc' AND @sortField = 'name' THEN p.name END DESC,
      CASE WHEN @sortDir = 'asc' AND @sortField = 'name' THEN p.name END ASC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
