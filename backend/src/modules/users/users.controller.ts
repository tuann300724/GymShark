import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { AuthService } from "../auth/auth.service";
import { CreateStaffAccountDto } from "./dto/create-staff-account.dto";
import { UpdateStaffStatusDto } from "./dto/update-staff-status.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../../prisma/prisma.service";
import {
  assertPartnerOwner,
  resolveOwnerScope,
  type ScopeActor,
} from "../../common/utils/partner-scope";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** Chủ đối tác quản lý nhân viên phòng mình; nhân viên đối tác không được quản lý nhân viên */
  private async staffScope(actor: ScopeActor) {
    if (actor?.role === Role.PARTNER) await assertPartnerOwner(this.prisma, actor.id);
    return resolveOwnerScope(this.prisma, actor);
  }

  @Get("staff")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Danh sách tài khoản nhân viên STAFF" })
  async findStaff(@CurrentUser() actor: ScopeActor, @Query("search") search?: string) {
    return this.usersService.findStaff(search, await this.staffScope(actor));
  }

  @Patch("staff/:id/status")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Khóa hoặc kích hoạt tài khoản nhân viên STAFF" })
  async updateStaffStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.usersService.updateStaffStatus(
      id,
      dto.status,
      actor.id!,
      await this.staffScope(actor),
    );
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Lấy danh sách tất cả tài khoản người dùng (ADMIN, MANAGER)",
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Lấy chi tiết một tài khoản người dùng theo ID" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post("staff")
  @Roles(Role.ADMIN, Role.MANAGER)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({
    summary: "Tạo tài khoản STAFF và gửi mật khẩu tạm thời qua email",
  })
  async createStaff(
    @Body() dto: CreateStaffAccountDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.authService.createStaffAccount(dto, actor.id!, await this.staffScope(actor));
  }
}
