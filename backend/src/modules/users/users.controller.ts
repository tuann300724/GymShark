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

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get("staff")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Danh sách tài khoản nhân viên STAFF" })
  findStaff(@Query("search") search?: string) {
    return this.usersService.findStaff(search);
  }

  @Patch("staff/:id/status")
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: "Khóa hoặc kích hoạt tài khoản nhân viên STAFF" })
  updateStaffStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStaffStatusDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.usersService.updateStaffStatus(id, dto.status, actorId);
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
  createStaff(
    @Body() dto: CreateStaffAccountDto,
    @CurrentUser("id") actorId: string,
  ) {
    return this.authService.createStaffAccount(dto, actorId);
  }
}
