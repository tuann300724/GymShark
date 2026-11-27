import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { MembershipsService } from "./memberships.service";
import type { ScopeActor } from "../../common/utils/partner-scope";
import { UpdateMembershipStatusDto } from "./dto/update-membership-status.dto";
import { ExtendMembershipDto } from "./dto/extend-membership.dto";
import { CreateCancelRequestDto } from "./dto/create-cancel-request.dto";
import { MembershipChangesService } from "./membership-changes.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums/role.enum";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Memberships")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("memberships")
export class MembershipsController {
  constructor(
    private readonly membershipsService: MembershipsService,
    private readonly membershipChangesService: MembershipChangesService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: "Lấy danh sách các hợp đồng/thẻ hội viên" })
  findAll(@CurrentUser() actor: ScopeActor) {
    return this.membershipsService.findAll(actor);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.TRAINER)
  @ApiOperation({ summary: "Lấy chi tiết một hợp đồng/thẻ hội viên" })
  findOne(@Param("id") id: string, @CurrentUser() actor: ScopeActor) {
    return this.membershipsService.findOne(id, actor);
  }

  @Patch(":id/status")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({
    summary: "Cập nhật trạng thái: SUSPENDED / ACTIVE / EXPIRED",
  })
  @ApiResponse({ status: 200, description: "Cập nhật thành công" })
  @ApiResponse({
    status: 409,
    description: "Trạng thái chuyển đổi không hợp lệ",
  })
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateMembershipStatusDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.membershipsService.updateStatus(id, dto, actor?.id, actor);
  }

  @Patch(":id/extend")
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  @ApiOperation({ summary: "Gia hạn thêm N ngày (tạo hóa đơn chờ thu tiền)" })
  @ApiResponse({ status: 200, description: "Gia hạn thành công" })
  extend(
    @Param("id") id: string,
    @Body() dto: ExtendMembershipDto,
    @CurrentUser() actor: ScopeActor,
  ) {
    return this.membershipsService.extend(id, dto, actor?.id, actor);
  }

  // ---------------- Yêu cầu hủy gói (hội viên gửi → admin duyệt) ----------------

  @Post(":id/cancel-request")
  @Roles(Role.MEMBER)
  @ApiOperation({
    summary:
      "Hội viên gửi yêu cầu hủy gói đang hoạt động (chờ admin xét duyệt)",
  })
  @ApiResponse({ status: 201, description: "Đã gửi yêu cầu hủy gói" })
  @ApiResponse({
    status: 409,
    description: "Gói không ACTIVE hoặc đã gửi yêu cầu trước đó",
  })
  createCancelRequest(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateCancelRequestDto,
  ) {
    return this.membershipChangesService.create(userId, id, {
      ...dto,
      type: "CANCEL_REFUND",
    });
  }
}
