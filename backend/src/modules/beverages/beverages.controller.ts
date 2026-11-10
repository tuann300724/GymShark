import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  BeverageProductDto,
  BeverageQueryDto,
  BeverageStockAdjustmentDto,
  CompleteBeverageSaleDto,
  CreateBeverageImportDto,
  UpdateBeverageProductDto,
} from "./dto/beverage.dto";
import { BeveragesService, BeverageActor } from "./beverages.service";

@ApiTags("Beverages")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("beverages")
export class BeveragesController {
  constructor(private readonly beveragesService: BeveragesService) {}

  @Get("options")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  options(@CurrentUser() actor: BeverageActor) {
    return this.beveragesService.options(actor);
  }

  @Get("dashboard")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Tổng quan kinh doanh nước uống" })
  dashboard(@Query() query: BeverageQueryDto) {
    return this.beveragesService.dashboard(query);
  }

  @Get("products")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  products(
    @Query() query: BeverageQueryDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.products(query, actor);
  }

  @Post("products")
  @Roles(Role.ADMIN, Role.MANAGER)
  createProduct(
    @Body() dto: BeverageProductDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.createProduct(dto, actor);
  }

  @Get("products/:id")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  product(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query() query: BeverageQueryDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.product(id, actor);
  }

  @Patch("products/:id")
  @Roles(Role.ADMIN, Role.MANAGER)
  updateProduct(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBeverageProductDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.updateProduct(id, dto, actor);
  }

  @Delete("products/:id")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({
    summary: "Ngừng kinh doanh sản phẩm, giữ nguyên lịch sử kho",
  })
  deleteProduct(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.deleteProduct(id, actor);
  }

  @Get("members")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  members(@Query("search") search: string) {
    return this.beveragesService.searchMembers(search);
  }

  @Post("imports")
  @Roles(Role.ADMIN, Role.MANAGER)
  createImport(
    @Body() dto: CreateBeverageImportDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.createImport(dto, actor);
  }

  @Get("imports")
  @Roles(Role.ADMIN, Role.MANAGER)
  imports(@Query() query: BeverageQueryDto) {
    return this.beveragesService.imports(query);
  }

  @Get("imports/:id")
  @Roles(Role.ADMIN, Role.MANAGER)
  importDetail(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.beveragesService.importDetail(id);
  }

  @Post("imports/:id/receive")
  @Roles(Role.ADMIN, Role.MANAGER)
  receiveImport(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.receiveImport(id, actor);
  }

  @Post("sales")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  createSale(
    @Body() dto: CompleteBeverageSaleDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.createSale(dto, actor);
  }

  @Get("sales")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  sales(@Query() query: BeverageQueryDto, @CurrentUser() actor: BeverageActor) {
    return this.beveragesService.sales(query, actor);
  }

  @Get("sales/:id")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  saleDetail(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.saleDetail(id, actor);
  }

  @Get("stock")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  stock(@Query() query: BeverageQueryDto, @CurrentUser() actor: BeverageActor) {
    return this.beveragesService.stock(query, actor);
  }

  @Get("stock/movements")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  movements(
    @Query() query: BeverageQueryDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.movements(query, actor);
  }

  @Post("stock/adjustments")
  @Roles(Role.ADMIN, Role.MANAGER)
  adjustStock(
    @Body() dto: BeverageStockAdjustmentDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.adjustStock(dto, actor);
  }

  @Get("reports")
  @Roles(Role.ADMIN, Role.MANAGER)
  report(@Query() query: BeverageQueryDto) {
    return this.beveragesService.report(query);
  }

  @Get("member/sales")
  @Roles(Role.MEMBER)
  mySales(
    @Query() query: BeverageQueryDto,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.memberSales(query, actor);
  }

  @Get("member/sales/:id")
  @Roles(Role.MEMBER)
  mySaleDetail(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: BeverageActor,
  ) {
    return this.beveragesService.memberSaleDetail(id, actor);
  }
}
