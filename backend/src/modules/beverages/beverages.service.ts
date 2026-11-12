import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash, randomUUID } from "crypto";
import { AuditService } from "../audit-logs/audit-logs.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CassoMatch, CassoService } from "../casso/casso.service";
import {
  BeverageProductDto,
  BeverageQueryDto,
  BeverageStockAdjustmentDto,
  CompleteBeverageSaleDto,
  CreateBeverageImportDto,
  UpdateBeverageProductDto,
} from "./dto/beverage.dto";

export interface BeverageActor {
  id: string;
  role: string;
  fullName?: string;
}

export interface ActiveShift {
  id: string;
}

type StockRow = {
  stockQuantity: Prisma.Decimal | number;
};

@Injectable()
export class BeveragesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cassoService: CassoService,
  ) {}

  private async defaultLocationId(tx?: Prisma.TransactionClient) {
    const query = Prisma.sql`
      SELECT TOP (1) id FROM dbo.Branch
      WHERE UPPER(status) = N'ACTIVE'
      ORDER BY createdAt, id
    `;
    const rows = tx
      ? await tx.$queryRaw<{ id: string }[]>(query)
      : await this.prisma.$queryRaw<{ id: string }[]>(query);
    if (!rows.length) {
      throw new BadRequestException("Chưa cấu hình địa điểm hoạt động.");
    }
    return rows[0].id;
  }

  private number(value: Prisma.Decimal | number | bigint | null | undefined) {
    return Number(value ?? 0);
  }

  private validateRange(query: BeverageQueryDto) {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException("Ngày bắt đầu không thể sau ngày kết thúc");
    }
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof Error &&
      /2601|2627|duplicate key|unique constraint/i.test(error.message)
    );
  }

  private combineSaleItems(dto: CompleteBeverageSaleDto) {
    const combined = new Map<string, number>();
    for (const item of dto.items) {
      combined.set(
        item.productId,
        (combined.get(item.productId) ?? 0) + item.quantity,
      );
    }
    return [...combined].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private async cassoSaleMatch(
    dto: CompleteBeverageSaleDto,
    items: { productId: string; quantity: number }[],
  ): Promise<CassoMatch | null> {
    if (dto.paymentMethod !== "BANK_TRANSFER") {
      throw new BadRequestException(
        "Đối soát CASSO chỉ áp dụng cho chuyển khoản.",
      );
    }
    if (!dto.cassoReference) {
      throw new BadRequestException("Thiếu mã nội dung chuyển khoản CASSO.");
    }

    const members = await this.prisma.$queryRaw<{ code: string }[]>(
      Prisma.sql`
        SELECT code FROM dbo.Member
        WHERE id = CONVERT(uniqueidentifier, ${dto.memberId})
          AND status = N'ACTIVE'
      `,
    );
    if (!members.length) {
      throw new BadRequestException(
        "Hội viên không tồn tại hoặc không hoạt động.",
      );
    }

    const productIds = items.map(
      (item) => Prisma.sql`CONVERT(uniqueidentifier, ${item.productId})`,
    );
    const products = await this.prisma.$queryRaw<
      { id: string; sellingPrice: Prisma.Decimal | number }[]
    >(Prisma.sql`
      SELECT id, sellingPrice
      FROM dbo.BeverageProduct
      WHERE status = N'ACTIVE' AND id IN (${Prisma.join(productIds)})
    `);
    if (products.length !== items.length) {
      throw new BadRequestException(
        "Một sản phẩm đã ngừng kinh doanh hoặc không tồn tại.",
      );
    }
    const priceById = new Map(
      products.map((product) => [
        product.id.toLowerCase(),
        this.number(product.sellingPrice),
      ]),
    );
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        (priceById.get(item.productId.toLowerCase()) ?? 0) * item.quantity,
      0,
    );
    const discount = dto.discountAmount ?? 0;
    if (discount > subtotal) {
      throw new BadRequestException(
        "Giảm giá không được lớn hơn tổng tiền hàng.",
      );
    }

    const rows = await this.cassoService.poll(true);
    if (!rows.length) {
      throw new BadRequestException(
        "Chưa đọc được dữ liệu CASSO. Vui lòng kiểm tra cấu hình và thử lại.",
      );
    }
    const match = this.cassoService.findMatch(
      rows,
      members[0].code,
      dto.cassoReference,
      Math.round(subtotal - discount),
    );
    if (!match?.maGd) return null;
    return match;
  }

  async verifySaleTransfer(dto: CompleteBeverageSaleDto) {
    const items = this.combineSaleItems(dto);
    const match = await this.cassoSaleMatch(dto, items);
    return match
      ? {
          matched: true,
          message: "Đã nhận được giao dịch chuyển khoản.",
        }
      : {
          matched: false,
          message:
            "Chưa thấy giao dịch tương ứng trên CASSO. Vui lòng kiểm tra nội dung và số tiền chuyển khoản.",
        };
  }

  private dateFilters(
    query: BeverageQueryDto,
    column: Prisma.Sql,
  ): Prisma.Sql[] {
    const filters: Prisma.Sql[] = [];
    if (query.from) {
      filters.push(Prisma.sql`${column} >= CAST(${query.from} AS date)`);
    }
    if (query.to) {
      filters.push(
        Prisma.sql`${column} < DATEADD(day, 1, CAST(${query.to} AS date))`,
      );
    }
    return filters;
  }

  private async activeShift(
    actor: BeverageActor,
    required: boolean,
  ): Promise<ActiveShift | null> {
    const rows = await this.prisma.$queryRaw<ActiveShift[]>(Prisma.sql`
      SELECT TOP (2)
        CONVERT(nvarchar(36), id) AS id
      FROM dbo.StaffShift
      WHERE staffId = CONVERT(uniqueidentifier, ${actor.id})
        AND UPPER(status) = N'IN_PROGRESS'
        AND startTime <= SYSDATETIME()
        AND endTime > SYSDATETIME()
      ORDER BY startTime DESC
    `);
    if (rows.length > 1) {
      throw new ConflictException(
        "Bạn có nhiều ca đang mở cùng lúc. Hãy nhờ quản lý xử lý trước.",
      );
    }
    if (!rows.length) {
      if (required) {
        throw new ForbiddenException(
          "Bạn cần bắt đầu ca làm được phân công trước khi bán nước.",
        );
      }
      return null;
    }
    return rows[0];
  }

  async options(actor: BeverageActor) {
    let activeShift: ActiveShift | null = null;
    if (actor.role === "STAFF")
      activeShift = await this.activeShift(actor, false);
    const categories = await this.prisma.$queryRaw<
      { category: string }[]
    >(Prisma.sql`
        SELECT DISTINCT category
        FROM dbo.BeverageProduct
        WHERE category IS NOT NULL AND LTRIM(RTRIM(category)) <> N''
        ORDER BY category
      `);
    return {
      categories: categories.map((item) => item.category),
      activeShift,
    };
  }

  async products(query: BeverageQueryDto, actor: BeverageActor) {
    this.validateRange(query);
    const filters: Prisma.Sql[] = [];
    if (actor.role === "STAFF" || !query.includeInactive) {
      filters.push(Prisma.sql`p.status = N'ACTIVE'`);
    }
    if (query.category)
      filters.push(Prisma.sql`p.category = ${query.category}`);
    if (query.search) {
      const like = `%${query.search.trim()}%`;
      filters.push(
        Prisma.sql`(p.code LIKE ${like} OR p.name LIKE ${like} OR p.brand LIKE ${like})`,
      );
    }
    const where = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 50);
    const offset = (page - 1) * limit;
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        p.id, p.code, p.name, p.category, p.brand, p.unit, p.volumeMl,
        p.costPrice, p.sellingPrice, p.minStock, p.status, p.description,
        COALESCE(SUM(v.stockQuantity), 0) AS stockQuantity
      FROM dbo.BeverageProduct AS p
      LEFT JOIN dbo.vw_BeverageStock AS v
        ON v.productId = p.id
      ${where}
      GROUP BY p.id, p.code, p.name, p.category, p.brand, p.unit, p.volumeMl,
        p.costPrice, p.sellingPrice, p.minStock, p.status, p.description
      ORDER BY p.name
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);
    const countRows = await this.prisma.$queryRaw<
      { total: number }[]
    >(Prisma.sql`
      SELECT CONVERT(int, COUNT(DISTINCT p.id)) AS total
      FROM dbo.BeverageProduct AS p
      ${where}
    `);
    return {
      data: rows.map((row) => ({
        ...row,
        costPrice: this.number(row.costPrice),
        sellingPrice: this.number(row.sellingPrice),
        minStock: this.number(row.minStock),
        stockQuantity: this.number(row.stockQuantity),
      })),
      total: countRows[0]?.total ?? 0,
      page,
      limit,
    };
  }

  async product(id: string, actor?: BeverageActor) {
    const staffProductFilter =
      actor?.role === "STAFF"
        ? Prisma.sql`AND p.status = N'ACTIVE'`
        : Prisma.empty;
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.id, p.code, p.name, p.category, p.brand, p.unit, p.volumeMl,
        p.costPrice, p.sellingPrice, p.minStock, p.status, p.description,
        p.createdAt, p.updatedAt,
        COALESCE(v.stockQuantity, 0) AS stockQuantity,
        CASE WHEN COALESCE(v.stockQuantity, 0) <= 0 THEN N'OUT_OF_STOCK'
             WHEN COALESCE(v.stockQuantity, 0) <= p.minStock THEN N'LOW_STOCK'
             ELSE N'IN_STOCK' END AS stockStatus
      FROM dbo.BeverageProduct AS p
      LEFT JOIN (
        SELECT productId, SUM(stockQuantity) AS stockQuantity
        FROM dbo.vw_BeverageStock
        GROUP BY productId
      ) AS v ON v.productId = p.id
      WHERE p.id = CONVERT(uniqueidentifier, ${id})
        ${staffProductFilter}
    `);
    if (!rows.length)
      throw new NotFoundException("Không tìm thấy sản phẩm nước uống");
    const first = rows[0];
    return {
      ...first,
      costPrice: this.number(first.costPrice),
      sellingPrice: this.number(first.sellingPrice),
      minStock: this.number(first.minStock),
    };
  }

  async createProduct(dto: BeverageProductDto, actor: BeverageActor) {
    if (dto.initialStock && !dto.initialStockReason?.trim()) {
      throw new BadRequestException("Tồn kho đầu kỳ cần có lý do điều chỉnh.");
    }
    const id = randomUUID();
    try {
      await this.prisma.$transaction(async (tx) => {
        const duplicate = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT TOP (1) id FROM dbo.BeverageProduct WITH (UPDLOCK, HOLDLOCK)
          WHERE code = ${dto.code.trim()}
        `);
        if (duplicate.length) {
          throw new ConflictException("Mã sản phẩm đã được sử dụng.");
        }
        const locationId =
          dto.initialStock && dto.initialStock > 0
            ? await this.defaultLocationId(tx)
            : null;
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO dbo.BeverageProduct
            (id, code, name, category, brand, unit, volumeMl, costPrice,
             sellingPrice, minStock, status, description, createdAt, updatedAt)
          VALUES
            (CONVERT(uniqueidentifier, ${id}), ${dto.code.trim()}, ${dto.name.trim()},
             ${dto.category?.trim() || null}, ${dto.brand?.trim() || null}, ${dto.unit.trim()},
             ${dto.volumeMl ?? null}, ${dto.costPrice}, ${dto.sellingPrice}, ${dto.minStock},
             ${dto.status ?? "ACTIVE"}, ${dto.description?.trim() || null}, SYSDATETIME(), SYSDATETIME())
        `);
        if (dto.initialStock && dto.initialStock > 0) {
          await tx.$executeRaw(Prisma.sql`
          INSERT INTO dbo.BeverageStockMovement
            (branchId, productId, movementType, quantityChange, createdById, notes)
          VALUES
            (${locationId}, CONVERT(uniqueidentifier, ${id}), N'ADJUSTMENT',
             ${dto.initialStock}, CONVERT(uniqueidentifier, ${actor.id}),
             ${dto.initialStockReason.trim()})
        `);
        }
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Mã sản phẩm đã được sử dụng.");
      }
      throw error;
    }
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_PRODUCT_CREATE",
      entity: "BeverageProduct",
      entityId: id,
      metadata: { code: dto.code, name: dto.name },
    });
    return this.product(id);
  }

  async updateProduct(
    id: string,
    dto: UpdateBeverageProductDto,
    actor: BeverageActor,
  ) {
    const current = await this.prisma.$queryRaw<{ id: string; code: string }[]>(
      Prisma.sql`
        SELECT id, code FROM dbo.BeverageProduct
        WHERE id = CONVERT(uniqueidentifier, ${id})
      `,
    );
    if (!current.length)
      throw new NotFoundException("Không tìm thấy sản phẩm nước uống");
    const assignments: Prisma.Sql[] = [];
    if (dto.code !== undefined)
      assignments.push(Prisma.sql`code = ${dto.code.trim()}`);
    if (dto.name !== undefined)
      assignments.push(Prisma.sql`name = ${dto.name.trim()}`);
    if (dto.category !== undefined)
      assignments.push(Prisma.sql`category = ${dto.category?.trim() || null}`);
    if (dto.brand !== undefined)
      assignments.push(Prisma.sql`brand = ${dto.brand?.trim() || null}`);
    if (dto.unit !== undefined)
      assignments.push(Prisma.sql`unit = ${dto.unit.trim()}`);
    if (dto.volumeMl !== undefined)
      assignments.push(Prisma.sql`volumeMl = ${dto.volumeMl}`);
    if (dto.costPrice !== undefined)
      assignments.push(Prisma.sql`costPrice = ${dto.costPrice}`);
    if (dto.sellingPrice !== undefined)
      assignments.push(Prisma.sql`sellingPrice = ${dto.sellingPrice}`);
    if (dto.minStock !== undefined)
      assignments.push(Prisma.sql`minStock = ${dto.minStock}`);
    if (dto.status !== undefined)
      assignments.push(Prisma.sql`status = ${dto.status}`);
    if (dto.description !== undefined)
      assignments.push(
        Prisma.sql`description = ${dto.description?.trim() || null}`,
      );
    if (!assignments.length)
      throw new BadRequestException("Không có thông tin cần cập nhật");
    if (dto.code !== undefined && dto.code.trim() !== current[0].code) {
      const duplicate = await this.prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`
          SELECT TOP (1) id FROM dbo.BeverageProduct
          WHERE code = ${dto.code.trim()} AND id <> CONVERT(uniqueidentifier, ${id})
        `,
      );
      if (duplicate.length)
        throw new ConflictException("Mã sản phẩm đã được sử dụng.");
    }
    assignments.push(Prisma.sql`updatedAt = SYSDATETIME()`);
    try {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE dbo.BeverageProduct
        SET ${Prisma.join(assignments, ", ")}
        WHERE id = CONVERT(uniqueidentifier, ${id})
      `);
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException("Mã sản phẩm đã được sử dụng.");
      throw error;
    }
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_PRODUCT_UPDATE",
      entity: "BeverageProduct",
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });
    return this.product(id);
  }

  async deleteProduct(id: string, actor: BeverageActor) {
    const result = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE dbo.BeverageProduct SET status = N'INACTIVE', updatedAt = SYSDATETIME()
      WHERE id = CONVERT(uniqueidentifier, ${id}) AND status <> N'INACTIVE'
    `);
    if (!result)
      throw new NotFoundException("Không tìm thấy sản phẩm đang kinh doanh");
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_PRODUCT_DEACTIVATE",
      entity: "BeverageProduct",
      entityId: id,
    });
    return { success: true };
  }

  async searchMembers(search: string) {
    const value = search?.trim();
    if (!value || value.length < 2) return [];
    const like = `%${value}%`;
    return this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT TOP (20) id, code, fullName, phone, email, status
      FROM dbo.Member
      WHERE status = N'ACTIVE'
        AND (
          fullName COLLATE Latin1_General_100_CI_AI LIKE ${like} COLLATE Latin1_General_100_CI_AI
          OR code COLLATE Latin1_General_100_CI_AI LIKE ${like} COLLATE Latin1_General_100_CI_AI
          OR phone COLLATE Latin1_General_100_CI_AI LIKE ${like} COLLATE Latin1_General_100_CI_AI
        )
      ORDER BY fullName
    `);
  }

  async createImport(dto: CreateBeverageImportDto, actor: BeverageActor) {
    const id = randomUUID();
    const code = `N-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    await this.prisma.$transaction(async (tx) => {
      const locationId = await this.defaultLocationId(tx);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO dbo.BeverageImport
          (id, code, branchId, supplierName, supplierPhone, importDate, status,
           subtotal, notes, createdById, createdAt, updatedAt)
        VALUES
          (CONVERT(uniqueidentifier, ${id}), ${code}, ${locationId},
           ${dto.supplierName?.trim() || null}, ${dto.supplierPhone?.trim() || null},
           ${dto.importDate ? new Date(dto.importDate) : new Date()}, N'DRAFT',
           0, ${dto.notes?.trim() || null}, CONVERT(uniqueidentifier, ${actor.id}),
           SYSDATETIME(), SYSDATETIME())
      `);
      for (const item of dto.items) {
        const expiryDate = item.expiryDate
          ? Prisma.sql`CAST(${new Date(item.expiryDate)} AS date)`
          : Prisma.sql`CAST(NULL AS date)`;
        const product = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM dbo.BeverageProduct WITH (UPDLOCK, HOLDLOCK)
          WHERE id = CONVERT(uniqueidentifier, ${item.productId}) AND status = N'ACTIVE'
        `);
        if (!product.length) {
          throw new BadRequestException(
            "Phiếu nhập có sản phẩm không tồn tại hoặc đã ngừng kinh doanh.",
          );
        }
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO dbo.BeverageImportItem
            (importId, productId, quantity, unitCost, batchNumber, expiryDate, notes)
          VALUES
            (CONVERT(uniqueidentifier, ${id}), CONVERT(uniqueidentifier, ${item.productId}),
             ${item.quantity}, ${item.unitCost}, ${item.batchNumber?.trim() || null},
             ${expiryDate}, ${item.notes?.trim() || null})
        `);
      }
      await tx.$executeRaw(Prisma.sql`
        UPDATE dbo.BeverageImport
        SET subtotal = (SELECT COALESCE(SUM(lineTotal), 0) FROM dbo.BeverageImportItem WHERE importId = CONVERT(uniqueidentifier, ${id})),
            updatedAt = SYSDATETIME()
        WHERE id = CONVERT(uniqueidentifier, ${id})
      `);
    });
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_IMPORT_CREATE",
      entity: "BeverageImport",
      entityId: id,
      metadata: { code, itemCount: dto.items.length },
    });
    return this.importDetail(id);
  }

  async imports(query: BeverageQueryDto) {
    this.validateRange(query);
    const filters: Prisma.Sql[] = [];
    filters.push(...this.dateFilters(query, Prisma.sql`v.importDate`));
    if (query.search) {
      const like = `%${query.search.trim()}%`;
      filters.push(
        Prisma.sql`(v.importCode LIKE ${like} OR v.supplierName LIKE ${like})`,
      );
    }
    const where = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 50);
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT v.*, creator.fullName AS createdByName, receiver.fullName AS receivedByName
      FROM dbo.vw_BeverageImportStatistics AS v
      LEFT JOIN dbo.[User] AS creator ON creator.id = v.createdById
      LEFT JOIN dbo.[User] AS receiver ON receiver.id = v.receivedById
      ${where}
      ORDER BY v.importDate DESC
      OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY
    `);
    return rows.map((row) => ({
      ...row,
      totalImportedQuantity: this.number(row.totalImportedQuantity),
      calculatedImportCost: this.number(row.calculatedImportCost),
      productLineCount: this.number(row.productLineCount),
    }));
  }

  async importDetail(id: string) {
    const headers = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT i.*, creator.fullName AS createdByName,
        receiver.fullName AS receivedByName
      FROM dbo.BeverageImport AS i
      LEFT JOIN dbo.[User] AS creator ON creator.id = i.createdById
      LEFT JOIN dbo.[User] AS receiver ON receiver.id = i.receivedById
      WHERE i.id = CONVERT(uniqueidentifier, ${id})
    `);
    if (!headers.length)
      throw new NotFoundException("Không tìm thấy phiếu nhập");
    const items = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT ii.id, ii.productId, p.code AS productCode, p.name AS productName,
        p.unit, ii.quantity, ii.unitCost, ii.lineTotal, ii.batchNumber,
        ii.expiryDate, ii.notes
      FROM dbo.BeverageImportItem AS ii
      INNER JOIN dbo.BeverageProduct AS p ON p.id = ii.productId
      WHERE ii.importId = CONVERT(uniqueidentifier, ${id})
      ORDER BY p.name
    `);
    return {
      ...headers[0],
      subtotal: this.number(headers[0].subtotal),
      items: items.map((item) => ({
        ...item,
        quantity: this.number(item.quantity),
        unitCost: this.number(item.unitCost),
        lineTotal: this.number(item.lineTotal),
      })),
    };
  }

  async receiveImport(id: string, actor: BeverageActor) {
    try {
      await this.prisma.$executeRaw(Prisma.sql`
        EXEC dbo.usp_ReceiveBeverageImport
          @ImportId = ${id},
          @ReceivedById = ${actor.id}
      `);
    } catch (error) {
      if (
        error instanceof Error &&
        /51002|khong o trang thai DRAFT|không ở trạng thái DRAFT/i.test(
          error.message,
        )
      ) {
        throw new ConflictException(
          "Phiếu nhập đã được xác nhận hoặc không còn ở trạng thái nháp.",
        );
      }
      if (error instanceof Error && /51001|51003/.test(error.message)) {
        throw new BadRequestException(
          "Phiếu nhập không tồn tại hoặc chưa có sản phẩm.",
        );
      }
      throw error;
    }
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_IMPORT_RECEIVE",
      entity: "BeverageImport",
      entityId: id,
    });
    return this.importDetail(id);
  }

  async createSale(dto: CompleteBeverageSaleDto, actor: BeverageActor) {
    const items = this.combineSaleItems(dto);
    const previousSale = await this.prisma.$queryRaw<
      { id: string; status: string }[]
    >(Prisma.sql`
      SELECT TOP (1) CONVERT(nvarchar(36), id) AS id, status
      FROM dbo.BeverageSale
      WHERE staffId = CONVERT(uniqueidentifier, ${actor.id})
        AND CHARINDEX(${`[BEVERAGE_REQUEST_ID:${dto.requestId}]`}, COALESCE(notes, N'')) > 0
    `);
    if (previousSale.length) {
      if (previousSale[0].status === "PAID") {
        return this.saleDetail(previousSale[0].id, actor);
      }
      throw new ConflictException(
        "Yêu cầu này đã được tiếp nhận nhưng chưa hoàn tất.",
      );
    }

    let saleId: string = randomUUID();
    const code = `B-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const discount = dto.discountAmount ?? 0;
    const cassoMatch =
      dto.paymentMethod === "BANK_TRANSFER"
        ? await this.cassoSaleMatch(dto, items)
        : null;
    if (dto.paymentMethod === "BANK_TRANSFER" && !cassoMatch) {
      throw new BadRequestException(
        "Chưa xác nhận được giao dịch CASSO. Hóa đơn chưa được tạo và tồn kho chưa bị trừ.",
      );
    }
    if (cassoMatch && !cassoMatch.maGd) {
      throw new BadRequestException(
        "Giao dịch CASSO không có mã giao dịch hợp lệ.",
      );
    }

    try {
      const transactionResult = await this.prisma.$transaction(
        async (tx) => {
          const lockName = `beverage-sale:${actor.id}:${dto.requestId}`;
          const lockRows = await tx.$queryRaw<{ result: number }[]>(Prisma.sql`
            DECLARE @lockResult int;
            EXEC @lockResult = sys.sp_getapplock
              @Resource = ${lockName},
              @LockMode = N'Exclusive',
              @LockOwner = N'Transaction',
              @LockTimeout = 10000;
            SELECT @lockResult AS result;
          `);
          if (this.number(lockRows[0]?.result) < 0) {
            throw new ConflictException(
              "Đang xử lý yêu cầu thanh toán này, vui lòng thử lại.",
            );
          }
          if (cassoMatch?.maGd) {
            const transactionLock = createHash("sha256")
              .update(cassoMatch.maGd)
              .digest("hex");
            const cassoLockRows = await tx.$queryRaw<{ result: number }[]>(
              Prisma.sql`
                DECLARE @lockResult int;
                EXEC @lockResult = sys.sp_getapplock
                  @Resource = ${`beverage-casso:${transactionLock}`},
                  @LockMode = N'Exclusive',
                  @LockOwner = N'Transaction',
                  @LockTimeout = 10000;
                SELECT @lockResult AS result;
              `,
            );
            if (this.number(cassoLockRows[0]?.result) < 0) {
              throw new ConflictException(
                "Giao dịch CASSO đang được xử lý, vui lòng thử lại.",
              );
            }
          }
          const previousSales = await tx.$queryRaw<
            { id: string; status: string }[]
          >(Prisma.sql`
            SELECT TOP (1) CONVERT(nvarchar(36), id) AS id, status
            FROM dbo.BeverageSale WITH (UPDLOCK, HOLDLOCK)
            WHERE staffId = CONVERT(uniqueidentifier, ${actor.id})
              AND CHARINDEX(${`[BEVERAGE_REQUEST_ID:${dto.requestId}]`}, COALESCE(notes, N'')) > 0
          `);
          if (previousSales.length) {
            if (previousSales[0].status === "PAID") {
              return { id: previousSales[0].id, created: false };
            }
            throw new ConflictException(
              "Yêu cầu này đã được tiếp nhận nhưng chưa hoàn tất.",
            );
          }
          if (cassoMatch?.maGd) {
            const marker = `[CASSO_TXN:${cassoMatch.maGd}]`;
            const previousCassoSales = await tx.$queryRaw<{ id: string }[]>(
              Prisma.sql`
                SELECT TOP (1) CONVERT(nvarchar(36), id) AS id
                FROM dbo.BeverageSale WITH (UPDLOCK, HOLDLOCK)
                WHERE CHARINDEX(${marker}, COALESCE(notes, N'')) > 0
              `,
            );
            if (previousCassoSales.length) {
              throw new ConflictException(
                "Giao dịch CASSO này đã được sử dụng cho hóa đơn khác.",
              );
            }
          }

          let shift: ActiveShift | null = null;
          if (actor.role === "STAFF") {
            const activeShifts = await tx.$queryRaw<ActiveShift[]>(Prisma.sql`
              SELECT TOP (2) CONVERT(nvarchar(36), id) AS id
              FROM dbo.StaffShift WITH (UPDLOCK, HOLDLOCK)
              WHERE staffId = CONVERT(uniqueidentifier, ${actor.id})
                AND UPPER(status) = N'IN_PROGRESS'
                AND startTime <= SYSDATETIME()
                AND endTime > SYSDATETIME()
              ORDER BY startTime DESC
            `);
            if (activeShifts.length > 1) {
              throw new ConflictException(
                "Bạn có nhiều ca đang mở cùng lúc. Hãy nhờ quản lý xử lý trước.",
              );
            }
            if (!activeShifts.length) {
              throw new ForbiddenException(
                "Bạn cần bắt đầu ca làm được phân công trước khi bán nước.",
              );
            }
            shift = activeShifts[0];
          }

          const member = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
            SELECT id FROM dbo.Member WITH (UPDLOCK, HOLDLOCK)
            WHERE id = CONVERT(uniqueidentifier, ${dto.memberId}) AND status = N'ACTIVE'
          `);
          if (!member.length) {
            throw new BadRequestException(
              "Hội viên không tồn tại hoặc không hoạt động.",
            );
          }
          const locationId = await this.defaultLocationId(tx);

          await tx.$executeRaw(Prisma.sql`
            INSERT INTO dbo.BeverageSale
              (id, code, branchId, memberId, staffId, staffShiftId, saleDate,
               status, paymentMethod, subtotal, discountAmount, totalAmount,
               notes, createdAt, updatedAt)
            VALUES
              (CONVERT(uniqueidentifier, ${saleId}), ${code}, ${locationId},
               CONVERT(uniqueidentifier, ${dto.memberId}),
               CONVERT(uniqueidentifier, ${actor.id}),
               ${shift ? Prisma.sql`CONVERT(uniqueidentifier, ${shift.id})` : Prisma.sql`NULL`},
               SYSDATETIME(), N'DRAFT', ${dto.paymentMethod}, ${discount}, ${discount}, 0,
               ${`${dto.notes?.trim() || ""}${dto.notes?.trim() ? " " : ""}[BEVERAGE_REQUEST_ID:${dto.requestId}]`},
               SYSDATETIME(), SYSDATETIME())
          `);

          for (const item of items) {
            const products = await tx.$queryRaw<any[]>(Prisma.sql`
              SELECT id, sellingPrice, costPrice
              FROM dbo.BeverageProduct WITH (UPDLOCK, HOLDLOCK)
              WHERE id = CONVERT(uniqueidentifier, ${item.productId}) AND status = N'ACTIVE'
            `);
            if (!products.length) {
              throw new BadRequestException(
                "Một sản phẩm đã ngừng kinh doanh hoặc không tồn tại.",
              );
            }
            const stock = await tx.$queryRaw<StockRow[]>(Prisma.sql`
              SELECT COALESCE(SUM(quantityChange), 0) AS stockQuantity
              FROM dbo.BeverageStockMovement WITH (UPDLOCK, HOLDLOCK)
              WHERE branchId = ${locationId}
                AND productId = CONVERT(uniqueidentifier, ${item.productId})
            `);
            if (this.number(stock[0]?.stockQuantity) < item.quantity) {
              throw new BadRequestException(
                `Tồn kho không đủ cho sản phẩm ${products[0].id}.`,
              );
            }
            await tx.$executeRaw(Prisma.sql`
              INSERT INTO dbo.BeverageSaleItem
                (saleId, productId, quantity, unitPrice, unitCost)
              VALUES
                (CONVERT(uniqueidentifier, ${saleId}),
                 CONVERT(uniqueidentifier, ${item.productId}), ${item.quantity},
                 ${products[0].sellingPrice}, ${products[0].costPrice})
            `);
          }

          const totals = await tx.$queryRaw<
            { subtotal: Prisma.Decimal | number }[]
          >(Prisma.sql`
            SELECT COALESCE(SUM(lineTotal), 0) AS subtotal
            FROM dbo.BeverageSaleItem
            WHERE saleId = CONVERT(uniqueidentifier, ${saleId})
          `);
          const subtotal = this.number(totals[0]?.subtotal);
          if (discount > subtotal) {
            throw new BadRequestException(
              "Giảm giá không được lớn hơn tổng tiền hàng.",
            );
          }
          if (
            cassoMatch?.amount !== undefined &&
            Math.abs(cassoMatch.amount - Math.round(subtotal - discount)) >=
              0.01
          ) {
            throw new ConflictException(
              "Giá sản phẩm đã thay đổi sau khi tạo mã QR. Vui lòng tạo mã thanh toán mới.",
            );
          }
          const saleNotes = [
            dto.notes?.trim(),
            `[BEVERAGE_REQUEST_ID:${dto.requestId}]`,
            dto.cassoReference ? `[CASSO_CODE:${dto.cassoReference}]` : null,
            cassoMatch?.maGd ? `[CASSO_TXN:${cassoMatch.maGd}]` : null,
          ]
            .filter(Boolean)
            .join(" ");
          await tx.$executeRaw(Prisma.sql`
            UPDATE dbo.BeverageSale
            SET subtotal = ${subtotal}, totalAmount = ${subtotal - discount},
                notes = ${saleNotes}
            WHERE id = CONVERT(uniqueidentifier, ${saleId})
          `);
          try {
            await tx.$executeRaw(Prisma.sql`
              EXEC dbo.usp_CompleteBeverageSale
                @SaleId = ${saleId}
            `);
          } catch (error) {
            if (error instanceof Error && /51012/.test(error.message)) {
              throw new ConflictException("Hóa đơn đã được hoàn tất trước đó.");
            }
            if (
              error instanceof Error &&
              /51014|Ton kho|Tồn kho/i.test(error.message)
            ) {
              throw new BadRequestException(
                "Tồn kho không đủ để hoàn tất hóa đơn.",
              );
            }
            throw error;
          }
          return { id: saleId, created: true };
        },
        {
          timeout: 15000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
      saleId = transactionResult.id;
      if (!transactionResult.created) {
        return this.saleDetail(saleId, actor);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        /UQ_BeverageSale_code|duplicate key|unique index/i.test(error.message)
      ) {
        throw new ConflictException("Mã hóa đơn bị trùng, vui lòng thử lại.");
      }
      throw error;
    }

    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_SALE_COMPLETE",
      entity: "BeverageSale",
      entityId: saleId,
      metadata: { code, memberId: dto.memberId, itemCount: items.length },
    });
    return this.saleDetail(saleId, actor);
  }

  async sales(query: BeverageQueryDto, actor: BeverageActor) {
    this.validateRange(query);
    const filters: Prisma.Sql[] = [];
    if (actor.role === "STAFF")
      filters.push(
        Prisma.sql`v.staffId = CONVERT(uniqueidentifier, ${actor.id})`,
      );
    filters.push(...this.dateFilters(query, Prisma.sql`v.saleDate`));
    if (query.search) {
      const like = `%${query.search.trim()}%`;
      filters.push(
        Prisma.sql`(v.saleCode LIKE ${like} OR v.memberName LIKE ${like} OR v.memberId IN (SELECT id FROM dbo.Member WHERE code LIKE ${like}))`,
      );
    }
    if (query.productId) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM dbo.BeverageSaleItem si
        WHERE si.saleId = v.saleId AND si.productId = CONVERT(uniqueidentifier, ${query.productId})
      )`);
    }
    const where = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 50);
    return this.prisma
      .$queryRaw<any[]>(
        Prisma.sql`
      SELECT v.*, m.code AS memberCode
      FROM dbo.vw_BeverageSalesStatistics AS v
      INNER JOIN dbo.Member AS m ON m.id = v.memberId
      ${where}
      ORDER BY v.saleDate DESC
      OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY
    `,
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          subtotal: this.number(row.subtotal),
          discountAmount: this.number(row.discountAmount),
          totalAmount: this.number(row.totalAmount),
          recognizedRevenue: this.number(row.recognizedRevenue),
          totalSoldQuantity: this.number(row.totalSoldQuantity),
          productLineCount: this.number(row.productLineCount),
        })),
      );
  }

  async saleDetail(id: string, actor?: BeverageActor) {
    const staffFilter =
      actor?.role === "STAFF"
        ? Prisma.sql`AND s.staffId = CONVERT(uniqueidentifier, ${actor.id})`
        : Prisma.empty;
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT s.*, m.code AS memberCode,
        m.fullName AS memberName, m.phone AS memberPhone, u.fullName AS staffName,
        ss.title AS shiftTitle
      FROM dbo.BeverageSale AS s
      INNER JOIN dbo.Member AS m ON m.id = s.memberId
      INNER JOIN dbo.[User] AS u ON u.id = s.staffId
      LEFT JOIN dbo.StaffShift AS ss ON ss.id = s.staffShiftId
      WHERE s.id = CONVERT(uniqueidentifier, ${id}) ${staffFilter}
    `);
    if (!rows.length)
      throw new NotFoundException("Không tìm thấy hóa đơn bán nước");
    const items = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT si.id, si.productId, p.code AS productCode, p.name AS productName,
        p.unit, p.volumeMl, si.quantity, si.unitPrice, si.unitCost, si.lineTotal
      FROM dbo.BeverageSaleItem AS si
      INNER JOIN dbo.BeverageProduct AS p ON p.id = si.productId
      WHERE si.saleId = CONVERT(uniqueidentifier, ${id})
      ORDER BY p.name
    `);
    return {
      ...rows[0],
      subtotal: this.number(rows[0].subtotal),
      discountAmount: this.number(rows[0].discountAmount),
      totalAmount: this.number(rows[0].totalAmount),
      items: items.map((item) => ({
        ...item,
        quantity: this.number(item.quantity),
        unitPrice: this.number(item.unitPrice),
        unitCost: this.number(item.unitCost),
        lineTotal: this.number(item.lineTotal),
      })),
    };
  }

  async stock(query: BeverageQueryDto, actor: BeverageActor) {
    const filters: Prisma.Sql[] = [Prisma.sql`p.status = N'ACTIVE'`];
    if (query.productId)
      filters.push(
        Prisma.sql`p.id = CONVERT(uniqueidentifier, ${query.productId})`,
      );
    if (query.category)
      filters.push(Prisma.sql`p.category = ${query.category}`);
    if (query.search) {
      const like = `%${query.search.trim()}%`;
      filters.push(Prisma.sql`(p.code LIKE ${like} OR p.name LIKE ${like})`);
    }
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.id AS productId, p.code AS productCode, p.name AS productName,
        p.category, p.unit, p.minStock,
        COALESCE(v.stockQuantity, 0) AS stockQuantity,
        CASE WHEN COALESCE(v.stockQuantity, 0) <= 0 THEN N'OUT_OF_STOCK'
             WHEN COALESCE(v.stockQuantity, 0) <= p.minStock THEN N'LOW_STOCK'
             ELSE N'IN_STOCK' END AS stockStatus
      FROM dbo.BeverageProduct AS p
      LEFT JOIN (
        SELECT productId, SUM(stockQuantity) AS stockQuantity
        FROM dbo.vw_BeverageStock
        GROUP BY productId
      ) AS v ON v.productId = p.id
      WHERE ${Prisma.join(filters, " AND ")}
      ORDER BY p.name
    `);
    return rows.map((row) => ({
      ...row,
      minStock: this.number(row.minStock),
      stockQuantity: this.number(row.stockQuantity),
    }));
  }

  async movements(query: BeverageQueryDto, actor: BeverageActor) {
    this.validateRange(query);
    const filters: Prisma.Sql[] = [];
    if (query.productId)
      filters.push(
        Prisma.sql`sm.productId = CONVERT(uniqueidentifier, ${query.productId})`,
      );
    if (query.category)
      filters.push(Prisma.sql`p.category = ${query.category}`);
    if (query.search) {
      const like = `%${query.search.trim()}%`;
      filters.push(Prisma.sql`(p.code LIKE ${like} OR p.name LIKE ${like})`);
    }
    filters.push(...this.dateFilters(query, Prisma.sql`sm.createdAt`));
    const where = filters.length
      ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT TOP (500) sm.id, sm.productId,
        p.code AS productCode, p.name AS productName, sm.movementType,
        sm.quantityChange, sm.createdAt, sm.notes, u.fullName AS createdByName
      FROM dbo.BeverageStockMovement AS sm
      INNER JOIN dbo.BeverageProduct AS p ON p.id = sm.productId
      LEFT JOIN dbo.[User] AS u ON u.id = sm.createdById
      ${where}
      ORDER BY sm.createdAt DESC
    `);
    return rows.map((row) => ({
      ...row,
      quantityChange: this.number(row.quantityChange),
    }));
  }

  async adjustStock(dto: BeverageStockAdjustmentDto, actor: BeverageActor) {
    if (!dto.reason.trim())
      throw new BadRequestException("Cần ghi lý do điều chỉnh kho.");
    const result = await this.prisma.$transaction(
      async (tx) => {
        const locationId = await this.defaultLocationId(tx);
        const product = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM dbo.BeverageProduct WITH (UPDLOCK, HOLDLOCK)
          WHERE id = CONVERT(uniqueidentifier, ${dto.productId}) AND status = N'ACTIVE'
        `);
        if (!product.length)
          throw new NotFoundException(
            "Không tìm thấy sản phẩm đang kinh doanh",
          );
        const stock = await tx.$queryRaw<
          { quantity: Prisma.Decimal | number }[]
        >(Prisma.sql`
          SELECT COALESCE(SUM(quantityChange), 0) AS quantity
          FROM dbo.BeverageStockMovement WITH (UPDLOCK, HOLDLOCK)
          WHERE branchId = ${locationId}
            AND productId = CONVERT(uniqueidentifier, ${dto.productId})
        `);
        const nextQuantity =
          this.number(stock[0]?.quantity) + dto.quantityChange;
        if (nextQuantity < -0.0005) {
          throw new BadRequestException("Điều chỉnh này làm tồn kho âm.");
        }
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO dbo.BeverageStockMovement
            (branchId, productId, movementType, quantityChange, createdById, notes)
          VALUES
            (${locationId}, CONVERT(uniqueidentifier, ${dto.productId}), N'ADJUSTMENT',
             ${dto.quantityChange}, CONVERT(uniqueidentifier, ${actor.id}), ${dto.reason.trim()})
        `);
        return { quantity: nextQuantity };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.auditService.log({
      userId: actor.id,
      action: "BEVERAGE_STOCK_ADJUST",
      entity: "BeverageStockMovement",
      metadata: {
        productId: dto.productId,
        quantityChange: dto.quantityChange,
        reason: dto.reason,
      },
    });
    return { success: true, stockQuantity: result.quantity };
  }

  async dashboard(query: BeverageQueryDto) {
    const [productRows, saleRows, profitRows, chartRows, topRows] =
      await Promise.all([
        this.prisma.$queryRaw<any[]>(Prisma.sql`
      WITH productStock AS (
        SELECT p.id, p.minStock, COALESCE(SUM(v.stockQuantity), 0) AS quantity
        FROM dbo.BeverageProduct AS p
        LEFT JOIN dbo.vw_BeverageStock AS v ON v.productId = p.id
        WHERE p.status = N'ACTIVE'
        GROUP BY p.id, p.minStock
      )
      SELECT COUNT(*) AS productCount, COALESCE(SUM(quantity), 0) AS stockQuantity,
        SUM(CASE WHEN quantity > 0 AND quantity <= minStock THEN 1 ELSE 0 END) AS lowStockCount,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) AS outOfStockCount
      FROM productStock
      `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(CASE WHEN saleDate >= CONVERT(date, SYSDATETIME()) THEN recognizedRevenue ELSE 0 END), 0) AS todayRevenue,
          COALESCE(SUM(CASE WHEN saleDate >= DATEADD(day, -((DATEDIFF(day, CONVERT(date, '19000101'), CONVERT(date, SYSDATETIME())) % 7)), CONVERT(date, SYSDATETIME())) THEN recognizedRevenue ELSE 0 END), 0) AS weekRevenue,
          COALESCE(SUM(CASE WHEN saleDate >= DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1) THEN recognizedRevenue ELSE 0 END), 0) AS monthRevenue,
          COALESCE(SUM(totalSoldQuantity), 0) AS soldQuantity
        FROM dbo.vw_BeverageSalesStatistics AS v
        WHERE v.status = N'PAID'
      `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          (SELECT COALESCE(SUM(si.lineTotal - si.quantity * si.unitCost), 0)
           FROM dbo.BeverageSaleItem AS si
           INNER JOIN dbo.BeverageSale AS s ON s.id = si.saleId
           WHERE s.status = N'PAID'
             AND s.saleDate >= DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1)
          )
          -
          (SELECT COALESCE(SUM(s.discountAmount), 0)
           FROM dbo.BeverageSale AS s
           WHERE s.status = N'PAID'
             AND s.saleDate >= DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1))
          AS grossProfit
      `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT CONVERT(nvarchar(10), CONVERT(date, saleDate), 23) AS label,
          SUM(recognizedRevenue) AS value
        FROM dbo.vw_BeverageSalesStatistics
        WHERE status = N'PAID'
          AND saleDate >= DATEADD(day, -29, CONVERT(date, SYSDATETIME()))
        GROUP BY CONVERT(date, saleDate)
        ORDER BY CONVERT(date, saleDate)
      `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT TOP (5) productId, productCode, productName, soldQuantity, salesRevenue,
          estimatedGrossProfit
        FROM dbo.vw_BeverageProductSalesStatistics
        ORDER BY soldQuantity DESC, salesRevenue DESC
      `),
      ]);
    const productMetrics = productRows[0] ?? {};
    const sales = saleRows[0] ?? {};
    return {
      products: {
        productCount: this.number(productMetrics.productCount),
        stockQuantity: this.number(productMetrics.stockQuantity),
        lowStockCount: this.number(productMetrics.lowStockCount),
        outOfStockCount: this.number(productMetrics.outOfStockCount),
      },
      soldQuantity: this.number(sales.soldQuantity),
      revenue: {
        today: this.number(sales.todayRevenue),
        week: this.number(sales.weekRevenue),
        month: this.number(sales.monthRevenue),
      },
      grossProfit: this.number(profitRows[0]?.grossProfit),
      dailyRevenue: chartRows.map((row) => ({
        label: row.label,
        value: this.number(row.value),
      })),
      topProducts: topRows.map((row) => ({
        ...row,
        soldQuantity: this.number(row.soldQuantity),
        salesRevenue: this.number(row.salesRevenue),
        estimatedGrossProfit: this.number(row.estimatedGrossProfit),
      })),
    };
  }

  async report(query: BeverageQueryDto) {
    this.validateRange(query);
    const saleFilters: Prisma.Sql[] = [Prisma.sql`v.status = N'PAID'`];
    const importFilters: Prisma.Sql[] = [Prisma.sql`v.status = N'RECEIVED'`];
    saleFilters.push(...this.dateFilters(query, Prisma.sql`v.saleDate`));
    importFilters.push(...this.dateFilters(query, Prisma.sql`v.importDate`));
    const saleWhere = Prisma.sql`WHERE ${Prisma.join(saleFilters, " AND ")}`;
    const importWhere = Prisma.sql`WHERE ${Prisma.join(importFilters, " AND ")}`;
    const bucket = {
      day: Prisma.sql`CONVERT(date, v.saleDate)`,
      week: Prisma.sql`DATEADD(day, -((DATEDIFF(day, CONVERT(date, '19000101'), CONVERT(date, v.saleDate)) % 7)), CONVERT(date, v.saleDate))`,
      month: Prisma.sql`DATEFROMPARTS(YEAR(v.saleDate), MONTH(v.saleDate), 1)`,
      year: Prisma.sql`DATEFROMPARTS(YEAR(v.saleDate), 1, 1)`,
    }[query.groupBy ?? "day"];
    const [sales, imports, profit, chart, top, slow, byStaff, byShift] =
      await Promise.all([
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT COALESCE(SUM(v.recognizedRevenue), 0) AS salesRevenue,
            COALESCE(SUM(v.totalSoldQuantity), 0) AS soldQuantity,
            COUNT(DISTINCT v.saleId) AS saleCount
          FROM dbo.vw_BeverageSalesStatistics AS v ${saleWhere}
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT COALESCE(SUM(v.calculatedImportCost), 0) AS importCost,
            COALESCE(SUM(v.totalImportedQuantity), 0) AS importedQuantity,
            COUNT(DISTINCT v.importId) AS importCount
          FROM dbo.vw_BeverageImportStatistics AS v ${importWhere}
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT
            (SELECT COALESCE(SUM(si.lineTotal - si.quantity * si.unitCost), 0)
             FROM dbo.BeverageSaleItem AS si
             INNER JOIN dbo.BeverageSale AS s ON s.id = si.saleId
             WHERE s.status = N'PAID'
               ${query.from ? Prisma.sql`AND s.saleDate >= CAST(${query.from} AS date)` : Prisma.empty}
               ${query.to ? Prisma.sql`AND s.saleDate < DATEADD(day, 1, CAST(${query.to} AS date))` : Prisma.empty})
            -
            (SELECT COALESCE(SUM(s.discountAmount), 0)
             FROM dbo.BeverageSale AS s
             WHERE s.status = N'PAID'
               ${query.from ? Prisma.sql`AND s.saleDate >= CAST(${query.from} AS date)` : Prisma.empty}
               ${query.to ? Prisma.sql`AND s.saleDate < DATEADD(day, 1, CAST(${query.to} AS date))` : Prisma.empty})
            AS grossProfit
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT CONVERT(nvarchar(10), ${bucket}, 23) AS label,
            SUM(v.recognizedRevenue) AS revenue
          FROM dbo.vw_BeverageSalesStatistics AS v ${saleWhere}
          GROUP BY ${bucket}
          ORDER BY ${bucket}
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT TOP (10) p.id AS productId, p.code AS productCode, p.name AS productName,
            COALESCE(SUM(si.quantity), 0) AS soldQuantity,
            COALESCE(SUM(si.lineTotal), 0) AS salesRevenue,
            COALESCE(SUM(si.lineTotal - si.quantity * si.unitCost), 0) AS grossProfit
          FROM dbo.BeverageProduct AS p
          LEFT JOIN dbo.BeverageSale AS s ON s.status = N'PAID'
            ${query.from ? Prisma.sql`AND s.saleDate >= CAST(${query.from} AS date)` : Prisma.empty}
            ${query.to ? Prisma.sql`AND s.saleDate < DATEADD(day, 1, CAST(${query.to} AS date))` : Prisma.empty}
          LEFT JOIN dbo.BeverageSaleItem AS si ON si.saleId = s.id AND si.productId = p.id
          GROUP BY p.id, p.code, p.name
          ORDER BY soldQuantity DESC, p.name
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT TOP (10) p.id AS productId, p.code AS productCode, p.name AS productName,
            COALESCE(SUM(si.quantity), 0) AS soldQuantity,
            COALESCE(SUM(si.lineTotal), 0) AS salesRevenue
          FROM dbo.BeverageProduct AS p
          LEFT JOIN dbo.BeverageSale AS s ON s.status = N'PAID'
            ${query.from ? Prisma.sql`AND s.saleDate >= CAST(${query.from} AS date)` : Prisma.empty}
            ${query.to ? Prisma.sql`AND s.saleDate < DATEADD(day, 1, CAST(${query.to} AS date))` : Prisma.empty}
          LEFT JOIN dbo.BeverageSaleItem AS si ON si.saleId = s.id AND si.productId = p.id
          GROUP BY p.id, p.code, p.name
          ORDER BY soldQuantity ASC, salesRevenue ASC, p.name
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT v.staffId AS id, v.staffName AS label,
            SUM(v.recognizedRevenue) AS revenue, COUNT(*) AS saleCount
          FROM dbo.vw_BeverageSalesStatistics AS v ${saleWhere}
          GROUP BY v.staffId, v.staffName ORDER BY revenue DESC
        `),
        this.prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT v.staffShiftId AS id, COALESCE(ss.title, N'Không gán ca') AS label,
            SUM(v.recognizedRevenue) AS revenue, COUNT(*) AS saleCount
          FROM dbo.vw_BeverageSalesStatistics AS v
          LEFT JOIN dbo.StaffShift AS ss ON ss.id = v.staffShiftId
          ${saleWhere}
          GROUP BY v.staffShiftId, ss.title ORDER BY revenue DESC
        `),
      ]);
    const saleSummary = sales[0] ?? {};
    const importSummary = imports[0] ?? {};
    const asNumber = (rows: any[], keys: string[]) =>
      rows.map((row) =>
        Object.fromEntries([
          ...Object.entries(row),
          ...keys.map((key) => [key, this.number(row[key])]),
        ]),
      );
    return {
      summary: {
        salesRevenue: this.number(saleSummary.salesRevenue),
        importCost: this.number(importSummary.importCost),
        grossProfit: this.number(profit[0]?.grossProfit),
        soldQuantity: this.number(saleSummary.soldQuantity),
        importedQuantity: this.number(importSummary.importedQuantity),
        saleCount: this.number(saleSummary.saleCount),
        importCount: this.number(importSummary.importCount),
      },
      revenue: chart.map((row) => ({
        label: row.label,
        revenue: this.number(row.revenue),
      })),
      topProducts: asNumber(top, [
        "soldQuantity",
        "salesRevenue",
        "grossProfit",
      ]),
      slowProducts: asNumber(slow, ["soldQuantity", "salesRevenue"]),
      byStaff: asNumber(byStaff, ["revenue", "saleCount"]),
      byShift: asNumber(byShift, ["revenue", "saleCount"]),
    };
  }

  async memberSales(query: BeverageQueryDto, actor: BeverageActor) {
    this.validateRange(query);
    const filters = this.dateFilters(query, Prisma.sql`v.saleDate`);
    const where = filters.length
      ? Prisma.sql`AND ${Prisma.join(filters, " AND ")}`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT v.saleId, v.saleCode, v.saleDate, v.status,
        v.paymentMethod, v.totalSoldQuantity, v.subtotal, v.discountAmount,
        v.totalAmount, v.recognizedRevenue, v.paidAt
      FROM dbo.vw_BeverageSalesStatistics AS v
      WHERE v.memberId = (SELECT TOP (1) id FROM dbo.Member WHERE userId = CONVERT(uniqueidentifier, ${actor.id}))
        AND v.status = N'PAID' ${where}
      ORDER BY v.saleDate DESC
    `);
    return rows.map((row) => ({
      ...row,
      totalSoldQuantity: this.number(row.totalSoldQuantity),
      subtotal: this.number(row.subtotal),
      discountAmount: this.number(row.discountAmount),
      totalAmount: this.number(row.totalAmount),
    }));
  }

  async memberSaleDetail(id: string, actor: BeverageActor) {
    const owned = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT s.id
      FROM dbo.BeverageSale AS s
      INNER JOIN dbo.Member AS m ON m.id = s.memberId
      WHERE s.id = CONVERT(uniqueidentifier, ${id})
        AND m.userId = CONVERT(uniqueidentifier, ${actor.id})
        AND s.status = N'PAID'
    `);
    if (!owned.length)
      throw new NotFoundException("Không tìm thấy hóa đơn của hội viên");
    return this.saleDetail(id);
  }
}
