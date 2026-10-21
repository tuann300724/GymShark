CREATE OR ALTER PROCEDURE [dbo].[sp_equipment_find_one]
  @id UNIQUEIDENTIFIER
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    SELECT
      e.id, e.code, e.name, e.category, e.brand, e.model, e.status, e.[condition],
      e.serialNumber, e.purchaseDate, e.purchasePrice, e.warrantyExpiry,
      e.lastMaintenanceAt, e.nextMaintenanceAt, e.description,
      e.branchId, e.roomId, e.createdAt, e.updatedAt,
      b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
      b.address AS branch_address, b.phone AS branch_phone, b.email AS branch_email,
      b.description AS branch_description, b.openingTime AS branch_openingTime,
      b.closingTime AS branch_closingTime, b.openingHours AS branch_openingHours,
      b.status AS branch_status, b.createdAt AS branch_createdAt, b.updatedAt AS branch_updatedAt,
      r.id AS room_id, r.code AS room_code, r.name AS room_name,
      r.type AS room_type, r.capacity AS room_capacity, r.floor AS room_floor,
      r.description AS room_description, r.status AS room_status,
      r.createdAt AS room_createdAt, r.updatedAt AS room_updatedAt,
      m.id AS maint_id, m.type AS maint_type, m.maintenanceDate, m.cost AS maint_cost,
      m.description AS maint_description, m.performedBy AS maint_performedBy,
      m.status AS maint_status, m.nextDueDate AS maint_nextDueDate,
      m.createdAt AS maint_createdAt, m.updatedAt AS maint_updatedAt,
      me.id AS maint_equipment_id, me.code AS maint_equipment_code, me.name AS maint_equipment_name
    FROM dbo.equipment e
    LEFT JOIN dbo.branches b ON e.branchId = b.id
    LEFT JOIN dbo.rooms r ON e.roomId = r.id
    LEFT JOIN dbo.equipment_maintenances m ON m.equipmentId = e.id
    LEFT JOIN dbo.equipment me ON me.id = m.equipmentId
    WHERE e.id = @id
    ORDER BY m.maintenanceDate DESC, ISNULL(m.createdAt, '1900-01-01') DESC;
  END TRY
  BEGIN CATCH
    DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
  END CATCH
END
